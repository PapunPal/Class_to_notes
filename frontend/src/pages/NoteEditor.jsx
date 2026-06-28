import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Save, AlertCircle, CheckCircle, Languages, Eye, Edit, ArrowLeft } from 'lucide-react';

const NoteEditor = () => {
  const { lectureId } = useParams();
  const navigate = useNavigate();

  const [noteId, setNoteId] = useState('');
  const [topic, setTopic] = useState('');
  const [noteContent, setNoteContent] = useState('');
  
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'preview' (on mobile)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await api.get(`/notes?lectureId=${lectureId}`);
        const notesList = res.data.notes;
        
        if (notesList && notesList.length > 0) {
          const noteObj = notesList[0];
          setNoteId(noteObj._id);
          setTopic(noteObj.topic);
          setNoteContent(noteObj.noteContent);
        } else {
          setError('Notes not found. The lecture might still be processing.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch notes.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [lectureId]);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await api.patch(`/notes/${noteId}`, {
        topic,
        noteContent
      });
      setSuccess('Notes updated successfully!');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save notes.');
    } finally {
      setSaving(false);
    }
  };

  const handleTranslate = async (lang) => {
    setError('');
    setSuccess('');
    setTranslating(true);

    try {
      const res = await api.post(`/notes/${noteId}/translate`, {
        language: lang
      });
      
      const { translatedNotes } = res.data;
      if (window.confirm(`Translation completed. Do you want to replace your current editor content with the ${lang} translation?`)) {
        setNoteContent(translatedNotes);
        setSuccess(`Loaded ${lang} translation into the editor. Don't forget to click Save!`);
      }
    } catch (err) {
      console.error(err);
      setError('Translation request failed.');
    } finally {
      setTranslating(false);
    }
  };

  // Basic markdown-to-HTML helper for preview rendering
  const renderMarkdown = (md) => {
    if (!md) return '';
    let html = md;

    // Headings
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Bullet points
    html = html.replace(/^\- (.*?)$/gm, '<li>$1</li>');
    // Wrap consecutive list items in <ul>
    html = html.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');

    // Paragraphs (split by double newline, skip headers/lists)
    const blocks = html.split('\n\n');
    const processedBlocks = blocks.map(block => {
      const trimmed = block.trim();
      if (
        trimmed.startsWith('<h') || 
        trimmed.startsWith('<ul') || 
        trimmed.startsWith('<li>') ||
        trimmed.startsWith('<blockquote>')
      ) {
        return block;
      }
      if (trimmed) {
        return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
      }
      return '';
    });

    return processedBlocks.join('\n');
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
      
      {/* Editor Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/teacher/history')}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Edit Notes</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Refine and customize your generated study guide
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Translation Dropdown */}
          <div className="relative group">
            <button
              disabled={translating}
              className="flex items-center px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              <Languages className="w-4 h-4 mr-2 text-accent" />
              {translating ? 'Translating...' : 'Translate Notes'}
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl hidden group-hover:block z-40 overflow-hidden">
              <button 
                onClick={() => handleTranslate('bengali')}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
              >
                Bengali (বাংলা)
              </button>
              <button 
                onClick={() => handleTranslate('hindi')}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
              >
                Hindi (हिन्दी)
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || !noteId}
            className="flex items-center px-5 py-2 bg-[#03C988] hover:bg-[#03C988]/90 text-white font-semibold rounded-xl text-sm shadow-md transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-[#03C988]/10 border border-[#03C988]/20 text-[#03C988] p-4 rounded-2xl text-sm flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      {/* Editor Content Area */}
      {noteId && (
        <div className="space-y-4">
          
          {/* Topic Title Field */}
          <div className="flex flex-col space-y-1.5 bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-4 rounded-2xl shadow-premium">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Notes Main Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3.5 text-slate-800 dark:text-slate-100 placeholder-slate-500 font-bold focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Toggle Tab (Mobile only) */}
          <div className="flex md:hidden border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-2
                ${activeTab === 'edit' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-900 text-slate-400'}`}
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-2
                ${activeTab === 'preview' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-900 text-slate-400'}`}
            >
              <Eye className="w-4 h-4" /> Preview
            </button>
          </div>

          {/* Split Pane Editor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[500px]">
            
            {/* Editor Pane */}
            <div className={`flex flex-col bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border rounded-3xl overflow-hidden shadow-premium ${activeTab === 'edit' ? 'block' : 'hidden md:flex'}`}>
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Markdown Editor</span>
              </div>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="flex-1 w-full bg-transparent p-5 font-mono text-sm leading-relaxed border-none focus:outline-none resize-none text-slate-800 dark:text-slate-200 min-h-[500px]"
                placeholder="Markdown text here..."
              />
            </div>

            {/* Live Preview Pane */}
            <div className={`flex flex-col bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border rounded-3xl overflow-hidden shadow-premium ${activeTab === 'preview' ? 'block' : 'hidden md:flex'}`}>
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/30">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Formatted Note Preview</span>
              </div>
              <div 
                className="flex-1 p-6 overflow-y-auto prose-custom dark:prose-invert max-h-[600px]"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(noteContent) }}
              />
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default NoteEditor;
