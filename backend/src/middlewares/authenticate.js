import jwt from 'jsonwebtoken';
import * as userRepository from '../repositories/userRepository.js';

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const token = header.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }

  try {
    const user = await userRepository.findById(payload.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Compte introuvable ou désactivé' });
    }
    req.user = { userId: user.user_id, role: user.role, email: user.email };
    next();
  } catch (err) {
    next(err);
  }
}
