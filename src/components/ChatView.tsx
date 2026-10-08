import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Send, 
  Bot, 
  User as UserIcon, 
  Ticket as TicketIcon, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { ChatSession, ChatMessage, User } from '../types.js';

interface ChatViewProps {
  user: User;
  token: string;
  onNavigate: (tab: 'chat' | 'tickets' | 'profile' | 'admin', targetTicketId?: string) => void;
  chatSeedText?: string | null;
  onClearSeedText?: () => void;
}

export default function ChatView({ user, token, onNavigate, chatSeedText, onClearSeedText }: ChatViewProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch all user chat sessions
  const fetchSessions = async (selectLatest = false) => {
    try {
      const res = await fetch('/api/chats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
        if (selectLatest && data.sessions.length > 0) {
          setActiveSession(data.sessions[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    fetchSessions(true);
  }, []);

  // Listen for Sandbox simulation seed texts
  useEffect(() => {
    if (chatSeedText) {
      const loadSimulation = async () => {
        // Find existing thread or open a new one
        let sessionToUse = activeSession;
        if (sessions.length > 0) {
          sessionToUse = sessions[0];
          setActiveSession(sessions[0]);
        } else {
          // Create session
          try {
            const res = await fetch('/api/chats/session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ title: 'Simulated IT Session' })
            });
            if (res.ok) {
              const data = await res.json();
              setSessions(prev => [data.session, ...prev]);
              sessionToUse = data.session;
              setActiveSession(data.session);
            }
          } catch (err) {
            console.error(err);
          }
        }

        if (sessionToUse) {
          setInput(chatSeedText);
          if (onClearSeedText) onClearSeedText();
        }
      };
      loadSimulation();
    }
  }, [chatSeedText, sessions]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, loading]);

  // Create a brand new session
  const createNewSession = async () => {
    setSessionLoading(true);
    try {
      const res = await fetch('/api/chats/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: 'New Support Thread' })
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(prev => [data.session, ...prev]);
        setActiveSession(data.session);
      }
    } catch (err) {
      console.error('Failed to create session:', err);
    } finally {
      setSessionLoading(false);
    }
  };

  // Delete session
  const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat session?')) return;
    try {
      const res = await fetch(`/api/chats/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (activeSession?.id === sessionId) {
          setActiveSession(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  // Select an active session
  const selectSession = async (session: ChatSession) => {
    setSessionLoading(true);
    try {
      const res = await fetch(`/api/chats/${session.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data.session);
      }
    } catch (err) {
      console.error('Failed to load session details:', err);
      setActiveSession(session);
    } finally {
      setSessionLoading(false);
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !activeSession) return;

    const messageText = input.trim();
    setInput('');
    setLoading(true);

    // Optimistically add user message to active state
    const optimisticUserMsg: ChatMessage = {
      id: 'optimistic_u_' + Date.now(),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toISOString(),
    };

    setActiveSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, optimisticUserMsg],
      };
    });

    try {
      const res = await fetch(`/api/chats/${activeSession.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: messageText })
      });

      if (res.ok) {
        const data = await res.json();
        // Replace optimistic messages with real ones returned from DB
        setActiveSession(prev => {
          if (!prev) return null;
          const cleanHistory = prev.messages.filter(m => !m.id.startsWith('optimistic_u_'));
          return {
            ...prev,
            title: data.assistantMessage.text.length > 20 
              ? messageText.substring(0, 25) + '...' 
              : prev.title,
            messages: [...cleanHistory, data.userMessage, data.assistantMessage],
          };
        });
        fetchSessions(false);
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Failed to analyze support message.');
      }
    } catch (err) {
      console.error('Message transmission failed:', err);
      alert('Transmission timeout. Ensure server connectivity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-sm flex h-[calc(100vh-14rem)] min-h-[500px]" id="chat-container-layout">
      
      {/* 1. Left Sidebar: Thread History list */}
      <div className="w-80 border-r border-zinc-200 bg-zinc-50/50 flex flex-col shrink-0 hidden md:flex" id="chat-sidebar-threads">
        <div className="p-4 border-b border-zinc-200 flex justify-between items-center gap-2">
          <h3 className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
            SUPPORT THREADS
          </h3>
          <button
            id="chat-create-new-thread-btn"
            onClick={createNewSession}
            disabled={sessionLoading}
            className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:text-indigo-600 hover:bg-zinc-50 transition-all flex items-center gap-1 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1" id="chat-sessions-list-scroll">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-400">
              No threads recorded yet. Raise one below.
            </div>
          ) : (
            sessions.map(s => {
              const isActive = activeSession?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => selectSession(s)}
                  className={`w-full text-left p-3 rounded-lg flex items-center justify-between gap-2 group transition-all ${
                    isActive 
                      ? 'bg-zinc-900 text-white font-medium shadow-sm' 
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                    <span className="text-xs line-clamp-1 break-all pr-2">
                      {s.title}
                    </span>
                  </div>
                  <Trash2
                    onClick={(e) => deleteSession(e, s.id)}
                    className={`w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-500 cursor-pointer ${
                      isActive ? 'text-zinc-400 hover:text-rose-400' : 'text-zinc-400'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Right Workspace: Core Chat Window */}
      <div className="flex-1 flex flex-col bg-zinc-50/20" id="chat-main-workspace">
        {activeSession ? (
          <>
            <div className="h-14 border-b border-zinc-200 bg-white px-6 flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Bot className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-zinc-800 line-clamp-1">{activeSession.title}</h4>
                  <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">AEX AI Level-1 IT Agent</p>
                </div>
              </div>
              <div className="md:hidden">
                <button 
                  onClick={createNewSession}
                  className="bg-indigo-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6" id="chat-messages-scroll-area">
              {activeSession.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto">
                  <div className="p-4 bg-indigo-50 rounded-full text-indigo-600 animate-pulse mb-4">
                    <Sparkles className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900">How can I assist you today?</h3>
                  <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                    Explain your IT situation (e.g., VPN timed out, lockouts, slow machine, software requests) in your own words. The AI will assist with diagnostics and automatically open official tickets.
                  </p>
                </div>
              ) : (
                activeSession.messages.map(msg => {
                  const isBot = msg.sender === 'assistant';
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex gap-4 ${isBot ? 'items-start' : 'items-start justify-end'}`}
                    >
                      {isBot && (
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div className={`space-y-3 max-w-[80%] ${!isBot && 'order-1'}`}>
                        <div className={`p-4 rounded-xl text-sm leading-relaxed shadow-sm border ${
                          isBot 
                            ? 'bg-white border-zinc-200 text-zinc-800 rounded-tl-none' 
                            : 'bg-indigo-600 border-indigo-700 text-white rounded-tr-none'
                        }`}>
                          <p className="whitespace-pre-line">{msg.text}</p>
                        </div>

                        {isBot && msg.ticketCreated && msg.ticketId && (
                          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
                            <div className="flex gap-3">
                              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
                                <TicketIcon className="w-5 h-5" />
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs font-bold text-indigo-700">{msg.ticketId}</span>
                                  <span className="text-[10px] font-bold bg-indigo-200 text-indigo-800 px-1.5 py-0.2 rounded-full uppercase">Raised</span>
                                </div>
                                <h5 className="text-xs font-bold text-zinc-800">Human technician support ticket dispatched</h5>
                                <p className="text-[10px] text-zinc-500">AI categorized category and queued the task.</p>
                              </div>
                            </div>
                            <button
                              id={`view-ticket-chat-card-${msg.ticketId}`}
                              onClick={() => onNavigate('tickets', msg.ticketId)}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 whitespace-nowrap flex items-center gap-1 bg-white border border-indigo-100 hover:border-indigo-200 px-3 py-1.5 rounded-lg shadow-sm"
                            >
                              View Ticket File
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <span className="block text-[10px] text-zinc-400 mt-1 px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {!isBot && (
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-100 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          <UserIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {loading && (
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                    <Bot className="w-4 h-4 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <div className="bg-white border border-zinc-200/80 p-4 rounded-xl rounded-tl-none shadow-sm flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce"></span>
                      </div>
                      <span className="text-xs text-zinc-400 italic">AEX IT Agent analyzing telemetry...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-zinc-200 shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  id="chat-user-text-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask VPN problem, account locked, laptop slowing down, software download keys..."
                  disabled={loading}
                  className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-zinc-800"
                />
                <button
                  id="chat-send-msg-btn"
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0 disabled:bg-zinc-100 disabled:text-zinc-400"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="flex justify-between text-[10px] text-zinc-400 mt-2 px-1">
                <span>Natural Language Diagnostics System</span>
                <span>Active Model: Gemini 3.5 Flash</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
            <div className="p-4 bg-zinc-100 rounded-full text-zinc-500 mb-4">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-zinc-800">AEX Agentic Chat Service</h3>
            <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
              Open a new support thread session to connect with our Gemini neural IT system.
            </p>
            <button
              id="chat-init-first-thread-btn"
              onClick={createNewSession}
              className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-5 py-2.5 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Open Helpdesk Thread
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
