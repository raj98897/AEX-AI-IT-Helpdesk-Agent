import { Router, Response } from 'express';
import crypto from 'crypto';
import { db, Ticket } from '../db.js';
import { authMiddleware, adminOnly, AuthenticatedRequest } from '../middleware/auth.js';
import { logActivity } from '../utils/logger.js';

const router = Router();

// Helper to generate a sequential ticket ID
function generateTicketId(): string {
  const tickets = db.collection('tickets').find();
  let nextNum = 1001;
  
  if (tickets.length > 0) {
    const nums = tickets
      .map(t => {
        const parts = t.ticketId.split('-');
        return parts.length > 1 ? parseInt(parts[1]) : 0;
      })
      .filter(num => !isNaN(num));
    
    if (nums.length > 0) {
      nextNum = Math.max(...nums) + 1;
    }
  }
  
  return `TICK-${nextNum}`;
}

// @route   GET /api/tickets
// @desc    Get all tickets (Admins see all, Employees see their own)
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, priority, category, search } = req.query;
    let tickets: Ticket[] = [];

    if (req.user!.role === 'admin') {
      tickets = db.collection('tickets').find();
    } else {
      tickets = db.collection('tickets').find(t => t.employeeId === req.user!.id);
    }

    // Apply Status Filter
    if (status) {
      tickets = tickets.filter(t => t.status === status);
    }

    // Apply Priority Filter
    if (priority) {
      tickets = tickets.filter(t => t.priority === priority);
    }

    // Apply Category Filter
    if (category) {
      tickets = tickets.filter(t => t.category.toLowerCase() === (category as string).toLowerCase());
    }

    // Apply General Search Filter (ID, Title, Description, Employee Name)
    if (search) {
      const q = (search as string).toLowerCase();
      tickets = tickets.filter(
        t =>
          t.ticketId.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.employeeName.toLowerCase().includes(q)
      );
    }

    // Sort: newest first
    tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ tickets });
  } catch (error) {
    console.error('Fetch tickets failed:', error);
    res.status(500).json({ message: 'Error retrieving tickets.' });
  }
});

// @route   GET /api/tickets/:id
// @desc    Get single ticket details
router.get('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id;
    const ticket = db.collection('tickets').findOne(t => t.id === id || t.ticketId === id);

    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found.' });
      return;
    }

    // Access control: Non-admins can only see their own tickets
    if (req.user!.role !== 'admin' && ticket.employeeId !== req.user!.id) {
      res.status(403).json({ message: 'Forbidden. You do not have permissions to view this ticket.' });
      return;
    }

    res.json({ ticket });
  } catch (error) {
    console.error('Fetch ticket detail failed:', error);
    res.status(500).json({ message: 'Error retrieving ticket detail.' });
  }
});

// @route   POST /api/tickets
// @desc    Create a new IT ticket manually
router.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, category, priority } = req.body;

    if (!title || !description || !category) {
      res.status(400).json({ message: 'Title, description, and category are required.' });
      return;
    }

    const ticketId = generateTicketId();
    const newTicket: Ticket = {
      id: 'tick_' + crypto.randomUUID(),
      ticketId,
      title,
      description,
      category,
      priority: priority || 'medium',
      status: 'open',
      employeeId: req.user!.id,
      employeeName: req.user!.name,
      assignedTo: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.collection('tickets').insertOne(newTicket);

    logActivity(
      req.user!.id,
      req.user!.email,
      'Ticket Created',
      `Manual ticket ${ticketId} raised: "${title}" [Category: ${category}]`
    );

    res.status(201).json({
      message: 'Ticket successfully created.',
      ticket: newTicket,
    });
  } catch (error) {
    console.error('Manual ticket creation failed:', error);
    res.status(500).json({ message: 'Error creating helpdesk ticket.' });
  }
});

// @route   PUT /api/tickets/:id
// @desc    Update ticket details (Admin or Creator can update)
router.put('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id;
    const { title, description, category, priority, status, assignedTo } = req.body;

    const ticket = db.collection('tickets').findOne(t => t.id === id);
    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found.' });
      return;
    }

    // Access control
    if (req.user!.role !== 'admin' && ticket.employeeId !== req.user!.id) {
      res.status(403).json({ message: 'Permission denied.' });
      return;
    }

    const updates: Partial<Ticket> = {
      updatedAt: new Date().toISOString(),
    };

    // Employees can update text fields; Admin can update everything
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (category) updates.category = category;

    if (req.user!.role === 'admin') {
      if (priority) updates.priority = priority;
      if (status) updates.status = status;
      if (assignedTo !== undefined) updates.assignedTo = assignedTo;
    }

    const success = db.collection('tickets').updateOne(t => t.id === id, updates);

    if (success) {
      const updatedTicket = db.collection('tickets').findOne(t => t.id === id)!;
      
      let actionLog = 'Ticket Details Updated';
      if (status && status !== ticket.status) {
        actionLog = `Ticket Status Changed: ${status.toUpperCase()}`;
      } else if (assignedTo && assignedTo !== ticket.assignedTo) {
        actionLog = 'Ticket Reassigned';
      }

      logActivity(
        req.user!.id,
        req.user!.email,
        actionLog,
        `Ticket ${ticket.ticketId} updated. Status: ${updatedTicket.status}, Assigned: ${updatedTicket.assignedTo || 'Unassigned'}`
      );

      res.json({
        message: 'Ticket updated successfully.',
        ticket: updatedTicket,
      });
    } else {
      res.status(400).json({ message: 'Failed to update ticket.' });
    }
  } catch (error) {
    console.error('Ticket update failed:', error);
    res.status(500).json({ message: 'Error updating ticket.' });
  }
});

// @route   DELETE /api/tickets/:id
// @desc    Delete a ticket (Admin Only)
router.delete('/:id', authMiddleware, adminOnly, (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id;
    const ticket = db.collection('tickets').findOne(t => t.id === id);

    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found.' });
      return;
    }

    const success = db.collection('tickets').deleteOne(t => t.id === id);

    if (success) {
      logActivity(
        req.user!.id,
        req.user!.email,
        'Ticket Deleted',
        `Administrative deletion of ticket ${ticket.ticketId}: "${ticket.title}"`
      );
      res.json({ message: `Ticket ${ticket.ticketId} deleted successfully.` });
    } else {
      res.status(400).json({ message: 'Failed to delete ticket.' });
    }
  } catch (error) {
    console.error('Ticket deletion failed:', error);
    res.status(500).json({ message: 'Error deleting ticket.' });
  }
});

export default router;
