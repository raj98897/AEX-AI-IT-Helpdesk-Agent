export interface User {
  id: string;
  name: string;
  email: string;
  role: 'employee' | 'admin';
  department: string;
}

export interface Ticket {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'assigned' | 'resolved' | 'closed';
  employeeId: string;
  employeeName: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  ticketCreated?: boolean;
  ticketId?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  ipAddress?: string;
}

export interface AnalyticsSummary {
  totalTickets: number;
  openTickets: number;
  assignedTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  todayTickets: number;
  resolutionRate: number;
  totalChats: number;
  totalAuditLogs: number;
}

export interface DistributionItem {
  name: string;
  value: number;
}

export interface TrendItem {
  day: string;
  date: string;
  tickets: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  categoryDistribution: DistributionItem[];
  priorityDistribution: DistributionItem[];
  statusDistribution: DistributionItem[];
  trendData: TrendItem[];
}
