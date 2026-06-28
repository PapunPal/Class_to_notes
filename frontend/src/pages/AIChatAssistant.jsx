import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { Send, Bot, User, MessageSquare, ArrowLeftRight } from 'lucide-react';

const AIChatAssistant = () => {
  const chatEndRef = useRef(null);

  const [lectures, setLectures] = useState([]);
  const [selectedLectureId, setSelectedLectureId] = useState('');
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lecturesLoading, setLecturesLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch student lectures list
  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const res = await api.get('/lectures');
        // Filter only completed ones
        const completed = res.data.lectures.filter(l => l.status === 'completed');
        setLectures(completed);
        
        if (completed.length > 0) {
          setSelectedLectureId(completed[0]._id);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch lectures list.');
      } finally {
        setLecturesLoading(false);
      }
    };
    fetchLectures();
  }, []);

  // Fetch chat history for selected lecture
  useEffect(() => {
    if (!selectedLectureId) return;

    const fetchChatHistory = async () => {
      setMessages([]);
      try {
        // We can do a mock retrieve or the API handles it in chat history.
        // Actually, we can fetch recent QA exchanges if we want. But the easiest way is:
        // When user changes the lecture, we can show a clean board, or query the backend chat models.
        // Let's query backend chat logs to display past conversation!
        // We don't have a direct GET /chat route in specifications, but we can query them from database or let the chat session start fresh.
        // Wait, standard is to start fresh or keep history. Since we save chat history to MongoDB,
        // let's create a quick API fetch in backend? We don't need to, starting fresh with a helpful AI greeting is very standard.
        // Alternatively, since we created Chat model, we can fetch them. Let's make the chat session start with a nice assistant greeting,
        // which makes it very responsive. Let's start with a helpful greeting tailored to the lecture title!
        const match = lectures.find(l => l._id === selectedLectureId);
        setMessages([
          {
            role: 'assistant',
            text: `Hello! I am your AI Teaching Assistant for "${match?.title}". Ask me any questions about the concepts, formulas, algorithms, or definitions discussed in this lecture, and I'll explain them using the lecture transcript as context!`
          }
        ]);
      } catch (err) {
        console.error(err);
      }
    };

    fetchChatHistory();
  }, [selectedLectureId, lectures]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedLectureId || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const res = await api.post('/chat', {
        lectureId: selectedLectureId,
        question: userMessage
      });

      const { answer } = res.data.chatRecord;
      setMessages(prev => [...prev, { role: 'assistant', text: answer }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'Sorry, I encountered an error. The AI Service might be offline.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (lecturesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto h-[calc(100vh-180px)] flex flex-col">
      {/* Selector and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-4 rounded-3xl shadow-premium shrink-0">
        <div className="flex items-center space-x-2">
          <MessageSquare className="text-accent w-6 h-6" />
          <h1 className="text-xl font-bold font-sans">AI Lecture Assistant</h1>
        </div>

        {/* Dropdown selector */}
        {lectures.length > 0 ? (
          <div className="flex items-center space-x-3 w-full sm:max-w-xs">
            <ArrowLeftRight className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedLectureId}
              onChange={(e) => setSelectedLectureId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-accent text-slate-700 dark:text-slate-200"
            >
              {lectures.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.subject}: {l.title}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <span className="text-xs font-semibold text-slate-400">No active lectures available.</span>
        )}
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border rounded-3xl overflow-hidden shadow-premium flex flex-col min-h-0">
        
        {/* Messages List Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {lectures.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Bot className="w-12 h-12 text-slate-350 dark:text-slate-700" />
              <p className="font-semibold text-lg">No active lectures</p>
              <p className="text-xs">Once lectures are uploaded and processed, you can chat here.</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={index}
                  className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} items-start space-x-3.5`}
                >
                  {/* Icon */}
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 mt-0.5 border border-slate-200 dark:border-slate-800">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  
                  {/* Bubble */}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4.5 py-3 text-sm leading-relaxed shadow-sm
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
            })
          )}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex justify-start items-center space-x-3.5">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 border border-slate-250 dark:border-slate-800">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl rounded-tl-none px-4.5 py-3 text-slate-400 flex items-center space-x-1.5 shadow-sm">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Text Input Panel */}
        {lectures.length > 0 && (
          <form onSubmit={handleSend} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 flex items-center gap-3">
            <input
              type="text"
              placeholder="Ask a question about the lecture..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border rounded-2xl py-3 px-4.5 text-sm focus:outline-none focus:border-accent text-slate-850 dark:text-slate-100"
              disabled={loading}
              required
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 bg-accent hover:bg-accent-light disabled:opacity-50 text-white rounded-2xl shadow-md transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default AIChatAssistant;
