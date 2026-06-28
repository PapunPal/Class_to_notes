import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Users,
  GraduationCap,
  School,
  FileText,
  Trash2,
  AlertCircle,
  Database,
  DownloadCloud,
  FileCheck,
  MessageSquare
} from 'lucide-react';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [lectures, setLectures] = useState([]);
  
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'users' | 'lectures'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      const analyticsRes = await api.get('/users/analytics');
      setAnalytics(analyticsRes.data.analytics);

      const usersRes = await api.get('/users');
      setUsers(usersRes.data.users);

      const lecturesRes = await api.get('/lectures');
      setLectures(lecturesRes.data.lectures);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}"? This action is permanent.`)) {
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.delete(`/users/${userId}`);
      setSuccess(`User "${name}" deleted successfully.`);
      setUsers(prev => prev.filter(u => u._id !== userId));
      // Refresh analytics
      const analyticsRes = await api.get('/users/analytics');
      setAnalytics(analyticsRes.data.analytics);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLecture = async (lectureId, title) => {
    if (!window.confirm(`Are you sure you want to delete lecture "${title}" and all its study materials? This action is permanent.`)) {
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.delete(`/lectures/${lectureId}`);
      setSuccess(`Lecture "${title}" deleted successfully.`);
      setLectures(prev => prev.filter(l => l._id !== lectureId));
      // Refresh analytics
      const analyticsRes = await api.get('/users/analytics');
      setAnalytics(analyticsRes.data.analytics);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete lecture.');
    } finally {
      setActionLoading(false);
    }
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
      
      {/* Alert notifications */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-[#03C988]/10 border border-[#03C988]/20 text-[#03C988] p-4 rounded-2xl text-sm flex items-center">
          <FileCheck className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      {/* Admin Tab controls */}
      <div className="flex items-center space-x-1 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all
            ${activeTab === 'stats' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Overview Statistics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all
            ${activeTab === 'users' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Manage Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('lectures')}
          className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all
            ${activeTab === 'lectures' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Manage Lectures ({lectures.length})
        </button>
      </div>

      {/* --- OVERVIEW TAB --- */}
      {activeTab === 'stats' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Users */}
            <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 rounded-3xl shadow-premium flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-450 uppercase tracking-wider mb-1">Total Users</p>
                <p className="text-3xl font-black">{analytics.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary dark:text-accent">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Total Teachers */}
            <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 rounded-3xl shadow-premium flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-450 uppercase tracking-wider mb-1">Teachers</p>
                <p className="text-3xl font-black text-secondary dark:text-accent-light">{analytics.totalTeachers}</p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary dark:text-accent-light">
                <School className="w-6 h-6" />
              </div>
            </div>

            {/* Total Students */}
            <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 rounded-3xl shadow-premium flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-450 uppercase tracking-wider mb-1">Students</p>
                <p className="text-3xl font-black text-accent">{analytics.totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                <GraduationCap className="w-6 h-6" />
              </div>
            </div>

            {/* Total Lectures */}
            <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 rounded-3xl shadow-premium flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-450 uppercase tracking-wider mb-1">Lectures Uploaded</p>
                <p className="text-3xl font-black">{analytics.totalLectures}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-500">
                <Database className="w-6 h-6" />
              </div>
            </div>

            {/* Total Notes */}
            <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 rounded-3xl shadow-premium flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-450 uppercase tracking-wider mb-1">Generated Notes</p>
                <p className="text-3xl font-black text-[#03C988]">{analytics.totalNotesGenerated}</p>
              </div>
              <div className="w-12 h-12 bg-[#03C988]/10 rounded-2xl flex items-center justify-center text-[#03C988]">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            {/* Total AI Chat Queries */}
            <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 rounded-3xl shadow-premium flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-450 uppercase tracking-wider mb-1">AI Chat Queries</p>
                <p className="text-3xl font-black text-amber-500">{analytics.totalChatQueries || 0}</p>
              </div>
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                <MessageSquare className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- USERS TAB --- */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border rounded-3xl overflow-hidden shadow-premium">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                    <td className="p-4 font-bold">{u.name}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="p-4 capitalize">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold
                        ${u.role === 'admin' ? 'bg-amber-500/15 text-amber-500' : ''}
                        ${u.role === 'teacher' ? 'bg-secondary/15 text-secondary dark:text-accent-light' : ''}
                        ${u.role === 'student' ? 'bg-accent/15 text-accent' : ''}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u._id, u.name)}
                          disabled={actionLoading}
                          className="p-1.5 border border-slate-200 dark:border-slate-800 text-slate-400 hover:border-red-500 hover:text-red-500 rounded-xl transition-colors disabled:opacity-50"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- LECTURES TAB --- */}
      {activeTab === 'lectures' && (
        <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border rounded-3xl overflow-hidden shadow-premium">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4">Title</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium">
                {lectures.map((lec) => (
                  <tr key={lec._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                    <td className="p-4 font-bold">{lec.title}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{lec.subject}</td>
                    <td className="p-4 capitalize">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold
                        ${lec.status === 'completed' ? 'bg-[#03C988]/15 text-[#03C988]' : ''}
                        ${lec.status === 'processing' ? 'bg-accent/15 text-accent' : ''}
                        ${lec.status === 'failed' ? 'bg-red-500/15 text-red-500' : ''}`}>
                        {lec.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-xs">{new Date(lec.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteLecture(lec._id, lec.title)}
                        disabled={actionLoading}
                        className="p-1.5 border border-slate-200 dark:border-slate-800 text-slate-400 hover:border-red-500 hover:text-red-500 rounded-xl transition-colors disabled:opacity-50"
                        title="Delete Lecture"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
