import { Router } from 'express';
import { authRouter } from './routes/auth.mjs';
import { licenseRouter } from './routes/license.mjs';
import { renderRouter } from './routes/render.mjs';
import { aiRouter } from './routes/ai.mjs';
import { emailRouter } from './routes/email.mjs';
import { paymentsRouter } from './routes/payments.mjs';
import { uploadsRouter } from './routes/uploads.mjs';

export const router = Router();

router.use('/auth', authRouter);
router.use('/license', licenseRouter);
router.use('/render', renderRouter);
router.use('/uploads', uploadsRouter);
router.use('/ai', aiRouter);
router.use('/email', emailRouter);
router.use('/payments', paymentsRouter);
