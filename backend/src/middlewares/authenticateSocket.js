import jwt from 'jsonwebtoken';
import * as userRepository from '../repositories/userRepository.js';
import { isTokenRevoked } from './authenticate.js';

export async function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Token Socket.io manquant'));
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return next(new Error('Token Socket.io invalide ou expiré'));
  }

  try {
    const user = await userRepository.findById(payload.userId);
    if (!user || !user.is_active) {
      return next(new Error('Compte introuvable ou désactivé'));
    }
    if (isTokenRevoked(user, payload)) {
      return next(new Error('Session expirée : veuillez vous reconnecter'));
    }
    if (user.must_change_password) {
      return next(new Error('Changement du mot de passe provisoire requis'));
    }
    socket.data.userId = user.user_id;
    socket.data.role = user.role;
    next();
  } catch {
    next(new Error('Une erreur est survenue'));
  }
}
