import os
import shutil
import logging
from typing import List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Import services
from services.whisper_service import WhisperService
from services.nlp_service import NLPService
from services.gemini_service import GeminiService
from services.embedding_service import EmbeddingService

app = FastAPI(title="AI Classroom Notes Service", version="1.0.0")

# Setup CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Services
whisper_service = WhisperService()
nlp_service = NLPService()
gemini_service = GeminiService()
embedding_service = EmbeddingService()

# Ensure temp directory exists for uploads (supports writable system temp fallback on read-only filesystems)
import tempfile
TEMP_DIR = os.getenv("TEMP_DIR")
if not TEMP_DIR:
    TEMP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp_uploads")
    # If the app directory is not writable (read-only filesystem), use the system's temporary directory
    if not os.access(os.path.dirname(os.path.abspath(__file__)), os.W_OK):
        TEMP_DIR = tempfile.gettempdir()

os.makedirs(TEMP_DIR, exist_ok=True)
logger.info(f"Using temporary uploads directory: {TEMP_DIR}")

class StudyMaterialsRequest(BaseModel):
    cleaned_transcript: str

class TranslationRequest(BaseModel):
    notes_content: str
    target_language: str

class ChatMessage(BaseModel):
    question: str
    answer: str

class ChatRequest(BaseModel):
    lecture_content: str
    chat_history: List[ChatMessage]
    question: str

class SearchItem(BaseModel):
    id: str
    text: str
    embedding: List[float] = None

class SearchRequest(BaseModel):
    query: str
    items: List[SearchItem]

class EmbedRequest(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "AI Classroom Notes Generation Service",
        "whisper_loaded": whisper_service.model is not None,
        "keybert_loaded": nlp_service.kw_model is not None,
        "gemini_mock_mode": gemini_service.mock_mode
    }

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(None), audio_url: str = Form(None)):
    """
    Transcribes audio file using local Whisper or Gemini fallback.
    Cleans transcript and extracts topics.
    """
    if audio_url:
        logger.info(f"Received audio URL for transcription: {audio_url}")
        clean_url = audio_url.split("?")[0]
        file_ext = os.path.splitext(clean_url)[1] or ".wav"
        temp_file_path = os.path.join(TEMP_DIR, f"download_{os.urandom(8).hex()}{file_ext}")
        
        try:
            import requests
            response = requests.get(audio_url, stream=True)
            response.raise_for_status()
            with open(temp_file_path, "wb") as buffer:
                for chunk in response.iter_content(chunk_size=8192):
                    buffer.write(chunk)
        except Exception as e:
            logger.error(f"Failed to download audio from URL: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to download audio: {str(e)}")
            
    elif file:
        logger.info(f"Received audio file for transcription: {file.filename}")
        file_ext = os.path.splitext(file.filename)[1]
        temp_file_path = os.path.join(TEMP_DIR, f"upload_{os.urandom(8).hex()}{file_ext}")
        
        try:
            with open(temp_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            logger.error(f"Failed to save uploaded file: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    else:
        raise HTTPException(status_code=400, detail="Either file or audio_url must be provided.")
        
    try:
        # Perform transcription
        # Pass Gemini's transcribe_audio as the fallback method
        raw_transcript = whisper_service.transcribe(
            temp_file_path, 
            gemini_fallback_fn=gemini_service.transcribe_audio
        )
        
        if not raw_transcript:
            raise HTTPException(status_code=500, detail="Transcription resulted in empty text.")
            
        # Clean Transcript
        # Try Gemini cleaning first, fallback to local NLP
        try:
            cleaned_transcript = gemini_service.clean_transcript(raw_transcript)
        except Exception as e:
            logger.warning(f"Gemini cleaning failed, using local NLP: {e}")
            cleaned_transcript = nlp_service.clean_transcript_locally(raw_transcript)
            
        # Detect topics
        topic_meta = nlp_service.detect_topic_metadata(cleaned_transcript, gemini_service)
        
        return {
            "raw_transcript": raw_transcript,
            "cleaned_transcript": cleaned_transcript,
            "subject": topic_meta.get("subject", "General"),
            "topic": topic_meta.get("topic", "Lecture Topic"),
            "subtopics": topic_meta.get("subtopics", [])
        }
        
    except Exception as e:
        logger.error(f"Error processing transcription: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.post("/generate-study-materials")
def generate_study_materials(request: StudyMaterialsRequest):
    """
    Generates Notes, Summaries, Concepts, Flashcards, and MCQs in parallel or sequential calls.
    """
    cleaned_transcript = request.cleaned_transcript
    if not cleaned_transcript:
        raise HTTPException(status_code=400, detail="Cleaned transcript cannot be empty.")
        
    try:
        notes = gemini_service.generate_notes(cleaned_transcript)
        summaries = gemini_service.generate_summaries(cleaned_transcript)
        concepts = gemini_service.generate_concepts(cleaned_transcript)
        flashcards = gemini_service.generate_flashcards(cleaned_transcript)
        mcqs = gemini_service.generate_mcqs(cleaned_transcript)
        
        return {
            "notes": notes,
            "summaries": summaries,
            "concepts": concepts,
            "flashcards": flashcards,
            "mcqs": mcqs
        }
    except Exception as e:
        logger.error(f"Error generating study materials: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/translate")
def translate(request: TranslationRequest):
    """
    Translates markdown study notes into Bengali or Hindi.
    """
    try:
        translated_notes = gemini_service.translate_notes(request.notes_content, request.target_language)
        return {"translated_notes": translated_notes}
    except Exception as e:
        logger.error(f"Error translating notes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
def chat(request: ChatRequest):
    """
    RAG chat query based on lecture content and student's history.
    """
    try:
        # Convert ChatMessage items to plain dict list for service
        history_dicts = [{"question": m.question, "answer": m.answer} for m in request.chat_history]
        answer = gemini_service.chat_with_lecture(
            request.lecture_content, 
            history_dicts, 
            request.question
        )
        return {"answer": answer}
    except Exception as e:
        logger.error(f"Error in AI Chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/embed")
def embed_text(request: EmbedRequest):
    """
    Generates text embedding.
    """
    try:
        vector = embedding_service.get_embedding(
            request.text, 
            gemini_api_key=os.getenv("GEMINI_API_KEY")
        )
        return {"embedding": vector}
    except Exception as e:
        logger.error(f"Error embedding text: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/semantic-search")
def search(request: SearchRequest):
    """
    Ranks items based on semantic cosine similarity to query.
    """
    try:
        # Map Pydantic models to dicts
        items_dict = []
        for item in request.items:
            items_dict.append({
                "id": item.id,
                "text": item.text,
                "embedding": item.embedding
            })
            
        results = embedding_service.semantic_search(
            request.query, 
            items_dict, 
            text_field="text", 
            gemini_api_key=os.getenv("GEMINI_API_KEY")
        )
        return {"results": results}
    except Exception as e:
        logger.error(f"Error in semantic search: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
