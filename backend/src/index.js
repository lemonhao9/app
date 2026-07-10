import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler.js';
import { authenticateSocket } from './middlewares/authenticateSocket.js';
import router from './routes/index.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middlewares globaux
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Rate limiting sur les routes d'auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/v1/auth', authLimiter);

// Routes
app.use('/api/v1', router);

// Health check
app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));

// Middleware de gestion des erreurs
app.use(errorHandler);

// Socket.io — authentification JWT au handshake
io.use(authenticateSocket);

io.on('connection', (socket) => {
  const { userId, role } = socket.data;

  socket.on('join:intervention', ({ intervention_id }) => {
    // TODO : vérifier que l'utilisateur est client ou technicien de cette intervention
    socket.join(`intervention:${intervention_id}`);
  });

  socket.on('message:send', async ({ intervention_id, content, photo_url }) => {
    // TODO : persister en BDD via interventionCommentRepository
    const message = {
      user_id: userId,
      intervention_id,
      content: content || null,
      photo_url: photo_url || null,
      created_at: new Date().toISOString(),
    };
    io.to(`intervention:${intervention_id}`).emit('message:new', message);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`API démarrée sur le port ${PORT}`);
});

export { io };
