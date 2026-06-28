import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail, User, GraduationCap, School } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // Default role
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return setError('Please fill in all fields');
    }

    setLoading(true);
    setError('');

    try {
      const registeredUser = await register(name, email, password, role);
      // Route based on role
      if (registeredUser.role === 'admin') {
        navigate('/admin');
      } else if (registeredUser.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold font-sans text-white">Create Account</h2>
        <p className="text-slate-400 text-sm mt-1">Get started with AI lecture note generation</p>
      </div>

      {error && (
        <div className="bg-red-500/15 border border-red-500/30 rounded-2xl p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        {/* Name Field */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <User className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
              required
            />
          </div>
        </div>

        {/* Email Field */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@institution.com"
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-3 pl-11 pr-11 text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Role Selector Cards */}
        <div className="flex flex-col space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Register as a</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-200
                ${role === 'student'
                  ? 'border-accent bg-accent/10 text-white'
                  : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700'
                }`}
            >
              <GraduationCap className={`w-8 h-8 mb-2 ${role === 'student' ? 'text-accent' : 'text-slate-500'}`} />
              <span className="font-semibold text-sm">Student</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-200
                ${role === 'teacher'
                  ? 'border-accent bg-accent/10 text-white'
                  : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700'
                }`}
            >
              <School className={`w-8 h-8 mb-2 ${role === 'teacher' ? 'text-accent' : 'text-slate-500'}`} />
              <span className="font-semibold text-sm">Teacher</span>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-gradient-to-r from-secondary to-accent hover:from-secondary-light hover:to-accent-light text-white font-semibold rounded-2xl py-3.5 shadow-lg transition-all duration-200 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="text-center text-sm text-slate-400 font-light mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-accent hover:underline font-semibold">
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default Register;
