import React from 'react';
import { 
  Ticket as TicketIcon, 
  MessageSquare, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Shield,
  LifeBuoy
} from 'lucide-react';
import { Ticket, User } from '../types.js';

interface DashboardViewProps {
  user: User;
  tickets: Ticket[];
  onNavigate: (tab: 'chat' | 'tickets' | 'profile' | 'admin') => void;
}

export default function DashboardView({ user, tickets, onNavigate }: DashboardViewProps) {
  const isAdmin = user.role === 'admin';

  // Derived metrics
  const myTickets = isAdmin ? tickets : tickets.filter(t => t.employeeId === user.id);
  const openCount = myTickets.filter(t => t.status === 'open').length;
  const assignedCount = myTickets.filter(t => t.status === 'assigned').length;
  const resolvedCount = myTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  
  const criticalCount = myTickets.filter(t => t.priority === 'critical' || t.priority === 'high').length;

  const recentTickets = myTickets.slice(0, 4);

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-view-container">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-100 pb-5">
        <div>
          <span className="text-xs font-semibold tracking-wider text-indigo-600 uppercase">
            AEX AI HELPDESK SYSTEM
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mt-1">
            Welcome back, {user.name}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isAdmin 
              ? 'IT Administration & Operations Command Center' 
              : `Secure employee support portal — ${user.department} Department`
            }
          </p>
        </div>
        <div>
          <button 
            id="quick-start-chat-btn"
            onClick={() => onNavigate('chat')}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-5 py-2.5 rounded-lg shadow-sm transition-all hover:scale-[1.01]"
          >
            <MessageSquare className="w-4 h-4" />
            Consult AEX AI Agent
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="metrics-cards-grid">
        {/* Total tickets */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-sm flex items-start gap-4 hover:border-zinc-300 transition-all">
          <div className="p-3 bg-zinc-50 rounded-lg text-zinc-600">
            <TicketIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Your Tickets</p>
            <h3 className="text-3xl font-bold text-zinc-900 mt-1">{myTickets.length}</h3>
            <p className="text-xs text-zinc-400 mt-1">Total submitted support files</p>
          </div>
        </div>

        {/* Pending Tickets */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-sm flex items-start gap-4 hover:border-zinc-300 transition-all">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Awaiting Action</p>
            <h3 className="text-3xl font-bold text-zinc-900 mt-1">{openCount + assignedCount}</h3>
            <p className="text-xs text-amber-600 font-medium mt-1">
              {openCount} unassigned · {assignedCount} in progress
            </p>
          </div>
        </div>

        {/* Resolved tickets */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-sm flex items-start gap-4 hover:border-zinc-300 transition-all">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Resolved Tickets</p>
            <h3 className="text-3xl font-bold text-zinc-900 mt-1">{resolvedCount}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              {myTickets.length > 0 
                ? `${Math.round((resolvedCount / myTickets.length) * 100)}% resolution rate` 
                : '100% resolution rate'
              }
            </p>
          </div>
        </div>

        {/* Urgent tickets */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-sm flex items-start gap-4 hover:border-zinc-300 transition-all">
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">High / Critical</p>
            <h3 className="text-3xl font-bold text-zinc-900 mt-1">{criticalCount}</h3>
            <p className="text-xs text-rose-600 font-medium mt-1">Requires immediate response</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="dashboard-body-grid">
        {/* Recent Tickets Table/List */}
        <div className="lg:col-span-2 bg-white border border-zinc-200/80 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Recent Support Activities
            </h2>
            <button 
              id="view-all-tickets-btn"
              onClick={() => onNavigate('tickets')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              View Ticket History
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-zinc-100 overflow-x-auto">
            {recentTickets.length === 0 ? (
              <div className="p-8 text-center text-zinc-400">
                <LifeBuoy className="w-10 h-10 mx-auto mb-3 opacity-60 text-zinc-300" />
                <p className="text-sm">No active tickets registered. Consult the AI agent to open one!</p>
              </div>
            ) : (
              recentTickets.map(ticket => (
                <div key={ticket.id} className="p-5 hover:bg-zinc-50/50 transition-colors flex items-center justify-between min-w-[500px]">
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {ticket.ticketId}
                      </span>
                      <h4 className="text-sm font-semibold text-zinc-800 line-clamp-1">{ticket.title}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span>Category: <strong className="text-zinc-700">{ticket.category}</strong></span>
                      <span>·</span>
                      <span>Created: <strong className="text-zinc-700">{new Date(ticket.createdAt).toLocaleDateString()}</strong></span>
                      {isAdmin && (
                        <>
                          <span>·</span>
                          <span>Employee: <strong className="text-indigo-600">{ticket.employeeName}</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Priority Badge */}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      ticket.priority === 'critical' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                      ticket.priority === 'high' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                      ticket.priority === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-zinc-50 text-zinc-700 border border-zinc-100'
                    }`}>
                      {ticket.priority.toUpperCase()}
                    </span>

                    {/* Status Badge */}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      ticket.status === 'open' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                      ticket.status === 'assigned' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                      ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      'bg-zinc-100 text-zinc-500'
                    }`}>
                      {ticket.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Informative Side-panel */}
        <div className="space-y-6">
          <div className="bg-zinc-900 text-white rounded-xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between h-full min-h-[300px]">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield className="w-40 h-40" />
            </div>
            <div className="relative space-y-4">
              <span className="bg-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full border border-indigo-500/30">
                Agentic Operations
              </span>
              <h3 className="text-xl font-bold tracking-tight">
                Self-Service AI Automation Engine
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Our Level-1 helpdesk is governed by a semantic AI Agent. Simply open a chat, express your hardware, license, VPN or network problems in natural language, and let the AI:
              </p>
              <ul className="text-xs space-y-2 text-zinc-300 list-disc list-inside">
                <li>Formulate instant technical step guides.</li>
                <li>Assign urgent routing priorities automatically.</li>
                <li>Raise ticket files instantly in our records.</li>
              </ul>
            </div>
            <div className="relative pt-6 border-t border-zinc-800 flex justify-between items-center">
              <span className="text-xs text-zinc-400">Powered by Gemini 3.5 Flash</span>
              <button 
                id="sidebar-chat-action-btn"
                onClick={() => onNavigate('chat')}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                Launch Assistant
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
