import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from './config.js';
import authRouter from './routes/auth.js';
import ticketsRouter from './routes/tickets.js';
import chatsRouter from './routes/chats.js';
import logsRouter from './routes/logs.js';
import analyticsRouter from './routes/analytics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Standard express body parsers
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/chats', chatsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/analytics', analyticsRouter);

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve frontend static build in production mode
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(isProd ? (process.env.PORT || 3000) : CONFIG.PORT);

if (isProd) {
  const distPath = path.resolve(process.cwd(), 'dist');
  console.log(`Production environment active. Serving static web files from: ${distPath}`);
  
  app.use(express.static(distPath));
  
  // SPA wildcard route to index.html for React router support
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
} else {
  console.log('Development environment active. Vite dev proxy will route calls to port 3001.');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`AEX AI IT Helpdesk Server running on http://0.0.0.0:${PORT}`);
  console.log(`====================================================`);
});
