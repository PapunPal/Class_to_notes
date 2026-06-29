const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

// Import middleware
const errorHandler = require('./middleware/error.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const lectureRoutes = require('./routes/lecture.routes');
const notesRoutes = require('./routes/notes.routes');
const flashcardRoutes = require('./routes/flashcard.routes');
const mcqRoutes = require('./routes/mcq.routes');
const chatRoutes = require('./routes/chat.routes');
const { router: sseRoutes } = require('./routes/sse.routes');

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows streaming static files (audio) to other domains (React app)
}));

// Request logger
app.use(morgan('dev'));

// CORS setup
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['https://classtonote.onrender.com','http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parser & Cookie parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static folder for audio file access
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount API routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/lectures', lectureRoutes);
app.use('/notes', notesRoutes);
app.use('/flashcards', flashcardRoutes);
app.use('/mcqs', mcqRoutes);
app.use('/chat', chatRoutes);
app.use('/sse', sseRoutes);

// Catch-all 404
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
