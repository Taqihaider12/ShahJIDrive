import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import googleDriveRoutes from './routes/googleDrive';
import driveApiRoutes from './routes/driveApi';
import couponsRoutes from './routes/coupons';
import apiKeysRoutes from './routes/apiKeys';
import adminRoutes from './routes/admin';
import aiPdfRoutes from './routes/aiPdf';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust first proxy (needed for rate limiting behind nginx/cloudflare)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Let frontend handle CSP
}));

// Global rate limiter — 200 requests per minute per IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

// CORS — restrict to known origins (add your production domain here)
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:8000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' })); // Support base64 image/file uploads

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/google-drive', googleDriveRoutes);
app.use('/api/drive-api', driveApiRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/api-keys', apiKeysRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai-pdf-content', aiPdfRoutes);

// Base route for health checking
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Server] ShahJI Drive running on http://localhost:${PORT}`);
});
