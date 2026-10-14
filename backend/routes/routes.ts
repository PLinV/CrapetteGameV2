import express, { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
  createPasswordReset, login, logout, me, refresh, register, resetPassword,
} from '../controllers/auth';
import { leaderboard, stats } from '../controllers/stats';
import { forAnna } from '../controllers/forAnna';
import {
  changePassword, changeUsername, getAvatar, removeAvatar, uploadAvatar,
} from '../controllers/account';
import { requireAdmin, requireAuth } from '../middleware/auth_middleware';
import { IS_PROD } from '../config';

// Limites par adresse IP, contre le brute force des mots de passe et la création de comptes en masse.
// Désactivées en dev : tout passe par le proxy Vite, donc tous les essais comptent pour la même IP.
const limit = (max: number, minutes: number) =>
  rateLimit({
    skip: () => !IS_PROD,
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
router.get('/stats', requireAuth, stats);
router.get('/leaderboard', requireAuth, leaderboard);
router.get('/pour-toi', requireAuth, forAnna);

// Paramètres du compte
router.patch('/me/username', requireAuth, limit(10, 60), changeUsername);
router.patch('/me/password', requireAuth, limit(10, 15), changePassword);
// Le navigateur envoie une image déjà réduite (256 px, quelques dizaines de Ko).
router.put('/me/avatar', requireAuth, limit(30, 60),
  express.raw({ type: ['image/png', 'image/jpeg', 'image/webp'], limit: '300kb' }), uploadAvatar);
router.delete('/me/avatar', requireAuth, removeAvatar);
router.get('/avatars/:username', getAvatar);
router.post('/reset-password', limit(10, 15), resetPassword);
router.post('/admin/password-reset', requireAuth, requireAdmin, createPasswordReset);

export default router;
