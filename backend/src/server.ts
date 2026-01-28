import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import { connectDatabase } from './config/database';
import { startScheduler } from './services/scheduler.service';
import { startPolling } from './services/telegram.service';

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

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: 'Server xatosi' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint topilmadi' });
});

// Start server
async function startServer() {
  try {
    await connectDatabase();
    
    // Start notification scheduler
    startScheduler();
    
    // Start Telegram bot polling
    startPolling();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
