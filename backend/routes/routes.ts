import { Router } from 'express';

import { 
  register, 
  login, 
  refresh, 
  logout, 
  logoutAll, 
  verifyUser 
} from '../controllers/auth';
import { refreshAccessTokenHandler } from '../controllers/token'; // ou ./services/token.ts selon où tu l'as mis
import { requireAuth } from '../middleware/auth_middleware';

const router = Router();

// auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, verifyUser);


router.post('/refresh', refreshAccessTokenHandler);

// Tu pourras ajouter tes futures routes de jeu ici !
// exemple: router.get('/leaderboard', getLeaderboard);

export default router;