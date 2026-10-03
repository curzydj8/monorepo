import { Router } from 'express';
import { loginSchema, registerSchema } from '@monorepo/shared';
import { login, me, register } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', requireAuth, me);

export default router;
