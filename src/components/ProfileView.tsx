import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Lock, 
  MapPin, 
  ShieldAlert, 
  Key, 
  Building, 
  Check, 
  Play,
  CheckCircle2
} from 'lucide-react';
import { User } from '../types.js';

interface ProfileViewProps {
  user: User;
  token: string;
  onUpdateUser: (updatedUser: User) => void;
  onNavigate: (tab: 'chat' | 'tickets' | 'profile' | 'admin', seedText?: string) => void;
}

export default function ProfileView({ user, token, onUpdateUser, onNavigate }: ProfileViewProps) {
  // Update details form
  const [name, setName] = useState(user.name);
  const [department, setDepartment] = useState(user.department);
  const [submittingDetails, setSubmittingDetails] = useState(false);
  const [successDetails, setSuccessDetails] = useState(false);

  // Password reset form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [successPassword, setSuccessPassword] = useState(false);

  // Corporate IT Simulator cases
  const simulatorCases = [
    {
      title: "VPN connection timeout",
      text: "I am trying to connect to the US West Cisco VPN gateway but I am receiving a TLS Handshake Timeout error. I need to push some code and I am completely blocked.",
      badge: "VPN"
    },
    {
      title: "Active Directory Account Lockout",
      text: "Help! I entered my old laptop password 3 times and now my Active Directory account is completely locked out. I can't access Slack, Outlook, or Jira. Please help me unlock it.",
      badge: "Password Reset"
    },
    {
      title: "Floor 3 laser printer paper jam",
      text: "The physical LaserJet printing unit in the Floor 3 hallway is showing error code 0x44 (mechanical paper jam) on the LCD board and won't register prints. We have an urgent executive report to print.",
      badge: "Printer"
    },
    {
      title: "Adobe Illustrator License Key",
      text: "Hi, I am starting our new brand illustrations today and I need an Adobe Creative Suite enterprise activation license key. Can you assist me in purchasing or allocating one?",
      badge: "License"
    },
    {
      title: "Workstation is heavily slowing down",
      text: "My company Lenovo ThinkPad has been incredibly slow since yesterday, with CPU spiking to 100% on idle. I checked Task Manager and it looks like some core index processes are stuck.",
      badge: "Hardware"
    }
  ];

  // Submit profile details
  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !department.trim()) return;

    setSubmittingDetails(true);
    setSuccessDetails(false);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, department })
      });

      if (res.ok) {
        const data = await res.json();
        onUpdateUser(data.user);
        setSuccessDetails(true);
        setTimeout(() => setSuccessDetails(false), 3000);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingDetails(false);
    }
  };

  // Submit password reset
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match.');
      return;
    }

    setSubmittingPassword(true);
    setSuccessPassword(false);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (res.ok) {
        setSuccessPassword(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSuccessPassword(false), 3000);
      } else {
        const data = await res.json();
        alert(data.message || 'Incorrect password entered.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPassword(false);
    }
  };

  // Run simulation
  const handleTriggerSimulation = (text: string) => {
    // Send to Chat panel and auto populate input
    onNavigate('chat', text);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in" id="profile-container-view">
      
      {/* Left panel: forms */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Profile metadata details update */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-sm space-y-5">
          <div className="border-b border-zinc-100 pb-4">
            <h3 className="text-md font-bold text-zinc-900 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-indigo-500" />
              Corporate Profile Details
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Configure your official full name and business unit department.</p>
          </div>
          <form onSubmit={handleUpdateDetails} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-600 block">Email Address (Immutable)</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm bg-zinc-50 text-zinc-400 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-600 block">Workspace Role (Immutable)</label>
                <input
                  type="text"
                  disabled
                  value={user.role.toUpperCase()}
                  className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm bg-zinc-50 text-zinc-400 outline-none uppercase font-mono text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-600 block">Full Employee Name *</label>
                <input
                  id="profile-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2.5 text-sm outline-none text-zinc-800 bg-zinc-50/10"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-600 block">Business Unit Department *</label>
                <input
                  id="profile-dept-input"
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2.5 text-sm outline-none text-zinc-800 bg-zinc-50/10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {successDetails ? (
                <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Changes successfully saved.
                </span>
              ) : <span />}
              <button
                id="profile-details-submit-btn"
                type="submit"
                disabled={submittingDetails}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                {submittingDetails ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Security Password Change */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-sm space-y-5">
          <div className="border-b border-zinc-100 pb-4">
            <h3 className="text-md font-bold text-zinc-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-500" />
              Modify Access Password
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Ensure your corporate portal stays safe using high-complexity structures.</p>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-600 block">Current Password</label>
              <input
                id="profile-curr-pass"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-zinc-200 focus:border-indigo-500 rounded-lg p-2.5 text-sm outline-none text-zinc-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-600 block">New Password</label>
                <input
                  id="profile-new-pass"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-zinc-200 focus:border-indigo-500 rounded-lg p-2.5 text-sm outline-none text-zinc-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-600 block">Confirm New Password</label>
                <input
                  id="profile-confirm-pass"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-zinc-200 focus:border-indigo-500 rounded-lg p-2.5 text-sm outline-none text-zinc-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {successPassword ? (
                <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Password changed successfully.
                </span>
              ) : <span />}
              <button
                id="profile-password-submit-btn"
                type="submit"
                disabled={submittingPassword}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                {submittingPassword ? 'Changing...' : 'Reset Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right side: Sandbox Simulator */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col justify-between h-fit gap-6" id="profile-sandbox-simulator">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <Building className="w-6 h-6" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Enterprise Sandbox</h3>
          </div>
          <h4 className="text-lg font-extrabold text-zinc-900 tracking-tight leading-snug">
            Corporate Issue Simulator
          </h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Click any common enterprise issue below. The simulator will automatically populate the AI Agent chat thread, forcing Gemini to run L1 classification, routing analysis, and auto-raise tickets in real time.
          </p>

          <div className="space-y-2.5 pt-3">
            {simulatorCases.map((sc, idx) => (
              <button
                key={idx}
                id={`trigger-simulation-case-${idx}`}
                onClick={() => handleTriggerSimulation(sc.text)}
                className="w-full text-left p-3 bg-white border border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50/20 rounded-lg shadow-sm transition-all flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-bold tracking-wider bg-zinc-100 text-zinc-500 px-1.5 py-0.2 rounded group-hover:bg-indigo-100 group-hover:text-indigo-700 uppercase">
                    {sc.badge}
                  </span>
                  <h5 className="text-xs font-bold text-zinc-800 mt-1 line-clamp-1">{sc.title}</h5>
                </div>
                <Play className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-200/60 flex items-center justify-between text-[10px] text-zinc-400 font-semibold select-none">
          <span>AEX EVALUATION MODULE</span>
          <span>SANDBOX MODE ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
