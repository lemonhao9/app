import jwt from 'jsonwebtoken';
import * as userRepository from '../repositories/userRepository.js';

async function verifyRequest(req, res, next, { allowPasswordChangeRequired }) {
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
    if (isTokenRevoked(user, payload)) {
      return res.status(401).json({ error: 'Session expirée : veuillez vous reconnecter' });
    }
    if (user.must_change_password && !allowPasswordChangeRequired) {
      return res.status(403).json({
        error: 'Vous devez remplacer votre mot de passe provisoire avant de continuer',
        code: 'PASSWORD_CHANGE_REQUIRED',
      });
    }
    req.user = { userId: user.user_id, role: user.role, email: user.email };
    next();
  } catch (err) {
    next(err);
  }
}

export function authenticate(req, res, next) {
  return verifyRequest(req, res, next, { allowPasswordChangeRequired: false });
}

export function authenticateAllowingPasswordChange(req, res, next) {
  return verifyRequest(req, res, next, { allowPasswordChangeRequired: true });
}

export function isTokenRevoked(user, payload) {
  if (user.password_changed_epoch == null) return false;
  if (typeof payload.iat !== 'number') return true;
  return payload.iat < Number(user.password_changed_epoch);
}
