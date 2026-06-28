import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Lock, Shield, CheckCircle } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mock list of premium avatars (gradient colors)
  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80', // Female Student
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80', // Male Student
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80', // Female Instructor
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80'  // Male Instructor
  ];

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password && password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      const updateData = { name, email, avatar };
      if (password) {
        updateData.password = password;
      }

      await updateProfile(updateData);
      setSuccess('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col">
        <h1 className="text-3xl font-extrabold font-sans text-slate-800 dark:text-slate-100 tracking-tight">
          Account Profile
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Manage your account profile information and settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Role Summary Card */}
        <div className="bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 rounded-3xl shadow-premium flex flex-col items-center justify-center">
          <div className="relative group cursor-pointer mb-6">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-accent bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-3xl text-slate-700 dark:text-slate-300">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                name.charAt(0).toUpperCase()
              )}
            </div>
          </div>

          <h2 className="text-xl font-bold">{name}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{email}</p>
          
          <div className="flex items-center space-x-2 bg-primary/10 text-primary dark:text-accent-light px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>{user?.role}</span>
          </div>

          {/* Quick Avatar selection */}
          <div className="w-full mt-6 border-t border-slate-100 dark:border-slate-800 pt-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
              Quick Avatars
            </p>
            <div className="flex justify-center space-x-3">
              {avatars.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAvatar(url)}
                  className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-110
                    ${avatar === url ? 'border-accent scale-105' : 'border-transparent'}`}
                >
                  <img src={url} alt={`avatar-${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Columns: Forms */}
        <div className="lg:col-span-2 bg-white dark:bg-darkBg-card border border-slate-200 dark:border-darkBg-border p-6 rounded-3xl shadow-premium">
          <h3 className="text-lg font-bold mb-6">Profile Settings</h3>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-[#03C988]/10 border border-[#03C988]/20 text-[#03C988] p-4 rounded-2xl text-sm mb-6 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              {success}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name field */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-slate-800 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Email field */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-slate-800 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">New Password (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters to update"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-slate-800 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              {/* Confirm Password field */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-slate-800 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-accent hover:bg-accent-light text-white font-semibold rounded-2xl px-6 py-3 shadow-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving Changes...' : 'Save Profile Details'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Profile;
