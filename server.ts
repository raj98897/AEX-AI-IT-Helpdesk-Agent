import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import authRouter from './server/routes/auth.js';
import ticketsRouter from './server/routes/tickets.js';
import chatsRouter from './server/routes/chats.js';
import logsRouter from './server/routes/logs.js';
import analyticsRouter from './server/routes/analytics.js';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // Standard express body parsers
  app.use(express.json());

  // Health check endpoint for Cloud Run and monitoring
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/tickets', ticketsRouter);
  app.use('/api/chats', chatsRouter);
  app.use('/api/logs', logsRouter);
  app.use('/api/analytics', analyticsRouter);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`AEX AI IT Helpdesk Server running on http://0.0.0.0:${PORT}`);
    console.log(`====================================================`);
  });
}

startServer();
