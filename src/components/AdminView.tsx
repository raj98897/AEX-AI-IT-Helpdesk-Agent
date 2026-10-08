import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Terminal, 
  Users, 
  Search, 
  Filter, 
  RefreshCw,
  Check,
  AlertOctagon,
  Calendar
} from 'lucide-react';
import { ActivityLog, User } from '../types.js';

interface AdminViewProps {
  token: string;
}

export default function AdminView({ token }: AdminViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'users'>('logs');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Search/Filters states
  const [logSearch, setLogSearch] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Fetch security/audit logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees directory
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'logs') {
      fetchLogs();
    } else {
      fetchUsers();
    }
  }, [activeSubTab]);

  // Unique actions list for log filtering
  const logActionsList = Array.from(new Set(logs.map(log => log.action)));

  // Filtered logs list
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userEmail.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(logSearch.toLowerCase());
    
    const matchesAction = logActionFilter ? log.action === logActionFilter : true;
    
    return matchesSearch && matchesAction;
  });

  // Filtered users list
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.department.toLowerCase().includes(userSearch.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in" id="admin-view-panel">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            Security & Administration Desk
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Analyze platform operations audit telemetry, trace AI model evaluations, and manage employee workspace identities.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 bg-zinc-100 p-1.5 rounded-lg border border-zinc-200">
          <button
            id="admin-subtab-logs-trigger"
            onClick={() => setActiveSubTab('logs')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'logs'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            System Audit Logs
          </button>
          <button
            id="admin-subtab-users-trigger"
            onClick={() => setActiveSubTab('users')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'users'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Employee Directory
          </button>
        </div>
      </div>

      {activeSubTab === 'logs' ? (
        /* --- SUB-TAB: SECURITY AUDIT LOGS --- */
        <div className="space-y-4" id="admin-logs-section">
          {/* Filtering row */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-zinc-400" />
              <input
                id="log-search-box"
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search audit trail by user, statement Details or event key..."
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-indigo-500 focus:bg-white rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none transition-all text-zinc-800"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 select-none">
              <select
                id="log-action-filter"
                value={logActionFilter}
                onChange={(e) => setLogActionFilter(e.target.value)}
                className="bg-white border border-zinc-200 text-zinc-600 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer min-w-[150px]"
              >
                <option value="">All Action Events</option>
                {logActionsList.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
              <button 
                id="log-reload-btn"
                onClick={fetchLogs}
                disabled={loading}
                className="p-2 border border-zinc-200 hover:border-zinc-300 text-zinc-500 bg-white rounded-lg transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading && 'animate-spin'}`} />
              </button>
            </div>
          </div>

          {/* Audit trail list display */}
          <div className="bg-white border border-zinc-200/80 rounded-xl shadow-sm overflow-hidden" id="admin-logs-table-container">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                    <th className="px-6 py-3.5">Timestamp</th>
                    <th className="px-6 py-3.5">Target Account</th>
                    <th className="px-6 py-3.5">Operation Key</th>
                    <th className="px-6 py-3.5">Audit Trail Statement Details</th>
                    <th className="px-6 py-3.5">IP Node</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-zinc-400">
                        <Terminal className="w-10 h-10 mx-auto mb-3 opacity-60 text-zinc-300" />
                        <p className="text-sm">No operations logs check out for your parameters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => {
                      const isAi = log.action.toLowerCase().includes('ai');
                      const isAuth = log.action.toLowerCase().includes('login') || log.action.toLowerCase().includes('register');
                      return (
                        <tr key={log.id} className="hover:bg-zinc-50/40 transition-colors text-xs">
                          <td className="px-6 py-4 text-zinc-400 font-mono whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-semibold text-zinc-700">
                            {log.userEmail}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                              isAi ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                              isAuth ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              'bg-zinc-50 text-zinc-600 border-zinc-100'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-zinc-600 leading-relaxed max-w-sm">
                            {log.details}
                          </td>
                          <td className="px-6 py-4 text-zinc-400 font-mono whitespace-nowrap">
                            {log.ipAddress || '127.0.0.1'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* --- SUB-TAB: EMPLOYEE DIRECTORY --- */
        <div className="space-y-4" id="admin-users-section">
          {/* Filtering Row */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-zinc-400" />
              <input
                id="user-search-box"
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search directory by employee name, email alias, department..."
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-indigo-500 focus:bg-white rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none transition-all text-zinc-800"
              />
            </div>
            <button 
              id="users-reload-btn"
              onClick={fetchUsers}
              disabled={loading}
              className="p-2 border border-zinc-200 hover:border-zinc-300 text-zinc-500 bg-white rounded-lg transition-all w-full md:w-auto flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${loading && 'animate-spin'}`} />
            </button>
          </div>

          {/* Employee Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="admin-users-cards-grid">
            {filteredUsers.length === 0 ? (
              <div className="col-span-full bg-white border border-zinc-200 rounded-xl p-12 text-center text-zinc-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-60 text-zinc-300" />
                <p className="text-sm">No employees match this directory query statement.</p>
              </div>
            ) : (
              filteredUsers.map(emp => {
                const isAdminRole = emp.role === 'admin';
                return (
                  <div key={emp.id} className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm space-y-4 hover:border-zinc-300 transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Name & Role Avatar Row */}
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-white ${
                          isAdminRole ? 'bg-zinc-950' : 'bg-indigo-600'
                        }`}>
                          {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900">{emp.name}</h4>
                          <span className={`inline-flex text-[9px] font-bold uppercase mt-0.5 px-2 py-0.2 rounded-full border ${
                            isAdminRole 
                              ? 'bg-zinc-100 text-zinc-800 border-zinc-200' 
                              : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          }`}>
                            {emp.role}
                          </span>
                        </div>
                      </div>

                      {/* Contact metadata */}
                      <div className="text-xs space-y-1 pt-1.5 text-zinc-500">
                        <p className="flex justify-between">
                          <span>Email Alias:</span>
                          <strong className="text-zinc-700 font-medium truncate max-w-[150px]">{emp.email}</strong>
                        </p>
                        <p className="flex justify-between">
                          <span>Business Department:</span>
                          <strong className="text-zinc-700 font-medium">{emp.department || 'N/A'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-100 flex justify-between items-center text-[10px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Signed: {new Date(emp.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Enabled
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
