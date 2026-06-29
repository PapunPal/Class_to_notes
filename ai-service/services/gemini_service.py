import os
import json
import logging
import time
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        # Strip any hidden Windows carriage returns (\r), whitespaces, or quotes
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip().strip('"').strip("'")
        self.mock_mode = not self.api_key
        self.client = None
        
        if self.mock_mode:
            logger.warning("GEMINI_API_KEY not found in environment variables. Operating in MOCK MODE.")
        else:
            try:
                # Initialize new google-genai Client
                self.client = genai.Client(api_key=self.api_key)
                logger.info("New Google GenAI SDK client initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize GenAI client: {e}")
                self.mock_mode = True

    def _call_with_retry(self, fn, *args, **kwargs):
        max_retries = 2
        delay = 10  # Start with 10 seconds delay
        for attempt in range(max_retries):
            try:
                return fn(*args, **kwargs)
            except Exception as e:
                err_msg = str(e).upper()
                if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg or "RESOURCE EXHAUSTED" in err_msg:
                    if attempt < max_retries - 1:
                        logger.warning(
                            f"Gemini API rate limited (RESOURCE_EXHAUSTED). "
                            f"Retrying in {delay}s... (Attempt {attempt + 1}/{max_retries})"
                        )
                        time.sleep(delay)
                        delay *= 2  # Exponential backoff
                        continue
                raise e

    def _call_gemini(self, prompt: str, system_instruction: str = None, response_json: bool = False) -> str:
        if self.mock_mode:
            return self._generate_mock_response(prompt)
        
        try:
            model_name = "gemini-2.5-flash"
            
            # Setup configuration using types.GenerateContentConfig
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json" if response_json else "text/plain"
            )
            
            response = self._call_with_retry(
                self.client.models.generate_content,
                model=model_name,
                contents=prompt,
                config=config
            )
            return response.text.strip()
        except Exception as e:
            logger.error(f"GenAI SDK API Call failed: {e}")
            raise e

    def transcribe_audio(self, audio_path: str) -> str:
        """
        Uploads audio to Gemini using the new SDK and generates a transcript.
        """
        if self.mock_mode:
            logger.info("Mock Mode: Returning mock transcript.")
            return "This is a mock transcript of the classroom lecture. In a real environment, Google Gemini 3.5 Flash or local Whisper would transcribe the audio file into actual text here."
        
        try:
            logger.info(f"Uploading file {audio_path} using GenAI client.files...")
            audio_file = self._call_with_retry(
                self.client.files.upload,
                file=audio_path
            )
            
            # Wait for file processing in Gemini's server
            file_info = self._call_with_retry(
                self.client.files.get,
                name=audio_file.name
            )
            while file_info.state.name == "PROCESSING":
                logger.info("Waiting for audio processing in Gemini...")
                time.sleep(2)
                file_info = self._call_with_retry(
                    self.client.files.get,
                    name=audio_file.name
                )
                
            if file_info.state.name == "FAILED":
                logger.warning("Audio processing failed in Gemini API. Returning fallback transcript.")
                return "[Fallback Transcript] This is a fallback transcript generated because the uploaded audio file failed to process in the Gemini Cloud. (This commonly happens for extremely short audio recordings under 3 seconds, or if the browser recording was interrupted. Please record for a longer duration to test real transcriptions)."
                
            logger.info("Audio file processed. Generating transcript...")
            response = self._call_with_retry(
                self.client.models.generate_content,
                model="gemini-2.5-flash",
                contents=[
                    file_info,
                    "Please provide a complete and word-for-word transcript of this audio. Do not summarize, transcribe exactly what is spoken."
                ]
            )
            
            # Delete temporary audio file from GenAI storage
            try:
                self._call_with_retry(
                    self.client.files.delete,
                    name=audio_file.name
                )
                logger.info("Temporary audio file deleted from GenAI cloud storage.")
            except Exception as delete_err:
                logger.warning(f"Could not delete uploaded GenAI file: {delete_err}")
                
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini Transcription failed: {e}")
            raise e

    def clean_transcript(self, raw_transcript: str) -> str:
        system_instruction = "You are a professional editor. Clean raw classroom transcriptions by removing filler words (um, uh, like, okay, so, you know), resolving stuttering or repeated phrases, and formatting sentences properly with punctuation. Do not summarize or change the academic content. Only clean the grammar and flow."
        prompt = f"Raw Transcript:\n\n{raw_transcript}\n\nCleaned Transcript:"
        return self._call_gemini(prompt, system_instruction)

    def generate_notes(self, cleaned_transcript: str) -> str:
        system_instruction = "You are an expert educator. Create extremely detailed, student-friendly, and well-structured lecture notes in Markdown format."
        prompt = f"""
Analyze the following lecture transcript and generate structured study notes.
You must strictly format the output with the following markdown headers:

# [Topic Name]

## Introduction
Provide a comprehensive introduction to the topic.

## Definition
Give a precise and formal definition.

## Key Concepts
List and explain the core concepts.

## Detailed Explanation
Deep-dive into the explanation, structure, and details.

## Step-by-Step Working
Describe how it works step-by-step. If it's an algorithm or process, write down the logic.

## Real-World Example
Provide a practical, relatable real-world analogy or application.

## Advantages
List the benefits and pros.

## Limitations
List the cons, constraints, or drawbacks.

## Interview Questions
Provide 3-5 standard interview questions based on this topic.

## Summary
A quick summary of the notes.

Here is the transcript:
{cleaned_transcript}
"""
        return self._call_gemini(prompt, system_instruction)

    def generate_summaries(self, cleaned_transcript: str) -> dict:
        system_instruction = "You are an academic summarizer. Generate three levels of summaries (Short: 100 words, Medium: 300 words, Detailed: 500 words) in JSON format."
        prompt = f"""
Based on the following lecture transcript, generate three summaries:
1. short (around 100 words)
2. medium (around 300 words)
3. detailed (around 500 words)

Your response must be a valid JSON object with the keys "short", "medium", and "detailed".
Do not wrap the response in markdown code blocks.

Transcript:
{cleaned_transcript}
"""
        res_text = self._call_gemini(prompt, system_instruction, response_json=True)
        try:
            return json.loads(res_text)
        except Exception as e:
            logger.error(f"Failed to parse summary JSON: {e}. Raw response: {res_text}")
            return {
                "short": "Failed to generate short summary.",
                "medium": "Failed to generate medium summary.",
                "detailed": "Failed to generate detailed summary."
            }

    def generate_concepts(self, cleaned_transcript: str) -> list:
        system_instruction = "You are a terminology extractor. Extract key concepts, formulas, technical terms, and algorithms from the transcript and define them."
        prompt = f"""
From the following lecture transcript, extract all major technical terms, definitions, formulas, or algorithms.
Return them as a JSON list of objects, where each object has "term" and "definition" keys.
Do not wrap the response in markdown code blocks.

Transcript:
{cleaned_transcript}
"""
        res_text = self._call_gemini(prompt, system_instruction, response_json=True)
        try:
            return json.loads(res_text)
        except Exception as e:
            logger.error(f"Failed to parse concept JSON: {e}")
            return []

    def generate_flashcards(self, cleaned_transcript: str) -> list:
        system_instruction = "You are an educational designer. Create study flashcards (Q&A) to help students revise key definitions and concepts."
        prompt = f"""
Based on the following lecture transcript, generate 5-10 high-quality Q&A flashcards.
Return the response as a JSON array of objects, where each object has a "question" and an "answer" field.
Keep the questions challenging but concise, and answers clear and informative.
Do not wrap the response in markdown code blocks.

Transcript:
{cleaned_transcript}
"""
        res_text = self._call_gemini(prompt, system_instruction, response_json=True)
        try:
            return json.loads(res_text)
        except Exception as e:
            logger.error(f"Failed to parse flashcard JSON: {e}")
            return []

    def generate_mcqs(self, cleaned_transcript: str) -> list:
        system_instruction = "You are an examiner. Generate multiple choice questions with explanations based on a lecture transcript."
        prompt = f"""
Based on the following lecture transcript, generate 10-15 multiple choice questions (MCQs).
For each question, provide 4 options (A, B, C, D), indicate the correct option (e.g. "A" or "B"), and give a detailed explanation.
Return the response as a JSON array of objects, where each object matches this structure:
{{
  "question": "Question text here?",
  "options": [
    "A) Option A",
    "B) Option B",
    "C) Option C",
    "D) Option D"
  ],
  "correctAnswer": "A",
  "explanation": "Why this answer is correct..."
}}
Do not wrap the response in markdown code blocks.

Transcript:
{cleaned_transcript}
"""
        res_text = self._call_gemini(prompt, system_instruction, response_json=True)
        try:
            return json.loads(res_text)
        except Exception as e:
            logger.error(f"Failed to parse MCQ JSON: {e}")
            return []

    def translate_notes(self, notes_content: str, target_lang: str) -> str:
        if target_lang.lower() not in ["bengali", "hindi"]:
            return notes_content
        
        system_instruction = f"You are a professional translator. Translate the given Markdown study notes into {target_lang.capitalize()}, preserving all Markdown headings, formatting, code blocks, and math formulas exactly."
        prompt = f"Markdown Notes to translate:\n\n{notes_content}"
        return self._call_gemini(prompt, system_instruction)

    def chat_with_lecture(self, lecture_content: str, chat_history: list, question: str) -> str:
        system_instruction = "You are a friendly AI Classroom Teaching Assistant. You help students understand their lectures. Answer their questions based ONLY on the provided lecture transcript. If the information is not in the transcript, explain that it wasn't covered in the lecture but try to explain the basic concept politely."
        
        history_str = ""
        for h in chat_history[-6:]:
            history_str += f"Student: {h.get('question')}\nAssistant: {h.get('answer')}\n"
            
        prompt = f"""
Lecture Transcript Context:
\"\"\"
{lecture_content}
\"\"\"

Chat History:
{history_str}

Student Question: {question}

Provide your educational, student-friendly answer below:
"""
        return self._call_gemini(prompt, system_instruction)

    def _generate_mock_response(self, prompt: str) -> str:
        """
        Generates mock responses for local testing without a Gemini API Key.
        """
        prompt_lower = prompt.lower()
        if "flashcards" in prompt_lower:
            return json.dumps([
                {"question": "What is the main topic of this lecture?", "answer": "Mock topic: Computer Science Core Principles."},
                {"question": "Why is this algorithm efficient?", "answer": "Because it reduces the time complexity to logarithmic scale."},
                {"question": "What is the key limitation mentioned?", "answer": "It requires the input data array to be sorted."}
            ])
        elif "mcqs" in prompt_lower:
            return json.dumps([
                {
                    "question": "What is the primary condition for Binary Search to work?",
                    "options": ["A) The array must be unsorted", "B) The array must be sorted", "C) The array must be empty", "D) The array must contain strings"],
                    "correctAnswer": "B",
                    "explanation": "Binary Search compares the middle element and divides search space, which requires elements to be in sorted order."
                },
                {
                    "question": "What is the time complexity of Binary Search in the worst case?",
                    "options": ["A) O(1)", "B) O(N)", "C) O(N log N)", "D) O(log N)"],
                    "correctAnswer": "D",
                    "explanation": "Since the search space is cut in half at each step, the total steps are proportional to the logarithm base 2 of N, which is O(log N)."
                }
            ])
        elif "summaries" in prompt_lower:
            return json.dumps({
                "short": "Mock Summary (100 words): This lecture covers the foundational concepts of algorithm complexity, focusing on sorted data structures and the implementation of search algorithms. It details why binary search runs in logarithmic time and outlines its advantages and core prerequisites.",
                "medium": "Mock Summary (300 words): This lecture covers the foundational concepts of algorithm complexity, focusing on sorted data structures and the implementation of search algorithms. It details why binary search runs in logarithmic time and outlines its advantages and core prerequisites. Additionally, it highlights standard applications like database indexing and divide-and-conquer structures, providing solid student exercises.",
                "detailed": "Mock Summary (500 words): This lecture covers the foundational concepts of algorithm complexity, focusing on sorted data structures and the implementation of search algorithms. It details why binary search runs in logarithmic time and outlines its advantages and core prerequisites. Additionally, it highlights standard applications like database indexing and divide-and-conquer structures, providing solid student exercises. Real-world comparisons are drawn with linear search methods to emphasize the scale of efficiency gained."
            })
        elif "concepts" in prompt_lower:
            return json.dumps([
                {"term": "Binary Search", "definition": "An efficient search algorithm that finds the position of a target value within a sorted array."},
                {"term": "Divide and Conquer", "definition": "An algorithmic paradigm that recursively breaks down a problem into subproblems until they become simple enough to solve directly."}
            ])
        elif "markdown headers" in prompt_lower:
            return """# Binary Search and Algorithm Design

## Introduction
Welcome to today's lecture on algorithm design. Search algorithms are fundamental to computer science, allowing us to find specific elements within data structures quickly.

## Definition
**Binary Search** is an efficient searching algorithm that operates by repeatedly dividing the search interval in half.

## Key Concepts
- **Sorted Array**: Binary Search requires the array to be sorted.
- **Midpoint calculation**: `mid = low + (high - low) / 2` to avoid integer overflow.
- **Divide and Conquer**: The search space is halved after each comparison.

## Detailed Explanation
At each step, the algorithm compares the target element with the middle element of the array. If they are equal, the search is successful. If the target is smaller, the search continues in the left half. If the target is larger, it continues in the right half.

## Step-by-Step Working
1. Set `low` to 0 and `high` to `length - 1`.
2. Calculate `mid`.
3. If `arr[mid] == target`, return `mid`.
4. If `arr[mid] < target`, set `low = mid + 1`.
5. If `arr[mid] > target`, set `high = mid - 1`.
6. Repeat until `low > high`.

## Real-World Example
Think of looking for a name in a physical phone book. You don't start from page 1. You open the middle. If the name is alphabetically later, you search the right half, otherwise the left.

## Advantages
- Very fast search speed: \(O(\log N)\) time complexity.
- Highly scalable for massive datasets.

## Limitations
- The dataset MUST be sorted beforehand. Sorting adds \(O(N \log N)\) overhead.
- Requires contiguous memory (arrays).

## Interview Questions
1. Why does binary search require a sorted array?
2. How do you prevent integer overflow in midpoint calculation?
3. What is the space complexity of iterative binary search?

## Summary
Binary Search is a classic divide-and-conquer algorithm that provides \(O(\log N)\) search time on sorted arrays, making it essential for indexing and search optimization.
"""
        elif "translate" in prompt_lower:
            return f"Mock Translation of the lecture notes into the requested language. (Gemini Mock Translation Engine)"
        else:
            return "This is a mock response from the AI Service. Please supply a valid GEMINI_API_KEY in your env file to activate real AI capabilities."
