# Class To Notes - AI Service API Documentation

This documentation lists all the Python FastAPI AI microservice endpoints, request schemas, response formats, and testing `curl` commands.

The Express backend communicates with this FastAPI service to handle audio transcription, text cleaning, NLP concept/topic detection, study guide generation (notes, summaries, flashcards, MCQs), translations, and RAG semantic searches.

---

## Base Configuration

* **Base URL:** `http://localhost:8000`
* **Content-Type:** `application/json` (except for `/transcribe` which expects `multipart/form-data`)
* **Authentication:** This microservice runs within the internal network security group and does not require header token authentication.

---

## Endpoint Index

1. **[GET /](#1-health-status-check-get-)** - Service Health Check
2. **[POST /transcribe](#2-audio-transcription-post-transcribe)** - Whisper Speech-to-Text & cleaning
3. **[POST /generate-study-materials](#3-study-materials-generation-post-generate-study-materials)** - Notes, summaries, quiz, flashcards
4. **[POST /translate](#4-language-translation-post-translate)** - Translate notes to Bengali or Hindi
5. **[POST /chat](#5-rag-notes-chat-assistant-post-chat)** - Conversational chat with lecture context
6. **[POST /embed](#6-text-embedding-generator-post-embed)** - Get vector embeddings for search
7. **[POST /semantic-search](#7-semantic-search-and-ranker-post-semantic-search)** - Cosine similarity ranking of contents

---

## 1. Health Status Check (`GET /`)
Check service online status, loaded deep learning models, and GenAI mock configuration settings.

* **URL:** `/`
* **Method:** `GET`
* **Access:** Public
* **Response Body:**
  ```json
  {
    "status": "online",
    "service": "AI Classroom Notes Generation Service",
    "whisper_loaded": false, // true if local PyTorch Whisper tiny model is active
    "keybert_loaded": true,  // true if local KeyBERT model is active
    "gemini_mock_mode": false // true if running without a GEMINI_API_KEY
  }
  ```
* **Curl Command:**
  ```bash
  curl -X GET http://localhost:8000/
  ```

---

## 2. Audio Transcription (`POST /transcribe`)
Upload an audio lecture recording (WAV, MP3, M4A, etc.) to perform speech-to-text, remove filter words, and categorize subject matter.
* **URL:** `/transcribe`
* **Method:** `POST`
* **Content-Type:** `multipart/form-data`
* **Request Payload (Form-Data):**
  * `file`: (File Binary) The raw audio recording file
* **Response Body:**
  ```json
  {
    "raw_transcript": "Umm, okay, today we are going to talk about Binary Search. So, if you have a sorted array...",
    "cleaned_transcript": "Today we are going to discuss Binary Search. When searching for a target value within a sorted array...",
    "subject": "Data Structures",
    "topic": "Binary Search",
    "subtopics": [
      "Divide and conquer",
      "Logarithmic time complexity",
      "Sorted array"
    ]
  }
  ```
* **Curl Command:**
  ```bash
  curl -X POST http://localhost:8000/transcribe \
    -F "file=@/path/to/lecture_recording.wav"
  ```

---

## 3. Study Materials Generation (`POST /generate-study-materials`)
Process a clean lecture transcript through the Gemini LLM engine to extract comprehensive study sheets.
* **URL:** `/generate-study-materials`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "cleaned_transcript": "Today we are going to discuss Binary Search. When searching for a target value within a sorted array, rather than checking elements one by one, we check the middle element first..."
  }
  ```
* **Response Body:**
  ```json
  {
    "notes": "# Introduction to Binary Search\n\n## Introduction\nSearch algorithms are a fundamental building block...",
    "summaries": {
      "short": "Binary Search is an O(log N) search algorithm operating on sorted arrays.",
      "medium": "Binary Search operates on sorted arrays by repeatedly halving the search space...",
      "detailed": "This lecture introduces Binary Search, an optimal divide-and-conquer algorithm..."
    },
    "concepts": [
      {
        "term": "Binary Search",
        "definition": "An efficient search algorithm operating on a sorted array by dividing interval in half."
      }
    ],
    "flashcards": [
      {
        "question": "What is the prerequisite for Binary Search?",
        "answer": "The input array must be sorted in ascending or descending order."
      }
    ],
    "mcqs": [
      {
        "question": "Which of the following is the time complexity of Binary Search?",
        "options": [
          "A) O(1)",
          "B) O(N)",
          "C) O(N^2)",
          "D) O(log N)"
        ],
        "correctAnswer": "D",
        "explanation": "Binary search halves the search space at each step, yielding a logarithmic time complexity."
      }
    ]
  }
  ```
* **Curl Command:**
  ```bash
  curl -X POST http://localhost:8000/generate-study-materials \
    -H "Content-Type: application/json" \
    -d "{\"cleaned_transcript\":\"Today we are going to discuss Binary Search...\"}"
  ```

---

## 4. Language Translation (`POST /translate`)
Translate Markdown formatted study notes into a target language (Bengali or Hindi) using specialized AI context translation.
* **URL:** `/translate`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "notes_content": "# Binary Search\n\n**Binary Search** is an efficient search algorithm...",
    "target_language": "bengali" // Supported values: 'bengali', 'hindi'
  }
  ```
* **Response Body:**
  ```json
  {
    "translated_notes": "# বাইনারি অনুসন্ধান\n\n**বাইনারি অনুসন্ধান** হল একটি দক্ষ অনুসন্ধান অ্যালগরিদম..."
  }
  ```
* **Curl Command:**
  ```bash
  curl -X POST http://localhost:8000/translate \
    -H "Content-Type: application/json" \
    -d "{\"notes_content\":\"# Binary Search\",\"target_language\":\"bengali\"}"
  ```

---

## 5. RAG Notes Chat Assistant (`POST /chat`)
Query the chat assistant about specific lecture details. Uses Retrieval-Augmented Generation (RAG) by passing the transcript context and chat history to avoid hallucinations.
* **URL:** `/chat`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "lecture_content": "A strict prerequisite of Binary Search is that the input array must be sorted...",
    "chat_history": [
      {
        "question": "What is the prerequisite?",
        "answer": "The array must be sorted."
      }
    ],
    "question": "Why does it need to be sorted?"
  }
  ```
* **Response Body:**
  ```json
  {
    "answer": "It needs to be sorted because the algorithm decides which half of the array to discard by comparing the target to the midpoint. If it's unsorted, the decision of which half contains the target is unpredictable."
  }
  ```
* **Curl Command:**
  ```bash
  curl -X POST http://localhost:8000/chat \
    -H "Content-Type: application/json" \
    -d "{\"lecture_content\":\"prerequisite is sorted array\",\"chat_history\":[],\"question\":\"Why does it need to be sorted?\"}"
  ```

---

## 6. Text Embedding Generator (`POST /embed`)
Generates a vector embedding array representing the semantic meaning of a text segment. Used by the search systems.
* **URL:** `/embed`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "text": "What is the time complexity of Binary Search?"
  }
  ```
* **Response Body:**
  ```json
  {
    "embedding": [
      0.01524312,
      -0.08945124,
      0.04351239
      // ... 384 dimensions for all-MiniLM-L6-v2 (or 768/1536 for Gemini models)
    ]
  }
  ```
* **Curl Command:**
  ```bash
  curl -X POST http://localhost:8000/embed \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"What is the time complexity?\"}"
  ```

---

## 7. Semantic Search and Ranker (`POST /semantic-search`)
Rank multiple items based on their semantic similarity (cosine similarity) to a user query.
* **URL:** `/semantic-search`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "query": "Time complexity log N",
    "items": [
      {
        "id": "lec_101",
        "text": "Linear Search operates in O(N) sequential iteration time.",
        "embedding": null // Optional. If missing, it computes the vector on the fly
      },
      {
        "id": "lec_102",
        "text": "Binary Search operates by halving the bounds, running in O(log N) complexity.",
        "embedding": null
      }
    ]
  }
  ```
* **Response Body:**
  ```json
  {
    "results": [
      {
        "id": "lec_102",
        "text": "Binary Search operates by halving the bounds, running in O(log N) complexity.",
        "embedding": null // returns item contents sorted descending by score match
      },
      {
        "id": "lec_101",
        "text": "Linear Search operates in O(N) sequential iteration time.",
        "embedding": null
      }
    ]
  }
  ```
* **Curl Command:**
  ```bash
  curl -X POST http://localhost:8000/semantic-search \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"complexity\",\"items\":[{\"id\":\"1\",\"text\":\"linear search\"},{\"id\":\"2\",\"text\":\"binary search\"}]}"
  ```
