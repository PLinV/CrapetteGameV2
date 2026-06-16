import { Router } from 'express';

import { 
  register, 
  login, 
  refresh, 
  logout, 
  logoutAll, 
  verifyUser 
} from '../controllers/auth';
import { refreshAccessTokenHandler } from '../controllers/token';
import { requireAuth } from '../middleware/auth_middleware';

const router = Router();

// auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, verifyUser);


router.post('/refresh', refreshAccessTokenHandler);

export default router;