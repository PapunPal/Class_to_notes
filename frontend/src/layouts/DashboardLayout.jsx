import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  GraduationCap,
  LayoutDashboard,
  UploadCloud,
  Mic,
  History,
  User,
  LogOut,
  Sun,
  Moon,
  Users,
  Menu,
  X,
  MessageSquare
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    const role = user?.role;
    if (role === 'admin') {
      return [
        { label: 'Overview', path: '/admin', icon: LayoutDashboard },
        { label: 'Manage Users', path: '/admin/users', icon: Users },
        { label: 'Profile', path: '/profile', icon: User },
      ];
    } else if (role === 'teacher') {
      return [
        { label: 'Overview', path: '/teacher', icon: LayoutDashboard },
        { label: 'Upload Lecture', path: '/teacher/upload', icon: UploadCloud },
        { label: 'Record Lecture', path: '/teacher/live', icon: Mic },
        { label: 'History', path: '/teacher/history', icon: History },
        { label: 'Profile', path: '/profile', icon: User },
      ];
    } else {
      // Student
      return [
        { label: 'Class Lectures', path: '/student', icon: GraduationCap },
        { label: 'AI Chat Helper', path: '/student/chat', icon: MessageSquare },
        { label: 'Profile', path: '/profile', icon: User },
      ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-primary text-white transition-transform duration-300 transform border-r border-primary-dark/20
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 lg:static lg:z-0`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 bg-primary-dark border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-9 h-9 bg-accent rounded-xl shadow-md">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <span className="font-sans font-extrabold text-lg tracking-wide bg-clip-text text-white">
              ClassNotes AI
            </span>
          </div>
          <button 
            className="lg:hidden text-white hover:text-accent"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar Navigation List */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => {
            const IconComponent = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-accent text-white shadow-md shadow-accent/20' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <IconComponent className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-white/5 bg-primary-dark/40">
          <div className="flex items-center space-x-3 px-2 py-3 rounded-xl mb-2">
            <div className="w-10 h-10 rounded-full bg-slate-700/60 border border-white/10 flex items-center justify-center font-bold text-slate-200">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                user?.name ? user.name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-xl border border-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0c0528]/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
          <div className="flex items-center space-x-4">
            <button 
              className="lg:hidden text-slate-500 dark:text-slate-300 hover:text-primary dark:hover:text-accent"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <h2 className="text-xl font-bold font-sans text-slate-800 dark:text-slate-100 hidden sm:block">
              {location.pathname === '/profile' && 'My Profile'}
              {location.pathname === '/admin' && 'Admin Analytics'}
              {location.pathname === '/admin/users' && 'User Moderation'}
              {location.pathname === '/teacher' && 'Teacher Command Center'}
              {location.pathname === '/teacher/upload' && 'Upload Audio Lecture'}
              {location.pathname === '/teacher/live' && 'Record Classroom Session'}
              {location.pathname === '/teacher/history' && 'Lecture Management'}
              {location.pathname === '/student' && 'Classroom Study Board'}
              {location.pathname === '/student/chat' && 'RAG Chat Helper'}
              {location.pathname.startsWith('/lecture/') && 'Lecture Notebook'}
            </h2>
          </div>

          {/* Theme & User Profile Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Profile Initials (visible on mobile/top bar) */}
            <div className="flex items-center space-x-3 border-l border-slate-200 dark:border-slate-800 pl-3">
              <span className="text-sm font-semibold hidden md:block">{user?.name}</span>
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm select-none border border-slate-200 dark:border-slate-800">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Main Content Window */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;
