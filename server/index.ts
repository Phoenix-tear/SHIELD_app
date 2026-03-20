import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import policyRoutes from './routes/policy';
import claimsRoutes from './routes/claims';
import walletRoutes from './routes/wallet';
import notificationsRoutes from './routes/notifications';
import earningsRoutes from './routes/earnings';
import disruptionsRoutes from './routes/disruptions';
import payoutsRoutes from './routes/payouts';

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/policy', policyRoutes);
app.use('/api/v1/claims', claimsRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/earnings', earningsRoutes);
app.use('/api/v1/disruptions', disruptionsRoutes);
app.use('/api/v1/payouts', payoutsRoutes);

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🛡️  SHIELD server running on http://localhost:${PORT}`);
});

export default app;
