import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Routes Guard
import ProtectedRoute from './routes/ProtectedRoutes';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

// Teacher Pages
import TeacherDashboard from './pages/TeacherDashboard';
import UploadLecture from './pages/UploadLecture';
import LiveLecture from './pages/LiveLecture';
import LectureHistory from './pages/LectureHistory';
import NoteEditor from './pages/NoteEditor';

// Student Pages
import StudentDashboard from './pages/StudentDashboard';
import LectureNotesView from './pages/LectureNotesView';
import AIChatAssistant from './pages/AIChatAssistant';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';

const queryClient = new QueryClient();

// Smart Redirector for root route "/"
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="w-8 h-8 border-4 border-primary border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
};

const DashboardRoutesWrapper = () => {
  return (
    <DashboardLayout>
      <Routes>
        {/* Shared Profiles */}
        <Route path="profile" element={<Profile />} />
        <Route path="lecture/:lectureId" element={<LectureNotesView />} />

        {/* Admin Section */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/users" element={<AdminDashboard />} />
        </Route>

        {/* Teacher Section */}
        <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
          <Route path="teacher" element={<TeacherDashboard />} />
          <Route path="teacher/upload" element={<UploadLecture />} />
          <Route path="teacher/live" element={<LiveLecture />} />
          <Route path="teacher/history" element={<LectureHistory />} />
          <Route path="teacher/edit/:lectureId" element={<NoteEditor />} />
        </Route>

        {/* Student Section */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="student" element={<StudentDashboard />} />
          <Route path="student/chat" element={<AIChatAssistant />} />
        </Route>

        {/* Fallback inside dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Landing Page */}
              <Route path="/" element={<LandingPage />} />

              {/* Public Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* Protected Dashboard Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'student']} />}>
                <Route path="/*" element={<DashboardRoutesWrapper />} />
              </Route>

              {/* Catch all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
