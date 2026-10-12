import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { login, logout, me, refresh, register } from '../controllers/auth';
import { requireAuth } from '../middleware/auth_middleware';

// Limites par adresse IP, contre le brute force des mots de passe et la création de comptes en masse.
const limit = (max: number, minutes: number) =>
  rateLimit({
    windowMs: minutes * 60 * 1000,
    limit: max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Trop de tentatives, réessayez plus tard.' },
  });

const router = Router();

router.use(limit(300, 15)); // toute l'API
router.get('/health', (_req, res) => {
  res.json({ ok: true });
});
router.post('/register', limit(5, 60), register);
router.post('/login', limit(10, 15), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
