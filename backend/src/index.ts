import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

// Import routes
import adminRoutes from './routes/admin';
import clientRoutes from './routes/client';
import apiRoutes from './routes/api';
import webhookRoutes from './routes/webhooks';
import experimentRoutes from './routes/experiments';
import heatmapRoutes from './routes/heatmaps';
import recordingRoutes from './routes/recordings';
import authRoutes from './routes/auth';
import exportRoutes from './routes/exports';

// Import utilities
import { validateEnv } from './utils/env';
import { requestIdMiddleware } from './middleware/requestId';
import { formatErrorResponse } from './utils/errors';
import { logger } from './utils/logger';

dotenv.config();

// Validate environment variables before starting
try {
  validateEnv();
} catch (error) {
  console.error('❌ Environment validation failed:', (error as Error).message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Request ID tracking (must be first)
app.use(requestIdMiddleware);

// Security middleware - Enterprise configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.exprora.com", "https://*.exprora.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.exprora.com", "https://*.exprora.com"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: false,
}));

// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https' && req.header('x-forwarded-proto') !== undefined) {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Serve static files (SDK)
app.use(express.static('public'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting - endpoint specific
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } }
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } }
});

app.use('/api/', generalLimiter);
app.use('/api/client/signup', strictLimiter);
app.use('/api/client/login', strictLimiter);
app.use('/api/auth/forgot-password', rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many password reset requests' } }
}));
app.use('/api/v1', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/client/experiments', experimentRoutes);
app.use('/api/client/heatmaps', heatmapRoutes);
app.use('/api/client/recordings', recordingRoutes);
app.use('/api/client/exports', exportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/v1', apiRoutes); // SDK API endpoints
app.use('/api/webhooks', webhookRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const requestId = (req as any).requestId;
  
  logger.error('Request error', err, {
    requestId,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || err.status || 500;
  const response = formatErrorResponse(err, requestId);

  res.status(statusCode).json(response);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
  console.log(`🚀 Exprora Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

