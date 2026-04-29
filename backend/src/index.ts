import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

dotenv.config();

export const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
});
app.use('/api', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/// Import routes
import authRoutes from './routes/auth.routes';
import houseRoutes from './routes/house.routes';
import tenantRoutes from './routes/tenant.routes';
import paymentRoutes from './routes/payment.routes';
import complaintRoutes from './routes/complaint.routes';
import noticeRoutes from './routes/notice.routes';
import reportRoutes from './routes/report.routes';

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/houses', houseRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});