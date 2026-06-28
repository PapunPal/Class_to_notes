import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Search, GraduationCap, Clock, HelpCircle, Layers, ToggleLeft, ToggleRight } from 'lucide-react';

const StudentDashboard = () => {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [semanticSearchActive, setSemanticSearchActive] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [subjectsList, setSubjectsList] = useState(['All']);
  
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const fetchLectures = async (search = '', useSemantic = false) => {
    setError('');
    
    // If we're performing semantic search
    if (useSemantic && search.trim()) {
      setSearching(true);
      try {
        const res = await api.get(`/lectures/semantic-search?q=${encodeURIComponent(search)}`);
        setLectures(res.data.lectures);
      } catch (err) {
        console.error(err);
        setError('Semantic search failed. Falling back to normal text search...');
        setSemanticSearchActive(false);
        // Fallback
        fetchLectures(search, false);
      } finally {
        setSearching(false);
      }
      return;
    }

    setSearching(true);
    try {
      let url = '/lectures';
      const params = [];
      if (search.trim()) {
        params.push(`search=${encodeURIComponent(search)}`);
      }
      if (selectedSubject !== 'All' && !search.trim()) {
        params.push(`subject=${encodeURIComponent(selectedSubject)}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const res = await api.get(url);
      setLectures(res.data.lectures);
      
      // Compute subjects list if initial loading
      if (subjectsList.length === 1) {
        const uniqueSubjects = ['All', ...new Set(res.data.lectures.map(l => l.subject))];
        setSubjectsList(uniqueSubjects);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load lectures.');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchLectures();
  }, [selectedSubject]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLectures(searchQuery, semanticSearchActive);
  };

  const clearSearch = () => {
    setSearchQuery('');
    fetchLectures('', false);
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
      
      {/* Student Welcome Banner */}
      <div className="relative overflow-hidden bg-[#13005A] text-white rounded-3xl p-8 shadow-lg">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent rounded-full filter blur-[60px] opacity-40"></div>
        <div className="relative z-10 max-w-xl space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Classroom Study Board</h1>
          <p className="text-slate-200 text-sm font-light">
            Search or select lectures to view study notes, summaries, interactive flashcards, and practice quizzes.
          </p>
        </div>
      </div>

      {/* Search Console Card */}
      <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 rounded-3xl shadow-premium space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          
          {/* Search bar input */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder={semanticSearchActive ? "Ask: 'Show lectures related to searching algorithms'" : "Search subject or topic name..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-accent transition-colors"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={searching}
            className="w-full sm:w-auto px-6 py-3 bg-accent hover:bg-accent-light text-white font-semibold rounded-2xl text-sm transition-colors shrink-0"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Semantic Search Toggle */}
        <div className="flex items-center justify-between sm:justify-start sm:space-x-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                const next = !semanticSearchActive;
                setSemanticSearchActive(next);
                if (searchQuery.trim()) {
                  fetchLectures(searchQuery, next);
                }
              }}
              className="text-slate-600 dark:text-slate-400 hover:text-accent"
              title="Semantic Search ranks lectures by concept matches instead of simple keyword matching."
            >
              {semanticSearchActive ? (
                <ToggleRight className="w-10 h-10 text-accent fill-current" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-slate-400 fill-current" />
              )}
            </button>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                AI Semantic Vector Search
              </span>
              <span className="text-[10px] text-slate-400">
                Finds conceptual matches using Sentence-Transformers (Offline)
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {/* Subject Filter Tabs (visible when not doing query searches) */}
      {!searchQuery && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin">
          {subjectsList.map((subject) => (
            <button
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className={`px-4.5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all
                ${selectedSubject === subject
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border text-slate-500 hover:text-primary dark:hover:text-accent-light'}`}
            >
              {subject}
            </button>
          ))}
        </div>
      )}

      {/* Study Materials Grid */}
      {lectures.length === 0 ? (
        <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-12 rounded-3xl text-center text-slate-500">
          <GraduationCap className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <p className="font-semibold text-lg mb-1">No completed lectures found</p>
          <p className="text-sm">Lectures uploaded by your instructor will appear here once processed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lectures.map((lec) => (
            <Link
              key={lec._id}
              to={`/lecture/${lec._id}`}
              className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border rounded-3xl p-6 shadow-premium hover-card-trigger flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/15 text-accent px-2.5 py-1 rounded-full">
                    {lec.subject}
                  </span>
                  <span className="flex items-center text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {new Date(lec.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-lg leading-snug line-clamp-2">
                    {lec.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 line-clamp-3 font-light">
                    {lec.description || 'View formatted notes, revision flashcards, summaries, and take multiple choice tests.'}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 dark:border-slate-800/80 pt-4 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">Instructor: {lec.teacherId?.name || 'Academic staff'}</span>
                <span className="text-accent hover:underline flex items-center">
                  Open Notebook
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
};

export default StudentDashboard;
