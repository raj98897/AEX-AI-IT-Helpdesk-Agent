import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, adminOnly, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// @route   GET /api/analytics
// @desc    Get aggregated IT support KPIs (Admin Only)
router.get('/', authMiddleware, adminOnly, (req: AuthenticatedRequest, res: Response) => {
  try {
    const tickets = db.collection('tickets').find();
    const chats = db.collection('chats').find();
    const logs = db.collection('logs').find();

    // 1. Core counters
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status === 'open').length;
    const assignedTickets = tickets.filter(t => t.status === 'assigned').length;
    const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
    const closedTickets = tickets.filter(t => t.status === 'closed').length;

    // Tickets raised today
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTickets = tickets.filter(t => t.createdAt.startsWith(todayStr)).length;

    // SLA Resolution Rate = (Resolved + Closed) / Total * 100
    const resolvedOrClosed = resolvedTickets + closedTickets;
    const resolutionRate = totalTickets > 0 ? Math.round((resolvedOrClosed / totalTickets) * 100) : 100;

    // 2. Categories Distribution
    const categoriesList = ['Password Reset', 'VPN', 'Printer', 'Software', 'Network', 'Email', 'Access', 'License', 'Hardware', 'Other'];
    const categoryDistribution = categoriesList.map(cat => {
      return {
        name: cat,
        value: tickets.filter(t => t.category.toLowerCase() === cat.toLowerCase()).length,
      };
    });

    // 3. Priorities Distribution
    const prioritiesList = ['low', 'medium', 'high', 'critical'];
    const priorityDistribution = prioritiesList.map(pri => {
      return {
        name: pri.charAt(0).toUpperCase() + pri.slice(1),
        value: tickets.filter(t => t.priority === pri).length,
      };
    });

    // 4. Status Distribution
    const statusesList = ['open', 'assigned', 'resolved', 'closed'];
    const statusDistribution = statusesList.map(st => {
      return {
        name: st.charAt(0).toUpperCase() + st.slice(1),
        value: tickets.filter(t => t.status === st).length,
      };
    });

    // 5. Dynamic 7-day ticket trend (last 7 days)
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = tickets.filter(t => t.createdAt.startsWith(dateStr)).length;
      
      // Format day name: e.g. "Mon"
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      trendData.push({
        day: dayName,
        date: dateStr,
        tickets: count,
      });
    }

    res.json({
      summary: {
        totalTickets,
        openTickets,
        assignedTickets,
        resolvedTickets,
        closedTickets,
        todayTickets,
        resolutionRate,
        totalChats: chats.length,
        totalAuditLogs: logs.length,
      },
      categoryDistribution,
      priorityDistribution,
      statusDistribution,
      trendData,
    });
  } catch (error) {
    console.error('Fetch analytics failed:', error);
    res.status(500).json({ message: 'Error aggregating dashboard analytics.' });
  }
});

export default router;
