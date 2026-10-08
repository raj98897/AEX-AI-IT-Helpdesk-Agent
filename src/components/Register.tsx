import React, { useState } from 'react';
import { Bot, Mail, Lock, User as UserIcon, Building, ShieldCheck } from 'lucide-react';

interface RegisterProps {
  onRegisterSuccess: (token: string, user: any) => void;
  onNavigateToLogin: () => void;
}

export default function Register({ onRegisterSuccess, onNavigateToLogin }: RegisterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Operations');
  const [role, setRole] = useState<'employee' | 'admin'>('employee');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !department) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, department, role })
      });

      const data = await res.json();
      if (res.ok) {
        onRegisterSuccess(data.token, data.user);
      } else {
        setError(data.message || 'Registration failed. Check inputs.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection timeout. Is the helpdesk backend server active?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center items-center p-4" id="register-root">
      
      {/* Container Card */}
      <div className="bg-white border border-zinc-200 shadow-xl rounded-2xl w-full max-w-lg p-8 space-y-6" id="register-card">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm animate-pulse">
            <Bot className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-950 tracking-tight">Register Employee Profile</h1>
          <p className="text-xs text-zinc-400">Join the AEX AI helpdesk network workspace</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-medium" id="register-error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-600 block">Full Employee Name *</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
              <input
                id="register-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Connor"
                className="w-full bg-zinc-50/20 border border-zinc-200 focus:border-indigo-500 focus:bg-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-all text-zinc-800"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-600 block">Work Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
              <input
                id="register-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah.c@aex.com"
                className="w-full bg-zinc-50/20 border border-zinc-200 focus:border-indigo-500 focus:bg-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-all text-zinc-800"
              />
            </div>
          </div>

          {/* Grid: Department & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-600 block">Department *</label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                <select
                  id="register-department-select"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-zinc-50/20 border border-zinc-200 focus:border-indigo-500 focus:bg-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-all text-zinc-600 cursor-pointer"
                >
                  <option value="Operations">Operations</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-600 block">System Access Role</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                <select
                  id="register-role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'employee' | 'admin')}
                  className="w-full bg-zinc-50/20 border border-zinc-200 focus:border-indigo-500 focus:bg-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-all text-zinc-600 cursor-pointer"
                >
                  <option value="employee">Employee / Staff</option>
                  <option value="admin">Technician / Administrator</option>
                </select>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-600 block">Portal Password *</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
              <input
                id="register-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-50/20 border border-zinc-200 focus:border-indigo-500 focus:bg-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-all text-zinc-800"
              />
            </div>
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:bg-zinc-100 disabled:text-zinc-400"
          >
            {loading ? 'Creating Identity File...' : 'Agree & Register Profile'}
          </button>
        </form>

        {/* Back link */}
        <p className="text-center text-xs text-zinc-400 pt-2">
          Already registered?{' '}
          <button
            id="go-to-login-link"
            onClick={onNavigateToLogin}
            className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
          >
            Sign In Instead
          </button>
        </p>

      </div>
    </div>
  );
}
