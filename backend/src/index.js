import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler.js';
import { authenticateSocket } from './middlewares/authenticateSocket.js';
import router from './routes/index.js';
import path from 'node:path';
import * as interventionService from './services/interventionService.js';

const app = express();
const httpServer = createServer(app);

app.set('trust proxy', 1);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/v1/auth', authLimiter);

app.use('/api/v1', router);

app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(errorHandler);

io.use(authenticateSocket);

io.on('connection', (socket) => {
  const { userId, role } = socket.data;

  socket.on('join:intervention', async ({ intervention_id }) => {
    try {
      const allowed = await interventionService.canAccessIntervention(userId, role, intervention_id);
      if (!allowed) return socket.emit('error', { message: 'Accès refusé à cette intervention' });
      socket.join(`intervention:${intervention_id}`);
    } catch {
      socket.emit('error', { message: 'Une erreur est survenue' });
    }
  });

  socket.on('message:send', async ({ intervention_id, content, photo_url }) => {
    try {
      const allowed = await interventionService.canAccessIntervention(userId, role, intervention_id);
      if (!allowed) return socket.emit('error', { message: 'Accès refusé à cette intervention' });
      const message = {
        user_id: userId,
        intervention_id,
        content: content || null,
        photo_url: photo_url || null,
        created_at: new Date().toISOString(),
      };
      io.to(`intervention:${intervention_id}`).emit('message:new', message);
    } catch {
      socket.emit('error', { message: 'Une erreur est survenue' });
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`API démarrée sur le port ${PORT}`);
});

export { io };
