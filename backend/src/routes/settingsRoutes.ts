import { Router } from 'express';
import { getSettingsStatus } from '../controllers/settingsController.js';

const router = Router();

router.get('/', getSettingsStatus);

export default router;
