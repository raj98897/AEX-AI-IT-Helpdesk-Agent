import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  Ticket as TicketIcon, 
  Shield, 
  BarChart3, 
  User as UserIcon, 
  LogOut,
  Sparkles,
  RefreshCw,
  Building
} from 'lucide-react';

import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import DashboardView from './components/DashboardView.jsx';
import ChatView from './components/ChatView.jsx';
import TicketsView from './components/TicketsView.jsx';
import AdminView from './components/AdminView.jsx';
import AnalyticsView from './components/AnalyticsView.jsx';
import ProfileView from './components/ProfileView.jsx';
import { User, Ticket } from './types.js';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('aex_token'));
  const [user, setUser] = useState<User | null>(
    localStorage.getItem('aex_user') ? JSON.parse(localStorage.getItem('aex_user')!) : null
  );

  // Router layout states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'tickets' | 'admin' | 'analytics' | 'profile'>('dashboard');
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login');
  
  // Data states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Intertab redirections and seeds
  const [chatSeedText, setChatSeedText] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Fetch tickets for the authenticated employee/admin
  const fetchTickets = async () => {
    if (!token) return;
    setLoadingTickets(true);
    try {
      const res = await fetch('/api/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error('Failed to load tickets stream:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTickets();
    }
  }, [token]);

  // Handle successful login
  const handleLoginSuccess = (newToken: string, loggedUser: User) => {
    localStorage.setItem('aex_token', newToken);
    localStorage.setItem('aex_user', JSON.stringify(loggedUser));
    setToken(newToken);
    setUser(loggedUser);
    setActiveTab('dashboard');
  };

  // Handle successful register
  const handleRegisterSuccess = (newToken: string, loggedUser: User) => {
    localStorage.setItem('aex_token', newToken);
    localStorage.setItem('aex_user', JSON.stringify(loggedUser));
    setToken(newToken);
    setUser(loggedUser);
    setActiveTab('dashboard');
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('aex_token');
    localStorage.removeItem('aex_user');
    setToken(null);
    setUser(null);
    setActiveTab('dashboard');
    setAuthPage('login');
  };

  // Handle profile detail updates from ProfileView
  const handleUpdateUser = (updatedUser: User) => {
    localStorage.setItem('aex_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  // Safe navigation function with state clearing
  const handleNavigate = (tab: typeof activeTab, seedText?: string, targetTicketId?: string) => {
    if (seedText) {
      setChatSeedText(seedText);
    }
    if (targetTicketId) {
      setSelectedTicketId(targetTicketId);
    } else {
      setSelectedTicketId(null);
    }
    setActiveTab(tab);
  };

  // 1. Unauthenticated state switch
  if (!token || !user) {
    if (authPage === 'register') {
      return (
        <Register 
          onRegisterSuccess={handleRegisterSuccess} 
          onNavigateToLogin={() => setAuthPage('login')} 
        />
      );
    }
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        onNavigateToRegister={() => setAuthPage('register')} 
      />
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900" id="portal-root-wrapper">
      
      {/* Primary Top Corporate Navigation Bar */}
      <header className="bg-zinc-950 text-white shrink-0 shadow-md border-b border-zinc-800" id="portal-main-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo area */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg text-white font-extrabold flex items-center justify-center">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-md font-extrabold tracking-tight block">
                  AEX IT HELPDESK
                </span>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block -mt-1">
                  Agentic AI Engine
                </span>
              </div>
            </div>

            {/* Desktop Tabs list */}
            <nav className="hidden md:flex space-x-1 text-xs font-semibold" id="navbar-desktop-tabs">
              
              {/* Dashboard */}
              <button
                id="tab-dashboard-trigger"
                onClick={() => handleNavigate('dashboard')}
                className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-zinc-800 text-white font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>

              {/* Chat AI */}
              <button
                id="tab-chat-trigger"
                onClick={() => handleNavigate('chat')}
                className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-zinc-800 text-white font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Bot className="w-4 h-4" />
                Consult AI Agent
              </button>

              {/* Tickets */}
              <button
                id="tab-tickets-trigger"
                onClick={() => handleNavigate('tickets')}
                className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'tickets'
                    ? 'bg-zinc-800 text-white font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <TicketIcon className="w-4 h-4" />
                Tickets History
              </button>

              {/* Admin Panel (Admin only) */}
              {isAdmin && (
                <button
                  id="tab-admin-trigger"
                  onClick={() => handleNavigate('admin')}
                  className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-zinc-800 text-white font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Security & Admin
                </button>
              )}

              {/* Analytics Panel (Admin only) */}
              {isAdmin && (
                <button
                  id="tab-analytics-trigger"
                  onClick={() => handleNavigate('analytics')}
                  className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'analytics'
                      ? 'bg-zinc-800 text-white font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics BI
                </button>
              )}

              {/* Profile */}
              <button
                id="tab-profile-trigger"
                onClick={() => handleNavigate('profile')}
                className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-zinc-800 text-white font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                Sandbox Profile
              </button>

            </nav>

            {/* Logout and user profile card */}
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex flex-col text-right select-none">
                <span className="text-xs font-bold">{user.name}</span>
                <span className="text-[10px] text-zinc-400 flex items-center gap-0.5 justify-end">
                  <Building className="w-3 h-3" />
                  {user.department}
                </span>
              </div>
              <button
                id="portal-logout-btn"
                onClick={handleLogout}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Navbar Tabs Row */}
      <div className="md:hidden bg-zinc-900 text-zinc-400 border-b border-zinc-800 flex justify-around py-2.5 text-[10px] font-bold" id="navbar-mobile-tabs">
        <button 
          onClick={() => handleNavigate('dashboard')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' && 'text-white'}`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Home
        </button>
        <button 
          onClick={() => handleNavigate('chat')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'chat' && 'text-white'}`}
        >
          <Bot className="w-4 h-4" />
          AI Consult
        </button>
        <button 
          onClick={() => handleNavigate('tickets')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'tickets' && 'text-white'}`}
        >
          <TicketIcon className="w-4 h-4" />
          Tickets
        </button>
        {isAdmin && (
          <button 
            onClick={() => handleNavigate('admin')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'admin' && 'text-white'}`}
          >
            <Shield className="w-4 h-4" />
            Admin
          </button>
        )}
        <button 
          onClick={() => handleNavigate('profile')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'profile' && 'text-white'}`}
        >
          <UserIcon className="w-4 h-4" />
          Profile
        </button>
      </div>

      {/* Primary Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto" id="workspace-main-panel">
        
        {activeTab === 'dashboard' && (
          <DashboardView 
            user={user} 
            tickets={tickets} 
            onNavigate={(tab) => handleNavigate(tab)} 
          />
        )}

        {activeTab === 'chat' && (
          <ChatView 
            user={user} 
            token={token} 
            onNavigate={(tab, tid) => handleNavigate(tab, undefined, tid)}
            chatSeedText={chatSeedText}
            onClearSeedText={() => setChatSeedText(null)}
          />
        )}

        {activeTab === 'tickets' && (
          <TicketsView 
            user={user} 
            token={token} 
            tickets={tickets} 
            onRefreshTickets={fetchTickets}
            initialSelectedTicketId={selectedTicketId}
          />
        )}

        {activeTab === 'admin' && isAdmin && (
          <AdminView token={token} />
        )}

        {activeTab === 'analytics' && isAdmin && (
          <AnalyticsView token={token} />
        )}

        {activeTab === 'profile' && (
          <ProfileView 
            user={user} 
            token={token} 
            onUpdateUser={handleUpdateUser} 
            onNavigate={(tab, seed) => handleNavigate(tab, seed)}
          />
        )}

      </main>

      {/* Simple Professional Footer */}
      <footer className="bg-zinc-100 border-t border-zinc-200 py-4 text-center text-xs text-zinc-400 select-none shrink-0">
        <p>© 2026 AEX Agentic AI Platform. Designed in full compliance with Enterprise AI Solution standards.</p>
      </footer>

    </div>
  );
}
