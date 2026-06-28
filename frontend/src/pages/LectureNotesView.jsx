import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import {
  FileText,
  HelpCircle,
  MessageSquare,
  Sparkles,
  Award,
  BookOpen,
  ArrowLeft,
  Download,
  Languages,
  CheckCircle,
  XCircle,
  HelpCircle as HelpIcon,
  Bot,
  User,
  Send,
  RotateCcw,
  Settings
} from 'lucide-react';

const LectureNotesView = () => {
  const { lectureId } = useParams();

  const [lecture, setLecture] = useState(null);
  const [notes, setNotes] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [mcqs, setMCQs] = useState([]);

  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'summary' | 'flashcards' | 'quiz' | 'chat'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Notes Page State
  const [displayContent, setDisplayContent] = useState('');
  const [activeLanguage, setActiveLanguage] = useState('original'); // 'original' | 'bengali' | 'hindi'
  const [translating, setTranslating] = useState(false);

  // Summary Page State
  const [summaryLevel, setSummaryLevel] = useState('medium'); // 'short' | 'medium' | 'detailed'

  // Quiz Page State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null); // 'A' | 'B' | 'C' | 'D'
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // PDF Customization State
  const [pdfTheme, setPdfTheme] = useState('classic');
  const [pdfIncludeFlashcards, setPdfIncludeFlashcards] = useState(true);
  const [pdfIncludeMCQs, setPdfIncludeMCQs] = useState(true);
  const [showPdfSettings, setShowPdfSettings] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  // Chat Page State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Lecture details
        const lectureRes = await api.get(`/lectures/${lectureId}`);
        setLecture(lectureRes.data.lecture);

        // Fetch Study Notes
        const notesRes = await api.get(`/notes?lectureId=${lectureId}`);
        if (notesRes.data.notes && notesRes.data.notes.length > 0) {
          const notesObj = notesRes.data.notes[0];
          setNotes(notesObj);
          setDisplayContent(notesObj.noteContent);
        }

        // Fetch Flashcards
        const flashRes = await api.get(`/flashcards/${lectureId}`);
        setFlashcards(flashRes.data.flashcards);

        // Fetch MCQs
        const mcqsRes = await api.get(`/mcqs/${lectureId}`);
        setMCQs(mcqsRes.data.mcqs);

        // Initialize Chat Greetings
        setChatMessages([
          {
            role: 'assistant',
            text: `Hi! Let's review the lecture content. You can ask me to explain algorithms, clarify terms, or break down any sections. Go ahead!`
          }
        ]);

      } catch (err) {
        console.error(err);
        setError('Failed to fetch study notebooks.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [lectureId]);

  // Scroll to bottom on Chat update
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading, activeTab]);

  // Notes PDF Downloader
  const handleDownloadPDF = async () => {
    try {
      setError('');
      setPdfDownloading(true);
      
      const params = `?flashcards=${pdfIncludeFlashcards}&mcqs=${pdfIncludeMCQs}&theme=${pdfTheme}`;
      const response = await api.get(`/notes/lecture/${lectureId}/pdf${params}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      const fileName = lecture && lecture.title 
        ? `${lecture.title.replace(/[^a-z0-9]/gi, '_')}_Study_Guide.pdf` 
        : `study_guide_${lectureId}.pdf`;

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
      setShowPdfSettings(false); // Close settings panel on success
    } catch (err) {
      console.error('Download PDF error:', err);
      setError('Failed to download study guide PDF. Please try again.');
    } finally {
      setPdfDownloading(false);
    }
  };

  // Translation Toggle
  const handleTranslateNotes = async (lang) => {
    if (lang === 'original') {
      setDisplayContent(notes.noteContent);
      setActiveLanguage('original');
      return;
    }

    setError('');
    setTranslating(true);
    try {
      const res = await api.post(`/notes/${notes._id}/translate`, { language: lang });
      setDisplayContent(res.data.translatedNotes);
      setActiveLanguage(lang);
    } catch (err) {
      console.error(err);
      setError('Translation failed.');
    } finally {
      setTranslating(false);
    }
  };

  // Quiz submission handler
  const handleOptionSelect = (option) => {
    if (isSubmitted) return;
    setSelectedOption(option);
  };

  const handleQuizSubmit = () => {
    if (!selectedOption || isSubmitted) return;

    setIsSubmitted(true);
    const correctKey = mcqs[currentQuestionIdx].correctAnswer;
    if (selectedOption === correctKey) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleQuizNext = () => {
    setSelectedOption(null);
    setIsSubmitted(false);

    if (currentQuestionIdx + 1 < mcqs.length) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleQuizReset = () => {
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setQuizScore(0);
    setQuizFinished(false);
  };

  // Chat message submit
  const handleChatSend = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const chatHistory = chatMessages
        .filter(m => m.role !== 'system')
        .map(m => ({ question: m.role === 'user' ? m.text : '', answer: m.role === 'assistant' ? m.text : '' }));

      const res = await api.post('/chat', {
        lectureId,
        question: userMsg
      });

      const { answer } = res.data.chatRecord;
      setChatMessages(prev => [...prev, { role: 'assistant', text: answer }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Error executing query. AI model offline.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Markdown renderer
  const renderMarkdown = (md) => {
    if (!md) return '';
    let html = md;
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^\- (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');

    const blocks = html.split('\n\n');
    return blocks.map(block => {
      const trimmed = block.trim();
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li>')) return block;
      if (trimmed) return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
      return '';
    }).join('\n');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Notebook header */}
      <div className="flex items-center space-x-3 shrink-0">
        <Link
          to="/student"
          className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/15 text-accent px-2.5 py-0.5 rounded-full">
            {lecture?.subject}
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">{lecture?.title}</h1>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex items-center space-x-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 border-b-2 whitespace-nowrap transition-colors
            ${activeTab === 'notes'
              ? 'border-accent text-accent'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Study Notes</span>
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 border-b-2 whitespace-nowrap transition-colors
            ${activeTab === 'summary'
              ? 'border-accent text-accent'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          <FileText className="w-4 h-4" />
          <span>Summaries</span>
        </button>

        <button
          onClick={() => setActiveTab('flashcards')}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 border-b-2 whitespace-nowrap transition-colors
            ${activeTab === 'flashcards'
              ? 'border-accent text-accent'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Flashcards</span>
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 border-b-2 whitespace-nowrap transition-colors
            ${activeTab === 'quiz'
              ? 'border-accent text-accent'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          <Award className="w-4 h-4" />
          <span>Practice Quiz</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 border-b-2 whitespace-nowrap transition-colors
            ${activeTab === 'chat'
              ? 'border-accent text-accent'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>AI Chat</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {/* Main Tab Content Display */}
      <div className="min-h-[400px]">

        {/* --- NOTES TAB --- */}
        {activeTab === 'notes' && notes && (
          <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 md:p-8 rounded-3xl shadow-premium space-y-6">

            {/* Notes Actions Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">

              {/* Language Selection */}
              <div className="flex items-center space-x-2">
                <Languages className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2">Language:</span>
                <div className="flex space-x-1.5">
                  {['original', 'bengali', 'hindi'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleTranslateNotes(lang)}
                      disabled={translating}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all
                        ${activeLanguage === lang
                          ? 'bg-accent/15 border-accent text-accent'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-accent hover:text-accent'}`}
                    >
                      {lang === 'original' ? 'English' : lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* PDF download with settings popover */}
              <div className="relative">
                <div className="flex space-x-1.5 w-full sm:w-auto">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={pdfDownloading}
                    className="flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-xl text-xs shadow-md transition-colors flex-1 sm:flex-initial"
                  >
                    {pdfDownloading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    {pdfDownloading ? 'Generating...' : 'Download study guide PDF'}
                  </button>
                  
                  <button
                    onClick={() => setShowPdfSettings(!showPdfSettings)}
                    className={`p-2 border rounded-xl transition-all ${showPdfSettings ? 'bg-accent/15 border-accent text-accent' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-accent hover:text-accent'}`}
                    title="PDF Export Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>

                {/* PDF Export Settings Popover Dropdown */}
                {showPdfSettings && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border rounded-2xl shadow-xl p-4 z-40 text-sm space-y-4">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">PDF Guide Settings</h4>
                    
                    {/* Theme choice */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-500 font-semibold uppercase">PDF Theme</label>
                      <select
                        value={pdfTheme}
                        onChange={(e) => setPdfTheme(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="classic">Classic (Light)</option>
                        <option value="dark">Premium (Dark)</option>
                        <option value="minimal">Print-Friendly (Minimal)</option>
                      </select>
                    </div>

                    {/* Section Toggles */}
                    <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <label className="text-xs text-slate-550 font-semibold uppercase block">Include Sections</label>
                      
                      <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={pdfIncludeFlashcards}
                          onChange={(e) => setPdfIncludeFlashcards(e.target.checked)}
                          className="rounded text-accent focus:ring-accent w-4 h-4"
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-300">Revision Flashcards</span>
                      </label>

                      <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={pdfIncludeMCQs}
                          onChange={(e) => setPdfIncludeMCQs(e.target.checked)}
                          className="rounded text-accent focus:ring-accent w-4 h-4"
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-300">Practice Quiz (MCQs)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Markdown Display */}
            {translating ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-primary border-t-accent rounded-full animate-spin"></div>
                <p className="text-sm font-semibold animate-pulse text-slate-400">AI Translator running...</p>
              </div>
            ) : (
              <div
                className="prose-custom dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(displayContent) }}
              />
            )}
          </div>
        )}

        {/* --- SUMMARIES TAB --- */}
        {activeTab === 'summary' && notes && (
          <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 md:p-8 rounded-3xl shadow-premium space-y-6">

            {/* Level Controls */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl w-fit">
              {['short', 'medium', 'detailed'].map((level) => (
                <button
                  key={level}
                  onClick={() => setSummaryLevel(level)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all
                    ${summaryLevel === level
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-250'}`}
                >
                  {level}
                </button>
              ))}
            </div>

            {/* Display Summary Content */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 leading-relaxed text-gray-300 dark:text-slate-350">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4 capitalize">
                {summaryLevel} Summary
              </h3>
              <p className="whitespace-pre-wrap">{notes.summary[summaryLevel]}</p>
            </div>
          </div>
        )}

        {/* --- FLASHCARDS TAB --- */}
        {activeTab === 'flashcards' && (
          <div className="space-y-6">
            {flashcards.length === 0 ? (
              <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-12 rounded-3xl text-center text-slate-500">
                <p>No revision flashcards generated for this lecture.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ">
                {flashcards.map((fc) => (
                  <FlashcardItem key={fc._id} card={fc} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- PRACTICE QUIZ TAB --- */}
        {activeTab === 'quiz' && (
          <div className="max-w-2xl mx-auto">
            {mcqs.length === 0 ? (
              <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-12 rounded-3xl text-center text-slate-500">
                <p>No quiz questions generated for this lecture.</p>
              </div>
            ) : quizFinished ? (
              /* Quiz Finished Page */
              <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-8 rounded-3xl shadow-premium text-center space-y-6">
                <div className="w-20 h-20 bg-accent/15 rounded-full flex items-center justify-center text-accent mx-auto">
                  <Award className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold font-sans">Practice Session Complete!</h3>
                <div className="text-5xl font-black text-[#03C988]">{quizScore} / {mcqs.length}</div>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto font-light">
                  Great job verifying your knowledge. Keep reviewing the flashcards and study notes to maximize your retention.
                </p>
                <button
                  onClick={handleQuizReset}
                  className="px-6 py-2.5 bg-accent hover:bg-accent-light text-white font-semibold rounded-2xl text-sm transition-colors inline-flex items-center"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Restart Quiz
                </button>
              </div>
            ) : (
              /* MCQ Quiz Interface */
              <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 md:p-8 rounded-3xl shadow-premium space-y-6">

                {/* Progress */}
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <span className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-full uppercase tracking-wider">
                    Question {currentQuestionIdx + 1} of {mcqs.length}
                  </span>
                  <span>Score: {quizScore}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-accent h-full rounded-full transition-all"
                    style={{ width: `${((currentQuestionIdx + 1) / mcqs.length) * 100}%` }}
                  ></div>
                </div>

                {/* Question */}
                <h3 className="font-bold text-lg font-sans leading-relaxed">
                  {mcqs[currentQuestionIdx].question}
                </h3>

                {/* Options list */}
                <div className="grid grid-cols-1 gap-3.5 mt-6">
                  {mcqs[currentQuestionIdx].options.map((opt, i) => {
                    const optKey = ['A', 'B', 'C', 'D'][i];
                    const correctKey = mcqs[currentQuestionIdx].correctAnswer;

                    let btnStyle = 'border-slate-250 dark:border-slate-800 hover:border-accent hover:bg-accent/5';
                    let IconComponent = null;

                    if (selectedOption === optKey && !isSubmitted) {
                      btnStyle = 'border-accent bg-accent/5 text-accent';
                    }

                    if (isSubmitted) {
                      if (optKey === correctKey) {
                        btnStyle = 'border-[#03C988] bg-[#03C988]/5 text-[#03C988]';
                        IconComponent = <CheckCircle className="w-5 h-5 text-[#03C988] shrink-0" />;
                      } else if (selectedOption === optKey && selectedOption !== correctKey) {
                        btnStyle = 'border-red-500 bg-red-500/5 text-red-500';
                        IconComponent = <XCircle className="w-5 h-5 text-red-500 shrink-0" />;
                      } else {
                        btnStyle = 'border-slate-200 dark:border-slate-800 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleOptionSelect(optKey)}
                        disabled={isSubmitted}
                        className={`flex items-center justify-between p-4.5 rounded-2xl border text-left font-semibold text-sm transition-all duration-150 ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {IconComponent}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation and Next */}
                {isSubmitted && (
                  <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-6 animate-fadeIn">
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-4.5 rounded-2xl border border-slate-150 dark:border-slate-800/60 text-xs font-light leading-relaxed">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Explanation:</span>
                      <p className="italic text-slate-500 dark:text-slate-400">
                        {mcqs[currentQuestionIdx].explanation}
                      </p>
                    </div>

                    <button
                      onClick={handleQuizNext}
                      className="w-full bg-accent hover:bg-accent-light text-white font-semibold rounded-2xl py-3.5 shadow-md transition-colors"
                    >
                      {currentQuestionIdx + 1 === mcqs.length ? 'Finish Quiz' : 'Next Question'}
                    </button>
                  </div>
                )}

                {!isSubmitted && (
                  <button
                    onClick={handleQuizSubmit}
                    disabled={!selectedOption}
                    className="w-full bg-primary hover:bg-primary-light disabled:opacity-50 text-white font-semibold rounded-2xl py-3.5 shadow-md transition-colors"
                  >
                    Submit Answer
                  </button>
                )}

              </div>
            )}
          </div>
        )}

        {/* --- AI CHAT TAB --- */}
        {activeTab === 'chat' && (
          <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border rounded-3xl overflow-hidden shadow-premium h-[500px] flex flex-col max-w-2xl mx-auto">

            {/* Scrollable messages container */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {chatMessages.map((msg, index) => {
                const isAssistant = msg.role === 'assistant';
                return (
                  <div
                    key={index}
                    className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} items-start space-x-3`}
                  >
                    {isAssistant && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 mt-0.5 border border-slate-200 dark:border-slate-800">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm
                        ${isAssistant
                          ? 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800/80 rounded-tl-none'
                          : 'bg-accent text-white rounded-tr-none'}`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    {!isAssistant && (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white shrink-0 mt-0.5 border border-slate-200 dark:border-slate-800">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {chatLoading && (
                <div className="flex justify-start items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 border border-slate-200 dark:border-slate-800">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl rounded-tl-none px-4 py-2.5 text-slate-400 flex items-center space-x-1 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleChatSend} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 flex items-center gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about formulas, workings, examples..."
                className="flex-1 bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-accent text-slate-800 dark:text-slate-100"
                disabled={chatLoading}
                required
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="p-2 bg-accent hover:bg-accent-light disabled:opacity-50 text-white rounded-xl shadow-md transition-colors"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>

          </div>
        )}

      </div>
    </div>
  );
};

// Flashcard Item component with flip capabilities
const FlashcardItem = ({ card }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="w-full h-44 cursor-pointer [perspective:1000px]"
      onClick={() => setFlipped(!flipped)}
    >
      <div
        className={`relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform
          ${flipped ? '[transform:rotateY(180deg)]' : ''}`}
      >
        {/* Front Side */}
        <div className="absolute inset-0 w-full h-full bg-white dark:bg-darkBg-card border border-slate-250 dark:border-darkBg-border p-6 rounded-3xl shadow-premium [backface-visibility:hidden] flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-[#dfd32e]">
            <HelpIcon className="w-4.5 h-4.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Flashcard Question</span>
          </div>
          <p className="font-bold text-blue-400 dark:text-slate-150 leading-relaxed text-sm flex-1 flex items-center mt-3">
            {card.question}
          </p>
          <span className="text-[10px] text-slate-400 font-semibold uppercase text-right self-end mt-2">Click to flip</span>
        </div>

        {/* Back Side */}
        <div className="absolute inset-0 w-full h-full bg-[#13005A] text-white p-6 rounded-3xl shadow-premium [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-[#03C988]">
            <CheckCircle className="w-4.5 h-4.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#03C988]">Answer Definition</span>
          </div>
          <p className="font-medium text-slate-100 leading-relaxed text-xs flex-1 flex items-center mt-3">
            {card.answer}
          </p>
          <span className="text-[10px] text-slate-350 font-semibold uppercase text-right self-end mt-2">Click to flip back</span>
        </div>
      </div>
    </div>
  );
};

export default LectureNotesView;
