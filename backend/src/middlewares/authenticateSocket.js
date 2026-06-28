import jwt from 'jsonwebtoken';

export function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Token Socket.io manquant'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.userId = payload.userId;
    socket.data.role = payload.role;
    next();
  } catch {
    next(new Error('Token Socket.io invalide ou expiré'));
  }
}
