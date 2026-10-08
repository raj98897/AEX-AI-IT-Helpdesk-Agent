import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  X, 
  Ticket as TicketIcon, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  User as UserIcon,
  RefreshCw,
  Info
} from 'lucide-react';
import { Ticket, User } from '../types.js';

interface TicketsViewProps {
  user: User;
  token: string;
  tickets: Ticket[];
  onRefreshTickets: () => void;
  initialSelectedTicketId?: string | null;
}

export default function TicketsView({ user, token, tickets, onRefreshTickets, initialSelectedTicketId }: TicketsViewProps) {
  const isAdmin = user.role === 'admin';

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Create ticket form modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'Password Reset',
    priority: 'medium' as Ticket['priority']
  });

  // Ticket Detail Modal
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [adminAssignee, setAdminAssignee] = useState('');
  const [adminStatus, setAdminStatus] = useState<Ticket['status']>('open');
  const [adminPriority, setAdminPriority] = useState<Ticket['priority']>('medium');
  const [submitting, setSubmitting] = useState(false);

  // Initialize selected ticket if redirected from chat session card
  useEffect(() => {
    if (initialSelectedTicketId) {
      const match = tickets.find(t => t.ticketId === initialSelectedTicketId || t.id === initialSelectedTicketId);
      if (match) {
        handleOpenDetail(match);
      }
    }
  }, [initialSelectedTicketId, tickets]);

  // Open detail modal
  const handleOpenDetail = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setAdminAssignee(ticket.assignedTo || '');
    setAdminStatus(ticket.status);
    setAdminPriority(ticket.priority);
    setIsDetailOpen(true);
  };

  // Create Ticket manually
  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      alert('Please fill out all mandatory fields.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTicket)
      });
      if (res.ok) {
        setIsCreateOpen(false);
        setNewTicket({
          title: '',
          description: '',
          category: 'Password Reset',
          priority: 'medium'
        });
        onRefreshTickets();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Error creating ticket.');
      }
    } catch (err) {
      console.error(err);
      alert('Network transmission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Admin: Update Ticket assignment or status
  const handleAdminUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: adminStatus,
          assignedTo: adminAssignee || null,
          priority: adminPriority
        })
      });
      if (res.ok) {
        setIsDetailOpen(false);
        setSelectedTicket(null);
        onRefreshTickets();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Error updating ticket status.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Admin: Delete Ticket
  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Are you absolutely sure you want to permanently delete this support ticket?')) return;
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setIsDetailOpen(false);
        setSelectedTicket(null);
        onRefreshTickets();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Deletion failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    // 1. Search Query
    const query = search.toLowerCase();
    const matchesSearch = 
      t.ticketId.toLowerCase().includes(query) ||
      t.title.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.employeeName.toLowerCase().includes(query);

    // 2. Filters
    const matchesStatus = statusFilter ? t.status === statusFilter : true;
    const matchesPriority = priorityFilter ? t.priority === priorityFilter : true;
    const matchesCategory = categoryFilter ? t.category.toLowerCase() === categoryFilter.toLowerCase() : true;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in" id="tickets-view-panel">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <TicketIcon className="w-6 h-6 text-indigo-500" />
            Support Ticket History
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {isAdmin 
              ? 'View and manage all active helpdesk support requests enterprise-wide.' 
              : 'Browse status, history, and updates for your submitted assistance requests.'
            }
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button 
            id="ticket-refresh-list-btn"
            onClick={onRefreshTickets}
            className="p-2 border border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-zinc-800 bg-white rounded-lg transition-all"
            title="Reload Tickets"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {!isAdmin && (
            <button
              id="ticket-create-modal-trigger"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              File Support Ticket
            </button>
          )}
        </div>
      </div>

      {/* Searching and filtering criteria */}
      <div className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row items-center gap-3.5" id="tickets-filtering-controls">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-zinc-400" />
          <input
            id="ticket-search-box"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, summary topic, description details..."
            className="w-full bg-zinc-50 border border-zinc-200 focus:border-indigo-500 focus:bg-white rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none transition-all text-zinc-800"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3.5 w-full lg:w-auto shrink-0" id="tickets-filtering-dropdowns">
          {/* Status Filter */}
          <select
            id="ticket-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-zinc-200 text-zinc-600 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer min-w-[120px]"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            id="ticket-priority-filter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-white border border-zinc-200 text-zinc-600 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer min-w-[120px]"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          {/* Category Filter */}
          <select
            id="ticket-category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-zinc-200 text-zinc-600 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer min-w-[120px]"
          >
            <option value="">All Categories</option>
            <option value="Password Reset">Password Reset</option>
            <option value="VPN">VPN</option>
            <option value="Printer">Printer</option>
            <option value="Software">Software</option>
            <option value="Network">Network</option>
            <option value="Email">Email</option>
            <option value="Access">Access</option>
            <option value="License">License</option>
            <option value="Hardware">Hardware</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Main Tickets Table / Grid */}
      <div className="bg-white border border-zinc-200/80 rounded-xl shadow-sm overflow-hidden" id="tickets-table-container">
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            <TicketIcon className="w-12 h-12 mx-auto mb-4 text-zinc-300 opacity-60" />
            <p className="text-sm font-medium">No support tickets matched your filtering criteria.</p>
            <p className="text-xs mt-1">Try clearing some query selections or check back later.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                  <th className="px-6 py-3.5">ID</th>
                  <th className="px-6 py-3.5">Issue Topic Summary</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Urgency</th>
                  <th className="px-6 py-3.5">Status</th>
                  {isAdmin && <th className="px-6 py-3.5">Employee</th>}
                  <th className="px-6 py-3.5">Technician</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredTickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-zinc-50/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
                        {ticket.ticketId}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-[300px]">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-semibold text-zinc-800 truncate">{ticket.title}</h4>
                        <p className="text-xs text-zinc-400 line-clamp-1">{ticket.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-600 font-medium">
                      {ticket.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        ticket.priority === 'critical' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                        ticket.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                        ticket.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-zinc-50 text-zinc-700 border-zinc-100'
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        ticket.status === 'open' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        ticket.status === 'assigned' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        'bg-zinc-100 text-zinc-500'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-indigo-600">
                        {ticket.employeeName}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-500">
                      {ticket.assignedTo ? (
                        <span className="flex items-center gap-1.5 font-medium text-zinc-700">
                          <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                          {ticket.assignedTo}
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      <button
                        id={`action-view-ticket-${ticket.ticketId}`}
                        onClick={() => handleOpenDetail(ticket)}
                        className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Create Manual Ticket */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" id="ticket-create-modal">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <h3 className="text-md font-bold text-zinc-800 flex items-center gap-2">
                <TicketIcon className="w-5 h-5 text-indigo-500" />
                File Assistance Support Ticket
              </h3>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-200 text-zinc-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTicketSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-600 block">Brief Problem Topic Summary *</label>
                <input
                  id="modal-create-ticket-title"
                  type="text"
                  required
                  value={newTicket.title}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Printer floor 2 paper feeding issue"
                  className="w-full border border-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2.5 text-sm outline-none text-zinc-800 bg-zinc-50/20"
                />
              </div>

              {/* Grid: Category & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-600 block">IT Category</label>
                  <select
                    id="modal-create-ticket-category"
                    value={newTicket.category}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-zinc-200 focus:border-indigo-500 rounded-lg p-2.5 text-sm outline-none text-zinc-800 bg-white cursor-pointer"
                  >
                    <option value="Password Reset">Password Reset</option>
                    <option value="VPN">VPN</option>
                    <option value="Printer">Printer</option>
                    <option value="Software">Software</option>
                    <option value="Network">Network</option>
                    <option value="Email">Email</option>
                    <option value="Access">Access</option>
                    <option value="License">License</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-600 block">Estimated Urgency</label>
                  <select
                    id="modal-create-ticket-priority"
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value as Ticket['priority'] }))}
                    className="w-full border border-zinc-200 focus:border-indigo-500 rounded-lg p-2.5 text-sm outline-none text-zinc-800 bg-white cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-600 block">Detailed Explanation *</label>
                <textarea
                  id="modal-create-ticket-description"
                  required
                  rows={4}
                  value={newTicket.description}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide precise descriptions (error codes, physical state, timestamps) to accelerate technician response."
                  className="w-full border border-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2.5 text-sm outline-none text-zinc-800 bg-zinc-50/20"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-500 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  id="modal-create-ticket-submit"
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:bg-zinc-100 disabled:text-zinc-400"
                >
                  {submitting ? 'Raising Ticket...' : 'File Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Ticket Deep Detail / Administration Modal */}
      {isDetailOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" id="ticket-detail-modal">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xl w-full max-w-xl overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                  {selectedTicket.ticketId}
                </span>
                <span className="text-xs text-zinc-400">·</span>
                <h3 className="text-sm font-bold text-zinc-800 truncate max-w-[280px]">
                  {selectedTicket.title}
                </h3>
              </div>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-200 text-zinc-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Core Information Panel */}
              <div className="space-y-3">
                <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-lg space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Issue Description</span>
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Metadata Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs p-1">
                  <div>
                    <span className="text-zinc-400 block font-semibold uppercase text-[10px]">Category</span>
                    <strong className="text-zinc-700 mt-0.5 block">{selectedTicket.category}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-semibold uppercase text-[10px]">Department</span>
                    <strong className="text-zinc-700 mt-0.5 block">Operations</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-semibold uppercase text-[10px]">Date Filed</span>
                    <strong className="text-zinc-700 mt-0.5 block">
                      {new Date(selectedTicket.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Actions Section: Admin updates OR Employee tracking */}
              {isAdmin ? (
                <form onSubmit={handleAdminUpdateSubmit} className="pt-4 border-t border-zinc-100 space-y-4">
                  <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-500" />
                    Administrative Action Desk
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Status Select */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Process Status</label>
                      <select
                        id="modal-admin-status"
                        value={adminStatus}
                        onChange={(e) => setAdminStatus(e.target.value as Ticket['status'])}
                        className="w-full border border-zinc-200 rounded-lg p-2 text-xs outline-none bg-white cursor-pointer"
                      >
                        <option value="open">Open / Queue</option>
                        <option value="assigned">Assigned / Work</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed / Archive</option>
                      </select>
                    </div>

                    {/* Priority Select */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Adjust Priority</label>
                      <select
                        id="modal-admin-priority"
                        value={adminPriority}
                        onChange={(e) => setAdminPriority(e.target.value as Ticket['priority'])}
                        className="w-full border border-zinc-200 rounded-lg p-2 text-xs outline-none bg-white cursor-pointer"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>

                    {/* Technician Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Assign Technician</label>
                      <input
                        id="modal-admin-assignee"
                        type="text"
                        value={adminAssignee}
                        onChange={(e) => setAdminAssignee(e.target.value)}
                        placeholder="e.g. Alex Sterling"
                        className="w-full border border-zinc-200 rounded-lg p-2 text-xs outline-none bg-zinc-50/20 text-zinc-800"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <button
                      id="modal-admin-delete-btn"
                      type="button"
                      onClick={() => handleDeleteTicket(selectedTicket.id)}
                      className="px-3.5 py-2 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      Delete Ticket
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsDetailOpen(false)}
                        className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-500 rounded-lg text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        id="modal-admin-submit-btn"
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:bg-zinc-100"
                      >
                        {submitting ? 'Saving changes...' : 'Commit Updates'}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="pt-4 border-t border-zinc-100 space-y-3">
                  <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wide">
                    Technician Dispatch Stream
                  </h4>
                  <div className="p-4 rounded-lg bg-indigo-50/30 border border-indigo-100/40 text-xs text-zinc-600 flex items-start gap-3">
                    <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg shrink-0 mt-0.5">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div>
                      {selectedTicket.status === 'open' ? (
                        <p className="leading-relaxed">
                          Your request is currently sitting in our global <strong>Unassigned Queue</strong>. Our AI agent classified and routed the file. An enterprise technician will pull this file shortly.
                        </p>
                      ) : selectedTicket.status === 'assigned' ? (
                        <p className="leading-relaxed">
                          Your request is in active analysis. Assigned support technician: <strong>{selectedTicket.assignedTo}</strong>. We will message your department dashboard on status resolution.
                        </p>
                      ) : selectedTicket.status === 'resolved' ? (
                        <p className="leading-relaxed text-emerald-800">
                          <strong>Resolved!</strong> This issue has been checklist resolved by technician <strong>{selectedTicket.assignedTo}</strong>. If you still experience issues, reopen a chat with the AI agent.
                        </p>
                      ) : (
                        <p className="leading-relaxed">
                          This support file is closed and archived in helpdesk records.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
