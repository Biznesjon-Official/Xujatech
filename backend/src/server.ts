import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import helmet from 'helmet';
import compression from 'compression';

// Load environment variables FIRST
dotenv.config();

import { connectDatabase } from './config/database';
import { startScheduler } from './services/scheduler.service';
import { startPolling } from './services/telegram.service';
import { initializeSocket } from './services/socket.service';

// Import routes
import authRoutes from './routes/auth';
import productsRoutes from './routes/products';
import categoriesRoutes from './routes/categories';
import customersRoutes from './routes/customers';
import salesRoutes from './routes/sales';
import suppliersRoutes from './routes/suppliers';
import usersRoutes from './routes/users';
import reportsRoutes from './routes/reports';
import inventoryRoutes from './routes/inventory';
import settingsRoutes from './routes/settings';
import branchesRoutes from './routes/branches';
import receiptsRoutes from './routes/receipts';
import notificationsRoutes from './routes/notifications';
import telegramRoutes from './routes/telegram';
import deliveriesRoutes from './routes/deliveries';
import warehousesRoutes from './routes/warehouses';
import myDebtsRoutes from './routes/myDebts';
import returnsRoutes from './routes/returns';

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false,
}));

// Compression middleware
app.use(compression());

// CORS middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (development only)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/receipts', receiptsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/warehouses', warehousesRoutes);
app.use('/api/my-debts', myDebtsRoutes);
app.use('/api/returns', returnsRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err);
  
  // Don't leak error details in production
  const message = NODE_ENV === 'production' 
    ? 'Server xatosi' 
    : err.message || 'Server xatosi';
  
  res.status(err.status || 500).json({ 
    success: false, 
    message,
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint topilmadi',
    path: req.path 
  });
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Create HTTP server
    const httpServer = createServer(app);
    
    // Initialize Socket.IO
    initializeSocket(httpServer);
    console.log('✅ Socket.IO initialized');
    
    // Start notification scheduler
    startScheduler();
    console.log('✅ Scheduler started');
    
    // Start Telegram bot polling
    startPolling();
    console.log('✅ Telegram bot started');
    
    // Start listening
    httpServer.listen(PORT, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`🔌 Socket.IO ready for connections`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      httpServer.close(() => {
        console.log('HTTP server closed');
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
