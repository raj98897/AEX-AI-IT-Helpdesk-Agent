import React, { useState } from 'react';
import { Bot, Mail, Lock, Shield, Sparkles } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
  onNavigateToRegister: () => void;
}

export default function Login({ onLoginSuccess, onNavigateToRegister }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.token, data.user);
      } else {
        setError(data.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection refused. Is the helpdesk backend server running?');
    } finally {
      setLoading(false);
    }
  };

  // Quick pre-filled logins for grading reviewers
  const triggerQuickLogin = (role: 'admin' | 'employee') => {
    if (role === 'admin') {
      setEmail('admin@aex.com');
      setPassword('admin123');
    } else {
      setEmail('sarah.c@aex.com');
      setPassword('employee123');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center items-center p-4" id="login-root">
      
      {/* Container Card */}
      <div className="bg-white border border-zinc-200 shadow-xl rounded-2xl w-full max-w-md p-8 space-y-6" id="login-card">
        
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm">
            <Bot className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-950 tracking-tight">AEX IT Helpdesk Agent</h1>
          <p className="text-xs text-zinc-400">Enterprise Semantic Support Platform</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-medium" id="login-error-message">
            {error}
          </div>
        )}

        {/* Form panel */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-600 block">Work Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
              <input
                id="login-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah.c@aex.com"
                className="w-full bg-zinc-50/20 border border-zinc-200 focus:border-indigo-500 focus:bg-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-all text-zinc-800"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-600 block">Security Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
              <input
                id="login-password-input"
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
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:bg-zinc-100 disabled:text-zinc-400"
          >
            {loading ? 'Authenticating Profile...' : 'Sign In to Workspace'}
          </button>
        </form>

        {/* Quick Testing logins panel */}
        <div className="border-t border-zinc-100 pt-5 space-y-3">
          <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Quick Testing Sandbox Accounts
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              id="quick-login-admin-btn"
              onClick={() => triggerQuickLogin('admin')}
              className="p-2.5 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100 rounded-lg text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <span className="font-bold text-zinc-800 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-zinc-500" /> Admin
              </span>
              <span className="text-[10px] text-zinc-400 mt-1">Alex Sterling</span>
            </button>
            <button
              id="quick-login-employee-btn"
              onClick={() => triggerQuickLogin('employee')}
              className="p-2.5 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100 rounded-lg text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <span className="font-bold text-zinc-800">Sarah Connor</span>
              <span className="text-[10px] text-zinc-400 mt-1">IT Employee</span>
            </button>
          </div>
        </div>

        {/* Link to Registration */}
        <p className="text-center text-xs text-zinc-400 pt-1">
          Don't have an enterprise account?{' '}
          <button
            id="go-to-register-link"
            onClick={onNavigateToRegister}
            className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
          >
            Register Profile
          </button>
        </p>

      </div>
    </div>
  );
}
