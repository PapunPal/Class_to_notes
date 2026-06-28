import React from 'react';
import { Outlet } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden px-4">
      {/* Decorative floating animated background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full filter blur-[120px] opacity-40 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent rounded-full filter blur-[120px] opacity-40 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-secondary rounded-full filter blur-[100px] opacity-30 animate-pulse" style={{ animationDelay: '4s' }}></div>

      {/* Main Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-md bg-slate-950/40 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-8 transition-all duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-primary to-accent rounded-2xl shadow-lg mb-4">
            <GraduationCap className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold font-sans text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-accent tracking-tight">
            ClassNotes AI
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-light">
            Smart notes generation from classroom audio
          </p>
        </div>

        {/* Child Form Pages */}
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
