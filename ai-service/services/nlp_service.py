import re
import logging
import nltk

logger = logging.getLogger(__name__)

# Ensure NLTK datasets are downloaded
for resource in ['punkt', 'stopwords', 'wordnet', 'omw-1.4']:
    try:
        nltk.data.find(f'corpora/{resource}' if resource != 'punkt' else f'tokenizers/{resource}')
    except LookupError:
        logger.info(f"Downloading NLTK resource: {resource}...")
        nltk.download(resource, quiet=True)

from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize

# Try to import spaCy and KeyBERT
try:
    import spacy
    try:
        nlp = spacy.load("en_core_web_sm")
    except OSError:
        logger.info("Downloading spaCy model en_core_web_sm...")
        spacy.cli.download("en_core_web_sm")
        nlp = spacy.load("en_core_web_sm")
    SPACY_AVAILABLE = True
except ImportError:
    logger.warning("spaCy is not installed. Using basic NLTK and regex instead.")
    SPACY_AVAILABLE = False

try:
    from keybert import KeyBERT
    KEYBERT_AVAILABLE = True
except ImportError:
    logger.warning("KeyBERT is not installed. Will use NLTK/TF-IDF for keyword extraction.")
    KEYBERT_AVAILABLE = False

class NLPService:
    def __init__(self):
        self.kw_model = None

    def clean_transcript_locally(self, text: str) -> str:
        """
        Removes basic filler words and normalizes spacing.
        """
        filler_words = r'\b(um+|uh+|like|okay|so|you know|right|ah+)\b'
        
        # Lowercase check, but we keep case in final text
        # Simple case-insensitive replacement
        cleaned = re.sub(filler_words, '', text, flags=re.IGNORECASE)
        
        # Clean double spaces and punctuation gaps
        cleaned = re.sub(r'\s+', ' ', cleaned)
        cleaned = re.sub(r'\s+([.,!?])', r'\1', cleaned)
        
        # Capitalize start of sentences
        sentences = sent_tokenize(cleaned.strip())
        capitalized_sentences = []
        for sent in sentences:
            if sent:
                capitalized_sentences.append(sent[0].upper() + sent[1:])
        
        return " ".join(capitalized_sentences)

    def extract_keywords(self, text: str, top_n: int = 5) -> list:
        """
        Extract key phrases from the transcript.
        Uses KeyBERT if available, falls back to NLTK stopword filtering and frequency analysis.
        """
        if not text:
            return []
            
        if KEYBERT_AVAILABLE:
            if not self.kw_model:
                try:
                    logger.info("Lazy-loading KeyBERT model...")
                    self.kw_model = KeyBERT()
                    logger.info("KeyBERT model loaded.")
                except Exception as e:
                    logger.error(f"Failed to load KeyBERT: {e}")
            if self.kw_model:
                try:
                    keywords = self.kw_model.extract_keywords(text, keyphrase_ngram_range=(1, 2), stop_words='english', top_n=top_n)
                    return [kw[0] for kw in keywords]
                except Exception as e:
                    logger.error(f"KeyBERT keyword extraction failed: {e}")
                
        # NLTK/Regex Fallback
        try:
            words = word_tokenize(text.lower())
            stop_words = set(stopwords.words('english'))
            # Filter non-alphabetic and stopwords
            filtered_words = [w for w in words if w.isalnum() and w not in stop_words and len(w) > 3]
            
            # Simple frequency distribution
            freq = nltk.FreqDist(filtered_words)
            return [item[0] for item in freq.most_common(top_n)]
        except Exception as e:
            logger.error(f"Fallback keyword extraction failed: {e}")
            return []

    def detect_topic_metadata(self, text: str, gemini_service=None) -> dict:
        """
        Extract Subject, Main Topic, and Subtopics.
        Uses Gemini if provided (recommended for accuracy), or local fallback NLP.
        """
        if gemini_service and not gemini_service.mock_mode:
            try:
                system_instruction = "You are a curriculum classifier. Analyze the lecture transcript and return subject, topic, and subtopics as JSON."
                prompt = f"""
Analyze the following lecture transcript. Identify:
1. The Subject (e.g. Computer Science, Physics, Chemistry, Calculus, History)
2. The Main Topic (e.g. Binary Search, Thermodynamics, Linear Regression, French Revolution)
3. 3-5 Subtopics discussed (e.g. Sorted Arrays, Divide and Conquer, Time Complexity)

Your response must be a valid JSON object matching this schema:
{{
  "subject": "Name of Subject",
  "topic": "Name of Main Topic",
  "subtopics": ["Subtopic 1", "Subtopic 2", "Subtopic 3"]
}}
Do not wrap response in markdown code blocks.

Transcript:
{text[:2000]}
"""
                import json
                res_text = gemini_service._call_gemini(prompt, system_instruction, response_json=True)
                return json.loads(res_text)
            except Exception as e:
                logger.error(f"Gemini topic detection failed: {e}")
                
        # Local Fallback
        keywords = self.extract_keywords(text, top_n=5)
        subject = "General Education"
        topic = keywords[0].capitalize() if keywords else "Class Lecture"
        subtopics = [k.capitalize() for k in keywords[1:]] if len(keywords) > 1 else ["General Concepts", "Lecture Details"]
        
        return {
            "subject": subject,
            "topic": topic,
            "subtopics": subtopics
        }
