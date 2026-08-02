import { Router } from 'express';
import { getDashboardHandler } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getDashboardHandler);

export default router;
