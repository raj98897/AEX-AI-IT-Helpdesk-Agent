import { Router, Response } from 'express';
import crypto from 'crypto';
import { db, ChatSession, ChatMessage, Ticket } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { analyzeEmployeeIssue } from '../services/gemini.js';
import { logActivity } from '../utils/logger.js';

const router = Router();

// Helper to generate sequential Ticket ID (same logic as tickets router)
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

// @route   GET /api/chats
// @desc    Get all chat sessions for the logged-in user
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessions = db.collection('chats').find(s => s.userId === req.user!.id);
    // Sort: most recently updated first
    sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    res.json({ sessions });
  } catch (error) {
    console.error('Fetch chats failed:', error);
    res.status(500).json({ message: 'Error retrieving chat sessions.' });
  }
});

// @route   GET /api/chats/:id
// @desc    Get single chat session messages
router.get('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = db.collection('chats').findOne(s => s.id === req.params.id);
    if (!session) {
      res.status(404).json({ message: 'Chat session not found.' });
      return;
    }
    if (session.userId !== req.user!.id) {
      res.status(403).json({ message: 'Forbidden. Access to session denied.' });
      return;
    }
    res.json({ session });
  } catch (error) {
    console.error('Fetch session failed:', error);
    res.status(500).json({ message: 'Error retrieving chat session details.' });
  }
});

// @route   POST /api/chats/session
// @desc    Start a new chat session
router.post('/session', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title } = req.body;
    const newSession: ChatSession = {
      id: 'chat_' + crypto.randomUUID(),
      userId: req.user!.id,
      title: title || 'New Support Thread',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.collection('chats').insertOne(newSession);

    res.status(201).json({ session: newSession });
  } catch (error) {
    console.error('Create chat session failed:', error);
    res.status(500).json({ message: 'Error opening new support chat.' });
  }
});

// @route   POST /api/chats/:id/message
// @desc    Post a message and get Gemini AI Agent's evaluation
router.post('/:id/message', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessionId = req.params.id;
    const { text } = req.body;

    if (!text) {
      res.status(400).json({ message: 'Message content text is required.' });
      return;
    }

    const session = db.collection('chats').findOne(s => s.id === sessionId);
    if (!session) {
      res.status(404).json({ message: 'Chat session not found.' });
      return;
    }
    if (session.userId !== req.user!.id) {
      res.status(403).json({ message: 'Forbidden. Access denied.' });
      return;
    }

    // 1. Create and save user message
    const userMessage: ChatMessage = {
      id: 'msg_' + crypto.randomUUID(),
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    // 2. Call Gemini AI Agent to classify and analyze issue
    const aiAnalysis = await analyzeEmployeeIssue(text);

    // 3. Create Support Ticket if Gemini recommends it
    let ticketCreated = false;
    let createdTicketId: string | undefined = undefined;
    let createdTicketDbId: string | undefined = undefined;

    if (aiAnalysis.create_ticket) {
      const ticketId = generateTicketId();
      const ticketDbId = 'tick_' + crypto.randomUUID();
      
      const newTicket: Ticket = {
        id: ticketDbId,
        ticketId,
        title: `AI Auto-Created: [${aiAnalysis.category}] Urgent Request`,
        description: `Employee Statement: "${text}"\n\nAI Diagnostics:\n- Category: ${aiAnalysis.category}\n- Assessed Priority: ${aiAnalysis.priority}\n- Suggested Workflow Action: Human technician dispatch.`,
        category: aiAnalysis.category,
        priority: aiAnalysis.priority,
        status: 'open',
        employeeId: req.user!.id,
        employeeName: req.user!.name,
        assignedTo: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.collection('tickets').insertOne(newTicket);
      ticketCreated = true;
      createdTicketId = ticketId;
      createdTicketDbId = ticketDbId;

      logActivity(
        req.user!.id,
        req.user!.email,
        'AI Ticket Creation',
        `AI Agent auto-created Ticket ${ticketId} [Category: ${aiAnalysis.category}, Priority: ${aiAnalysis.priority}]`
      );
    }

    // 4. Create and save AI response message
    const assistantMessage: ChatMessage = {
      id: 'msg_' + crypto.randomUUID(),
      sender: 'assistant',
      text: aiAnalysis.solution,
      timestamp: new Date().toISOString(),
      ticketCreated,
      ticketId: createdTicketId,
    };

    // Update session title dynamically if it's the first message
    const currentMessages = [...session.messages, userMessage, assistantMessage];
    const isFirstActiveExchange = session.messages.length === 0;
    const updatedTitle = isFirstActiveExchange 
      ? (text.length > 30 ? text.substring(0, 30) + '...' : text)
      : session.title;

    db.collection('chats').updateOne(
      s => s.id === sessionId,
      {
        messages: currentMessages,
        title: updatedTitle,
        updatedAt: new Date().toISOString(),
      }
    );

    logActivity(
      req.user!.id,
      req.user!.email,
      'AI Analysis Executed',
      `IT AI Agent completed analysis. Category: ${aiAnalysis.category}. Confidence: ${aiAnalysis.confidence}%. Ticket raised: ${ticketCreated}`
    );

    res.json({
      userMessage,
      assistantMessage,
      analysis: aiAnalysis,
      ticketCreated,
      ticketId: createdTicketId,
      ticketDbId: createdTicketDbId,
    });
  } catch (error) {
    console.error('Process chat message failed:', error);
    res.status(500).json({ message: 'Error processing support chat message.' });
  }
});

// @route   DELETE /api/chats/:id
// @desc    Delete a chat session
router.delete('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id;
    const session = db.collection('chats').findOne(s => s.id === id);

    if (!session) {
      res.status(404).json({ message: 'Chat thread not found.' });
      return;
    }

    if (session.userId !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Permission denied.' });
      return;
    }

    db.collection('chats').deleteOne(s => s.id === id);
    res.json({ message: 'Chat thread deleted successfully.' });
  } catch (error) {
    console.error('Delete chat failed:', error);
    res.status(500).json({ message: 'Error deleting chat thread.' });
  }
});

export default router;
