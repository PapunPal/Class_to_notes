import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getAccessToken } from '../services/api';
import {
  UploadCloud,
  Mic,
  FileText,
  Clock,
  PlayCircle,
  AlertCircle,
  CheckCircle2,
  ListRestart
} from 'lucide-react';

const TeacherDashboard = () => {
  const [stats, setStats] = useState({ total: 0, completed: 0, processing: 0, failed: 0 });
  const [recentLectures, setRecentLectures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/lectures?own=true');
        const lectures = res.data.lectures;
        setRecentLectures(lectures.slice(0, 5));
        
        // Calculate stats
        const calculated = lectures.reduce(
          (acc, item) => {
            acc.total++;
            acc[item.status]++;
            return acc;
          },
          { total: 0, completed: 0, processing: 0, failed: 0 }
        );
        setStats(calculated);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Real-time status updates via Server-Sent Events (SSE)
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = getAccessToken();
    
    // Establish native browser EventSource connection with token in query params
    const eventSource = new EventSource(`${backendUrl}/sse/status-stream?token=${token}`);
    
    const handleUpdate = async () => {
      try {
        const res = await api.get('/lectures?own=true');
        const lectures = res.data.lectures;
        setRecentLectures(lectures.slice(0, 5));
        
        const calculated = lectures.reduce(
          (acc, item) => {
            acc.total++;
            acc[item.status]++;
            return acc;
          },
          { total: 0, completed: 0, processing: 0, failed: 0 }
        );
        setStats(calculated);
      } catch (err) {
        console.error('Failed to load dashboard data on SSE update:', err);
      }
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.lectureId && data.status) { 
          handleUpdate();
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary to-secondary text-white rounded-3xl p-8 shadow-lg">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent rounded-full filter blur-[60px] opacity-40"></div>
        <div className="relative z-10 max-w-xl space-y-2">
          <h1 className="text-3xl font-extrabold font-sans">Teacher Command Center</h1>
          <p className="text-slate-200 text-sm font-light">
            Upload new classroom lectures or start live audio recordings to generate summaries, notes, flashcards, and quizzes for your students automatically.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 rounded-2xl shadow-premium">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Lectures</p>
          <p className="text-3xl font-black">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 rounded-2xl shadow-premium">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-[#03C988]">Completed Notes</p>
          <p className="text-3xl font-black text-[#03C988]">{stats.completed}</p>
        </div>
        <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 rounded-2xl shadow-premium">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-accent">AI Processing</p>
          <p className="text-3xl font-black text-accent">{stats.processing}</p>
        </div>
        <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 rounded-2xl shadow-premium">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-red-500">Failed Jobs</p>
          <p className="text-3xl font-black text-red-500">{stats.failed}</p>
        </div>
      </div>

      {/* Action shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          to="/teacher/upload" 
          className="flex items-center p-6 bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border rounded-2xl hover-card-trigger"
        >
          <div className="w-14 h-14 bg-accent/15 rounded-2xl flex items-center justify-center text-accent mr-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Upload Lecture Audio</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Upload MP3, WAV, or M4A audio files up to 100MB.</p>
          </div>
        </Link>

        <Link 
          to="/teacher/live" 
          className="flex items-center p-6 bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border rounded-2xl hover-card-trigger"
        >
          <div className="w-14 h-14 bg-red-500/15 rounded-2xl flex items-center justify-center text-red-500 mr-4">
            <Mic className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Record Lecture Live</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Record microphone audio directly in your browser.</p>
          </div>
        </Link>
      </div>

      {/* Recent Lectures */}
      <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border rounded-2xl shadow-premium overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-lg">Recent Uploads</h3>
          <Link to="/teacher/history" className="text-accent hover:underline text-sm font-semibold">
            View All History
          </Link>
        </div>

        {recentLectures.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p className="mb-4">No lectures uploaded yet.</p>
            <Link 
              to="/teacher/upload" 
              className="inline-flex items-center px-4 py-2 bg-accent hover:bg-accent-light text-white font-semibold rounded-xl text-sm transition-colors"
            >
              <UploadCloud className="w-4 h-4 mr-2" /> Upload your first lecture
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentLectures.map((lec) => (
              <div key={lec._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mt-0.5">
                    <PlayCircle className="w-6 h-6 text-primary dark:text-accent-light" />
                  </div>
                  <div>
                    <h4 className="font-bold">{lec.title}</h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span className="bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                        {lec.subject}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {new Date(lec.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  {/* Status Badges */}
                  {lec.status === 'completed' && (
                    <span className="flex items-center text-xs font-semibold text-[#03C988] bg-[#03C988]/10 px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Ready
                    </span>
                  )}
                  {lec.status === 'processing' && (
                    <span className="flex items-center text-xs font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full animate-pulse">
                      <ListRestart className="w-3.5 h-3.5 mr-1 animate-spin" /> Converting
                    </span>
                  )}
                  {lec.status === 'failed' && (
                    <span className="flex items-center text-xs font-semibold text-red-500 bg-red-500/10 px-3 py-1 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> Failed
                    </span>
                  )}

                  {/* Notes Edit/View Button */}
                  {lec.status === 'completed' && (
                    <Link
                      to={`/lecture/${lec._id}`}
                      className="px-4 py-1.5 border border-slate-200 dark:border-slate-800 hover:border-accent hover:text-accent font-semibold rounded-xl text-xs transition-colors"
                    >
                      View Notes
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default TeacherDashboard;
