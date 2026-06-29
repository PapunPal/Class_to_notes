import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api, { getAccessToken } from '../services/api';
import {
  Clock,
  Play,
  Pause,
  Trash2,
  Edit3,
  BookOpen,
  CheckCircle,
  AlertCircle,
  RefreshCcw,
  Search
} from 'lucide-react';

const LectureHistory = () => {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  
  const audioRef = useRef(new Audio());

  const fetchLectures = async () => {
    try {
      const res = await api.get('/lectures?own=true');
      setLectures(res.data.lectures);
    } catch (err) {
      console.error(err);
      setError('Failed to load lecture history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLectures();
    
    // Stop audio on unmount
    const currentAudio = audioRef.current;
    return () => {
      currentAudio.pause();
    };
  }, []);

  // Real-time status updates via Server-Sent Events (SSE)
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = getAccessToken();
    
    // Establish native browser EventSource connection with token in query params
    const eventSource = new EventSource(`${backendUrl}/sse/status-stream?token=${token}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.lectureId && data.status) { 
          // Instantly update local state status matching the completed lecture
          setLectures(prev => prev.map(l => 
            l._id === data.lectureId ? { ...l, status: data.status, steps: data.steps || l.steps } : l
          ));
        }
      } catch (err) {
        console.error('[SSE] Failed to parse event payload:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[SSE] EventSource connection encountered an error:', err);
    };
    
    return () => {
      eventSource.close();
    };
  }, []);

  const handlePlayPause = (lectureId, audioUrl) => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const fullAudioUrl = audioUrl.startsWith('http') ? audioUrl : `${backendUrl}${audioUrl}`;

    if (playingId === lectureId) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      audioRef.current.src = fullAudioUrl;
      audioRef.current.play()
        .then(() => setPlayingId(lectureId))
        .catch(err => {
          console.error(err);
          alert('Could not play audio. File might still be processing.');
        });
        
      audioRef.current.onended = () => {
        setPlayingId(null);
      };
    }
  };

  const handleDelete = async (lectureId) => {
    if (!window.confirm('Are you sure you want to delete this lecture and all its generated notes, summaries, and MCQs? This action is permanent.')) {
      return;
    }

    try {
      // Pause audio if it was playing
      if (playingId === lectureId) {
        audioRef.current.pause();
        setPlayingId(null);
      }

      await api.delete(`/lectures/${lectureId}`);
      setLectures(prev => prev.filter(l => l._id !== lectureId));
    } catch (err) {
      console.error(err);
      alert('Delete failed.');
    }
  };

  const handleRetry = async (lectureId) => {
    try {
      setLectures(prev => prev.map(l => {
        if (l._id === lectureId) {
          const updatedSteps = { ...l.steps };
          if (updatedSteps.transcription && updatedSteps.transcription.status === 'failed') {
            updatedSteps.transcription = { status: 'pending', error: '' };
          }
          if (updatedSteps.generation && updatedSteps.generation.status === 'failed') {
            updatedSteps.generation = { status: 'pending', error: '' };
          }
          return { ...l, status: 'processing', steps: updatedSteps };
        }
        return l;
      }));
      await api.post(`/lectures/${lectureId}/retry`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Retry failed to start. Original audio file might be missing.');
      fetchLectures();
    }
  };

  const filteredLectures = lectures.filter(l => 
    l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Lecture Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Monitor processing status, listen to recordings, or edit generated materials
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search lectures..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border rounded-2xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {/* History Grid */}
      {filteredLectures.length === 0 ? (
        <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-12 rounded-3xl text-center text-slate-500">
          <Clock className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <p className="font-semibold text-lg mb-1">No lectures found</p>
          <p className="text-sm">Try uploading a new recording to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLectures.map((lec) => (
            <div 
              key={lec._id} 
              className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border rounded-3xl p-6 shadow-premium flex flex-col justify-between relative"
            >
              
              {/* Card Main Info */}
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/15 text-accent px-2.5 py-1 rounded-full">
                    {lec.subject}
                  </span>
                  
                  {/* Status Badge */}
                  {lec.status === 'completed' && (
                    <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-[#03C988] bg-[#03C988]/15 px-2.5 py-1 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Active
                    </span>
                  )}
                  {lec.status === 'processing' && (
                    <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/15 px-2.5 py-1 rounded-full animate-pulse">
                      <RefreshCcw className="w-3.5 h-3.5 mr-1 animate-spin" /> Converting
                    </span>
                  )}
                  {lec.status === 'failed' && (
                    <div className="flex items-center space-x-1.5">
                      <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-500/15 px-2.5 py-1 rounded-full">
                        <AlertCircle className="w-3.5 h-3.5 mr-1" /> Failed
                      </span>
                      <button
                        onClick={() => handleRetry(lec._id)}
                        className="px-2 py-0.5 border border-red-200 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded text-[9px] font-bold uppercase transition-all"
                        title="Retry processing"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-lg leading-snug line-clamp-2" title={lec.title}>
                    {lec.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-light line-clamp-2">
                    {lec.description || 'No description provided.'}
                  </p>
                  
                  {/* Steps Progress Indicator */}
                  {(lec.status === 'processing' || lec.status === 'failed') && (
                    <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-2.5 text-xs">
                      <p className="font-semibold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider mb-1">
                        Processing Steps
                      </p>
                      
                      {/* Step 1: Cloudinary Audio Upload */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#03C988]"></span>
                          <span>Audio Cloud Upload</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase text-[#03C988]">Success</span>
                      </div>

                      {/* Step 2: AI Transcription */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              lec.steps?.transcription?.status === 'completed' ? 'bg-[#03C988]' :
                              lec.steps?.transcription?.status === 'failed' ? 'bg-red-500' :
                              lec.steps?.transcription?.status === 'processing' ? 'bg-accent animate-pulse' : 'bg-slate-300 dark:bg-slate-700'
                            }`}></span>
                            <span>AI Transcription</span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase ${
                            lec.steps?.transcription?.status === 'completed' ? 'text-[#03C988]' :
                            lec.steps?.transcription?.status === 'failed' ? 'text-red-500' :
                            lec.steps?.transcription?.status === 'processing' ? 'text-accent animate-pulse' : 'text-slate-400'
                          }`}>
                            {lec.steps?.transcription?.status === 'processing' ? 'Processing' :
                             lec.steps?.transcription?.status === 'completed' ? 'Success' :
                             lec.steps?.transcription?.status === 'failed' ? 'Failed' : 'Pending'}
                          </span>
                        </div>
                        {lec.steps?.transcription?.status === 'failed' && lec.steps?.transcription?.error && (
                          <p className="text-[10px] text-red-500/80 leading-normal pl-3.5 italic break-words">
                            Error: {lec.steps.transcription.error}
                          </p>
                        )}
                      </div>

                      {/* Step 3: Study Materials Generation */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              lec.steps?.generation?.status === 'completed' ? 'bg-[#03C988]' :
                              lec.steps?.generation?.status === 'failed' ? 'bg-red-500' :
                              lec.steps?.generation?.status === 'processing' ? 'bg-accent animate-pulse' : 'bg-slate-300 dark:bg-slate-700'
                            }`}></span>
                            <span>Study Material Gen</span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase ${
                            lec.steps?.generation?.status === 'completed' ? 'text-[#03C988]' :
                            lec.steps?.generation?.status === 'failed' ? 'text-red-500' :
                            lec.steps?.generation?.status === 'processing' ? 'text-accent animate-pulse' : 'text-slate-400'
                          }`}>
                            {lec.steps?.generation?.status === 'processing' ? 'Processing' :
                             lec.steps?.generation?.status === 'completed' ? 'Success' :
                             lec.steps?.generation?.status === 'failed' ? 'Failed' : 'Pending'}
                          </span>
                        </div>
                        {lec.steps?.generation?.status === 'failed' && lec.steps?.generation?.error && (
                          <p className="text-[10px] text-red-500/80 leading-normal pl-3.5 italic break-words">
                            Error: {lec.steps.generation.error}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-6 border-t border-slate-100 dark:border-slate-800/80 pt-4 flex items-center justify-between gap-3">
                
                {/* Play audio button */}
                <button
                  onClick={() => handlePlayPause(lec._id, lec.audioUrl)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors
                    ${playingId === lec._id
                      ? 'bg-accent/15 border-accent text-accent'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-accent hover:text-accent'}`}
                  title={playingId === lec._id ? 'Pause audio' : 'Play audio'}
                >
                  {playingId === lec._id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                {/* View/Edit Actions */}
                <div className="flex items-center space-x-2">
                  {lec.status === 'completed' && (
                    <>
                      {/* Notebook View Link */}
                      <Link
                        to={`/lecture/${lec._id}`}
                        className="p-2 border border-slate-200 dark:border-slate-800 text-slate-500 hover:border-accent hover:text-accent rounded-xl transition-colors"
                        title="Open Notebook"
                      >
                        <BookOpen className="w-4 h-4" />
                      </Link>

                      {/* Edit notes link */}
                      <Link
                        to={`/teacher/edit/${lec._id}`}
                        className="p-2 border border-slate-200 dark:border-slate-800 text-slate-500 hover:border-accent hover:text-accent rounded-xl transition-colors"
                        title="Edit study materials"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                    </>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(lec._id)}
                    className="p-2 border border-slate-200 dark:border-slate-800 text-slate-400 hover:border-red-500 hover:text-red-500 rounded-xl transition-colors"
                    title="Delete Lecture"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LectureHistory;
