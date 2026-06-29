import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Sparkles, 
  BookOpen, 
  ArrowRight, 
  Sun, 
  Moon, 
  Check, 
  Bot, 
  Mic, 
  Download, 
  FileText, 
  HelpCircle, 
  Menu, 
  X,
  Zap,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';

const LandingPage = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Helper to resolve user dashboard route based on role
  const getDashboardRoute = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'teacher') return '/teacher';
    return '/student';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-darkBg text-slate-800 dark:text-slate-100 transition-colors duration-300 font-sans">
      
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-darkBg/70 border-b border-slate-200 dark:border-darkBg-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-primary dark:bg-primary-light p-2 rounded-xl text-white">
              <Sparkles className="w-5 h-5 text-success" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent dark:from-white dark:to-accent-light bg-clip-text text-transparent">
              ClassToNotes
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold">
            <a href="#features" className="text-slate-600 dark:text-slate-300 hover:text-accent dark:hover:text-success transition-colors">Features</a>
            <a href="#how-it-works" className="text-slate-600 dark:text-slate-300 hover:text-accent dark:hover:text-success transition-colors">How It Works</a>
            <a href="#stats" className="text-slate-600 dark:text-slate-300 hover:text-accent dark:hover:text-success transition-colors">Impact</a>
          </nav>

          {/* Right Section */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-xl border border-slate-200 dark:border-darkBg-border hover:bg-slate-100 dark:hover:bg-darkBg-card transition-colors text-slate-500 dark:text-slate-400"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400 animate-pulse" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <Link 
                to={getDashboardRoute()} 
                className="bg-primary dark:bg-primary-light hover:bg-secondary text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center space-x-1 shadow-premium transition-all"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-slate-700 dark:text-slate-200 hover:text-accent font-semibold px-4 py-2 text-sm transition-colors"
                >
                  Log In
                </Link>
                <Link 
                  to="/register" 
                  className="bg-primary dark:bg-primary-light hover:bg-secondary text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-premium transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 md:hidden">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-xl border border-slate-200 dark:border-darkBg-border text-slate-500 dark:text-slate-400"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="p-2 rounded-xl border border-slate-200 dark:border-darkBg-border text-slate-700 dark:text-slate-200"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-darkBg border-b border-slate-200 dark:border-darkBg-border px-4 py-4 space-y-3 flex flex-col text-sm font-semibold transition-all">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-600 dark:text-slate-300 hover:text-accent py-2 transition-colors"
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-600 dark:text-slate-300 hover:text-accent py-2 transition-colors"
            >
              How It Works
            </a>
            <a 
              href="#stats" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-600 dark:text-slate-300 hover:text-accent py-2 transition-colors"
            >
              Impact
            </a>
            <div className="border-t border-slate-200 dark:border-darkBg-border pt-4 flex flex-col space-y-2">
              {user ? (
                <Link 
                  to={getDashboardRoute()} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-primary dark:bg-primary-light hover:bg-secondary text-white py-3 rounded-xl text-center font-bold shadow-premium transition-all"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-slate-700 dark:text-slate-200 hover:text-accent py-3 rounded-xl border border-slate-200 dark:border-darkBg-border text-center font-semibold transition-colors"
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-primary dark:bg-primary-light hover:bg-secondary text-white py-3 rounded-xl text-center font-bold shadow-premium transition-all"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/10 dark:bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-success/10 dark:bg-success/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-slate-100 dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border px-3.5 py-1.5 rounded-full text-xs font-semibold text-accent dark:text-success mb-6">
            <Sparkles className="w-3.5 h-3.5 text-success" />
            <span>Google Gemini-Powered Notebooks</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-sans leading-tight tracking-tight max-w-4xl mx-auto text-slate-900 dark:text-white">
            Transform Classroom Lectures into{' '}
            <span className="bg-gradient-to-r from-accent to-success bg-clip-text text-transparent">
              Smart Study Notes
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Record class discussions natively or upload MP3 files. Our AI builds structured study guides, summaries, interactive flashcards, practice quizzes, and an AI chat assistant.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to={getDashboardRoute()} 
              className="w-full sm:w-auto bg-primary dark:bg-primary-light hover:bg-secondary text-white px-8 py-4 rounded-2xl text-base font-bold flex items-center justify-center space-x-2 shadow-premium hover:-translate-y-0.5 transition-all duration-200"
            >
              <span>Start Learning Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href="#how-it-works" 
              className="w-full sm:w-auto bg-white/80 dark:bg-darkBg-card/80 hover:bg-slate-100 dark:hover:bg-darkBg-card border border-slate-200 dark:border-darkBg-border px-8 py-4 rounded-2xl text-base font-semibold flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors"
            >
              See How It Works
            </a>
          </div>

          {/* Premium UI Mockup */}
          <div className="mt-16 lg:mt-24 max-w-5xl mx-auto rounded-3xl border border-slate-200 dark:border-darkBg-border p-3 sm:p-4 bg-slate-100/50 dark:bg-slate-900/30 backdrop-blur-md shadow-premium relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-success/5 rounded-3xl pointer-events-none"></div>
            
            {/* Header controls of Mock UI */}
            <div className="bg-white dark:bg-darkBg-card rounded-2xl overflow-hidden shadow-glass border border-slate-200 dark:border-slate-800 text-left">
              <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-darkBg/50">
                <div className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-slate-400 font-mono ml-4">Notebook #6a3bf8... / Introduction to Binary Search</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-success-dark/20 text-success text-xs font-bold px-2.5 py-1 rounded-full">Completed</span>
                </div>
              </div>

              {/* Grid content of Mock UI */}
              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[400px]">
                
                {/* Side tabs */}
                <div className="lg:col-span-3 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-darkBg-card/50 p-4 space-y-2">
                  <div className="flex items-center space-x-2.5 bg-primary/10 dark:bg-primary/20 text-accent dark:text-success p-2.5 rounded-xl font-bold text-sm">
                    <FileText className="w-4 h-4" />
                    <span>Study Notes</span>
                  </div>
                  <div className="flex items-center space-x-2.5 text-slate-500 hover:text-slate-800 dark:hover:text-white p-2.5 rounded-xl font-semibold text-sm">
                    <BookOpen className="w-4 h-4" />
                    <span>Summaries</span>
                  </div>
                  <div className="flex items-center space-x-2.5 text-slate-500 hover:text-slate-800 dark:hover:text-white p-2.5 rounded-xl font-semibold text-sm">
                    <Zap className="w-4 h-4" />
                    <span>Flashcards</span>
                  </div>
                  <div className="flex items-center space-x-2.5 text-slate-500 hover:text-slate-800 dark:hover:text-white p-2.5 rounded-xl font-semibold text-sm">
                    <GraduationCap className="w-4 h-4" />
                    <span>Practice Quiz</span>
                  </div>
                  <div className="flex items-center space-x-2.5 text-slate-500 hover:text-slate-800 dark:hover:text-white p-2.5 rounded-xl font-semibold text-sm">
                    <Bot className="w-4 h-4" />
                    <span>AI Assistant</span>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-9 p-6 space-y-4">
                  <div className="prose dark:prose-invert max-w-none">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Core Concept: Binary Search</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                      Binary Search is an efficient algorithm that searches a sorted array by repeatedly dividing the search space in half. Instead of querying index-by-index in O(N) linear time, it isolates the target index in logarithmic O(log N) operations.
                    </p>
                    <div className="bg-slate-50 dark:bg-darkBg/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 font-mono text-xs text-slate-600 dark:text-slate-300 mt-4">
                      {`mid = low + (high - low) / 2;\nif (arr[mid] === target) return mid;\nif (target < arr[mid]) high = mid - 1;`}
                    </div>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between items-center text-xs text-slate-400">
                    <span>Export layout: Classic Grid</span>
                    <button className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= STATS SECTION ================= */}
      <section id="stats" className="border-y border-slate-200 dark:border-darkBg-border bg-slate-100/50 dark:bg-darkBg-card/20 py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <span className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-accent to-success bg-clip-text text-transparent">98%</span>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-semibold">Gemini Transcription Accuracy</p>
          </div>
          <div>
            <span className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-accent to-success bg-clip-text text-transparent">10x</span>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-semibold">Faster Study Guide Compilation</p>
          </div>
          <div>
            <span className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-accent to-success bg-clip-text text-transparent">25MB</span>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-semibold">Compressed Opus Audio (vs. 300MB WAV)</p>
          </div>
        </div>
      </section>

      {/* ================= FEATURES GRID ================= */}
      <section id="features" className="py-20 lg:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-black font-sans tracking-tight text-slate-900 dark:text-white">
            Packed with Powerful Features
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-4 text-base sm:text-lg">
            Everything both teachers and students need to streamline study materials and keep knowledge retained.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {/* Card 1 */}
          <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 rounded-2xl shadow-premium">
            <div className="bg-accent/15 dark:bg-accent/10 w-12 h-12 rounded-xl flex items-center justify-center text-accent mb-6">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Microphone Recording</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2.5 leading-relaxed">
              Record lectures directly inside your browser. Saves in compressed WebM/Opus formats to reduce files 11x for instant uploads on slow networks.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 rounded-2xl shadow-premium">
            <div className="bg-success/15 dark:bg-success/10 w-12 h-12 rounded-xl flex items-center justify-center text-success mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gemini Transcription</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2.5 leading-relaxed">
              Google Gemini Cloud APIs accurately parse verbal lectures, automatically deleting filler words (like "um" and "uh") for clean transcripts.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 rounded-2xl shadow-premium">
            <div className="bg-primary/15 dark:bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-accent dark:text-primary-light mb-6">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Note Generation</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2.5 leading-relaxed">
              Creates beautifully structured Markdown notes, brief/medium/detailed summaries, and core vocabulary definitions.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 rounded-2xl shadow-premium">
            <div className="bg-accent/15 dark:bg-accent/10 w-12 h-12 rounded-xl flex items-center justify-center text-accent mb-6">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Interactive AI Assistant</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2.5 leading-relaxed">
              A context-aware AI tutor lets students ask questions about specific classes, request code fragments, or query formulas from their notes.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 rounded-2xl shadow-premium">
            <div className="bg-success/15 dark:bg-success/10 w-12 h-12 rounded-xl flex items-center justify-center text-success mb-6">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Custom PDF Downloads</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2.5 leading-relaxed">
              Export study materials in styled themes. Selectively include notes, summaries, flashcards, or practice quizzes in the compiled document.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 rounded-2xl shadow-premium">
            <div className="bg-primary/15 dark:bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-accent dark:text-primary-light mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Smart Attempt Protection</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2.5 leading-relaxed">
              Fail-safe backend retry loops bypass successful transcription steps, avoiding duplicate AI charges and Cloudinary uploads.
            </p>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how-it-works" className="py-20 lg:py-32 bg-slate-100/50 dark:bg-darkBg-card/10 border-y border-slate-200 dark:border-darkBg-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-black font-sans tracking-tight text-slate-900 dark:text-white">
              The Learning Loop
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-4 text-base">
              From spoken word to deep comprehension. Here is how ClassToNotes works in practice.
            </p>
          </div>

          <div className="relative border-l border-slate-200 dark:border-darkBg-border max-w-3xl mx-auto pl-8 space-y-12">
            
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -left-12 top-0 bg-primary dark:bg-primary-light border-4 border-white dark:border-darkBg w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-premium">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upload or Record</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed">
                The teacher uploads a recorded lecture audio file or starts recording straight from the browser microphone. The audio is securely hosted on Cloudinary and instantly dispatched for translation.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -left-12 top-0 bg-primary dark:bg-primary-light border-4 border-white dark:border-darkBg w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-premium">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Processing Pipeline</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed">
                Our lightweight Python AI service processes the audio using Google Gemini's audio-native parsing. It generates clean, structured study notes and flashcards, while updating status indicators in real-time via Server-Sent Events (SSE).
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -left-12 top-0 bg-primary dark:bg-primary-light border-4 border-white dark:border-darkBg w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-premium">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Studying</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed">
                Students log into their dashboard to access the lecture notes, review flashcards, solve customized MCQ quizzes, export styled PDFs, and query the contextual AI chat assistant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="py-20 lg:py-32 max-w-5xl mx-auto px-4 text-center">
        <div className="bg-gradient-to-br from-primary to-accent dark:from-darkBg-card dark:to-darkBg-border p-8 sm:p-12 lg:p-16 rounded-3xl text-white shadow-premium border border-slate-200 dark:border-darkBg-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-success/10 pointer-events-none"></div>
          <h2 className="text-3xl sm:text-4xl font-black font-sans leading-tight relative z-10">
            Ready to upgrade your classroom workflow?
          </h2>
          <p className="text-slate-200 dark:text-slate-300 mt-4 text-sm sm:text-base max-w-xl mx-auto leading-relaxed relative z-10">
            Deploy notes instantly, help students study actively, and keep all materials in one organized dashboard.
          </p>
          <div className="mt-8 relative z-10">
            <Link 
              to="/register" 
              className="inline-flex bg-success hover:bg-success-dark text-slate-950 px-8 py-4 rounded-2xl text-base font-bold shadow-premium hover:-translate-y-0.5 transition-all"
            >
              Get Started for Free
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-200 dark:border-darkBg-border bg-white dark:bg-darkBg py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
          {/* Brand */}
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-success" />
            <span className="font-bold text-slate-900 dark:text-white">ClassToNotes</span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-500 dark:text-slate-400 font-medium">
            <a href="#features" className="hover:text-accent transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-accent transition-colors">How It Works</a>
            <a href="#stats" className="hover:text-accent transition-colors">Impact</a>
            <Link to="/login" className="hover:text-accent transition-colors">Portal Login</Link>
          </div>

          {/* Copyright */}
          <div className="text-slate-400 dark:text-slate-500 text-xs">
            &copy; {new Date().getFullYear()} ClassToNotes. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
