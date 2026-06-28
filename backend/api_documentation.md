# Class To Notes - API Documentation

This documentation lists all the backend REST API endpoints, authorization requirements, request formats, and copy-pasteable `curl` commands for testing.

---

## Base Configuration

* **Base URL:** `http://localhost:5000`
* **Content-Type:** `application/json` (except for audio file uploads)
* **Authentication Header:** Access tokens must be passed in the `Authorization` header as a Bearer token for protected endpoints:
  ```http
  Authorization: Bearer <JWT_ACCESS_TOKEN>
  ```
* **Cookie Handling:** Token refresh and logout endpoints expect the refresh token to be present in the cookies:
  ```http
  Cookie: refreshToken=<JWT_REFRESH_TOKEN>
  ```

---

## 1. Authentication APIs (`/auth`)

### Register User
Create a new student or teacher account.
* **URL:** `/auth/register`
* **Method:** `POST`
* **Access:** Public
* **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "password123",
    "role": "teacher" // Allowed values: 'teacher', 'student' (default)
  }
  ```
* **Curl Command:**
  ```bash
  curl -X POST http://localhost:5000/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"John Doe\",\"email\":\"john.doe@example.com\",\"password\":\"password123\",\"role\":\"teacher\"}"
  ```

---

### Login User
Authenticate credentials and receive an access token and a HTTP-only refresh cookie.
* **URL:** `/auth/login`
* **Method:** `POST`
* **Access:** Public
* **Request Body:**
  ```json
  {
    "email": "john.doe@example.com",
    "password": "password123"
  }
  ```
* **Curl Command:**
  ```bash
  curl -X POST http://localhost:5000/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"john.doe@example.com\",\"password\":\"password123\"}"
  ```

---

### Refresh Access Token
Request a new access token when the current one expires by rotating the refresh token.
* **URL:** `/auth/refresh-token`
* **Method:** `POST`
* **Access:** Public (Requires `refreshToken` cookie)
* **Curl Command:**
  ```bash
  curl -X POST http://localhost:5000/auth/refresh-token \
    -b "refreshToken=YOUR_REFRESH_TOKEN_HERE"
  ```

---

### Logout User
Invalidate the current refresh token and clear client cookies.
* **URL:** `/auth/logout`
* **Method:** `POST`
* **Access:** Public (Requires `refreshToken` cookie)
* **Curl Command:**
  ```bash
  curl -X POST http://localhost:5000/auth/logout \
    -b "refreshToken=YOUR_REFRESH_TOKEN_HERE"
  ```

---

## 2. User & Profile APIs (`/users`)

### Get Current User Profile
Fetch details of the currently authenticated user session.
* **URL:** `/users/profile`
* **Method:** `GET`
* **Access:** Private (Any logged-in user)
* **Curl Command:**
  ```bash
  curl -X GET http://localhost:5000/users/profile \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
  ```

---

### Update User Profile
Modify profile fields like name, email, avatar, or password.
* **URL:** `/users/profile`
* **Method:** `PATCH`
* **Access:** Private (Any logged-in user)
* **Request Body (Optional subset of fields):**
  ```json
  {
    "name": "John Updated",
    "email": "john.updated@example.com",
    "avatar": "https://api.dicebear.com/7.x/adventurer/svg?seed=John",
    "password": "newpassword123"
  }
  ```
* **Curl Command:**
  ```bash
  curl -X PATCH http://localhost:5000/users/profile \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"John Updated\",\"email\":\"john.updated@example.com\"}"
  ```

---

### Get Admin Analytics Dashboard
Retrieve statistics for total users, teachers, students, uploaded lectures, and notes generated.
* **URL:** `/users/analytics`
* **Method:** `GET`
* **Access:** Private (Admin only)
* **Curl Command:**
  ```bash
  curl -X GET http://localhost:5000/users/analytics \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
  ```

---

### Get All Registered Users
Get the list of all registered accounts.
* **URL:** `/users`
* **Method:** `GET`
* **Access:** Private (Admin only)
* **Curl Command:**
  ```bash
  curl -X GET http://localhost:5000/users \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
  ```

---

### Delete User Account
Delete a user from the system. Admin accounts cannot be deleted.
* **URL:** `/users/:id`
* **Method:** `DELETE`
* **Access:** Private (Admin only)
* **Curl Command:**
  ```bash
  curl -X DELETE http://localhost:5000/users/60d5ec42f36f3c1a3c7c2b5e \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
  ```

---

## 3. Lecture APIs (`/lectures`)

### Create & Upload Lecture Audio
Upload a `.wav` (or other supported audio formats) file to trigger background transcription and notes generation.
* **URL:** `/lectures`
* **Method:** `POST`
* **Access:** Private (Teacher only)
* **Request Format:** `multipart/form-data`
* **Form Fields:**
  * `title`: "Lecture Topic"
  * `subject`: "Subject Name"
  * `description`: "Optional notes about the topics discussed."
  * `audio`: [File attachment (WAV, MP3, M4A, WEBM, OGG)]
* **Curl Command:**
  ```bash
  curl -X POST http://localhost:5000/lectures \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
    -F "title=Introduction to Operating Systems" \
    -F "subject=Computer Science" \
    -F "description=Covers kernels, scheduling and memory management" \
    -F "audio=@/path/to/your/audio_file.wav"
  ```

---

### Get Lectures List
List lectures. Query parameters allow filtering and searching.
* **URL:** `/lectures`
* **Method:** `GET`
* **Access:** Private (Student, Teacher, Admin)
  * *Note: Students only receive completed lectures.*
* **Query Parameters:**
  * `subject` (Optional): Filter by subject name (e.g. `?subject=Operating Systems`)
  * `search` (Optional): Matches text index of title/subject (e.g. `?search=process`)
  * `own` (Optional): Set to `'true'` for teachers to fetch only their own lectures (e.g. `?own=true`)
* **Curl Command:**
  ```bash
  curl -X GET "http://localhost:5000/lectures?subject=Computer+Science" \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
  ```

---

### Get Lecture Details by ID
Retrieve details of a single lecture.
* **URL:** `/lectures/:id`
* **Method:** `GET`
* **Access:** Private (Student, Teacher, Admin)
  * *Note: Students will receive a 403 status code if the lecture is still processing.*
* **Curl Command:**
  ```bash
  curl -X GET http://localhost:5000/lectures/60d5ec42f36f3c1a3c7c2b5f \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
  ```

---

### Delete Lecture & Materials
Delete a lecture, its audio file from the server disk, and all generated transcripts, notes, flashcards, and MCQs.
* **URL:** `/lectures/:id`
* **Method:** `DELETE`
* **Access:** Private (Teacher, Admin)
  * *Note: Teachers can only delete their own lectures.*
* **Curl Command:**
  ```bash
  curl -X DELETE http://localhost:5000/lectures/60d5ec42f36f3c1a3c7c2b5f \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
  ```

---

### Semantic Search (AI Search)
Search for lectures matching concepts semantically (powered by embeddings).
* **URL:** `/lectures/semantic-search`
* **Method:** `GET`
* **Access:** Private (Student only)
* **Query Parameters:**
  * `q` (Required): Semantic query (e.g. `?q=what is a round robin scheduling`)
* **Curl Command:**
  ```bash
  curl -X GET "http://localhost:5000/lectures/semantic-search?q=scheduling+algorithms" \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
  ```

---

### Retry Failed Lecture Processing
Restart processing for a failed lecture upload using the existing file on disk.
* **URL:** `/lectures/:id/retry`
* **Method:** `POST`
* **Access:** Private (Teacher only)
* **Curl Command:**
  ```bash
  curl -X POST http://localhost:5000/lectures/60d5ec42f36f3c1a3c7c2b5f/retry \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
  ```

---

## 4. Notes & Study Guide APIs (`/notes`)

### Get Notes List
Retrieve notes records, optionally filtered by `lectureId`.
* **URL:** `/notes`
* **Method:** `GET`
* **Access:** Private (Student, Teacher, Admin)
* **Query Parameters:**
  * `lectureId` (Optional): Filter by a specific lecture (e.g. `?lectureId=60d5ec42f36f3c1a3c7c2b5f`)
* **Curl Command:**
  ```bash
  curl -X GET "http://localhost:5000/notes?lectureId=60d5ec42f36f3c1a3c7c2b5f" \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
  ```

---

### Get Note by ID
Fetch a single note content record.
* **URL:** `/notes/:id`
* **Method:** `GET`
* **Access:** Private (Student, Teacher, Admin)
* **Curl Command:**
  ```bash
  curl -X GET http://localhost:5000/notes/60d5ec42f36f3c1a3c7c2b60 \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
  ```

---

### Edit/Update Notes Content
Allow teachers to modify generated lecture notes.
* **URL:** `/notes/:id`
* **Method:** `PATCH`
* **Access:** Private (Teacher, Admin)
* **Request Body:**
  ```json
  {
    "topic": "Updated Note Topic Name",
    "noteContent": "<h1>Introduction to OS</h1><p>Modified note text...</p>"
  }
  ```
* **Curl Command:**
  ```bash
  curl -X PATCH http://localhost:5000/notes/60d5ec42f36f3c1a3c7c2b60 \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
    -H "Content-Type: application/json" \
    -d "{\"topic\":\"Updated Note Topic Name\",\"noteContent\":\"<h1>Introduction to OS</h1><p>Modified note text...</p>\"}"
  ```

---

### Translate Notes
Request translation of the notes content to a target language (Bengali or Hindi) using the AI model.
* **URL:** `/notes/:id/translate`
* **Method:** `POST`
* **Access:** Private (Student, Teacher, Admin)
* **Request Body:**
  ```json
  {
    "language": "bengali" // Allowed values: 'bengali', 'hindi'
  }
  ```
* **Curl Command:**
  ```bash
  curl -X POST http://localhost:5000/notes/60d5ec42f36f3c1a3c7c2b60/translate \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
    -H "Content-Type: application/json" \
    -d "{\"language\":\"bengali\"}"
  ```

---

### Export Study Guide PDF
Generate and download an A4 formatted PDF document containing the lecture title, notes content, summaries, key concepts, flashcards, and MCQs.
* **URL:** `/notes/lecture/:lectureId/pdf`
* **Method:** `GET`
* **Access:** Private (Student, Teacher, Admin)
* **Curl Command (Downloads to a local file `study_guide.pdf`):**
  ```bash
  curl -X GET http://localhost:5000/notes/lecture/60d5ec42f36f3c1a3c7c2b5f/pdf \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
    --output study_guide.pdf
  ```

---

## 5. Flashcards APIs (`/flashcards`)

### Get Flashcards by Lecture ID
Retrieve the list of interactive QA flashcards for a specific lecture.
* **URL:** `/flashcards/:lectureId`
* **Method:** `GET`
* **Access:** Private (Student, Teacher, Admin)
* **Curl Command:**
  ```bash
  curl -X GET http://localhost:5000/flashcards/60d5ec42f36f3c1a3c7c2b5f \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
  ```

---

## 6. MCQ Quiz APIs (`/mcqs`)

### Get MCQs by Lecture ID
Fetch the list of practice multiple-choice questions for a specific lecture.
* **URL:** `/mcqs/:lectureId`
* **Method:** `GET`
* **Access:** Private (Student, Teacher, Admin)
* **Curl Command:**
  ```bash
  curl -X GET http://localhost:5000/mcqs/60d5ec42f36f3c1a3c7c2b5f \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
  ```

---

## 7. AI Chat Assistant APIs (`/chat`)

### Chat with Notes Context (RAG Chat)
Query the conversational assistant using custom prompts grounded in the lecture transcript.
* **URL:** `/chat`
* **Method:** `POST`
* **Access:** Private (Student only)
* **Request Body:**
  ```json
  {
    "lectureId": "60d5ec42f36f3c1a3c7c2b5f",
    "question": "Explain the difference between paging and segmentation discussed in this lecture."
  }
  ```
* **Curl Command:**
  ```bash
  curl -X POST http://localhost:5000/chat \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
    -H "Content-Type: application/json" \
    -d "{\"lectureId\":\"60d5ec42f36f3c1a3c7c2b5f\",\"question\":\"Explain the difference between paging and segmentation discussed in this lecture.\"}"
  ```
