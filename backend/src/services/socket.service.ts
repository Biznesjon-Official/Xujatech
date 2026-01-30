/**
 * Socket.IO Service
 * Real-time communication uchun
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

export const initializeSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:5173',
        'http://localhost:5174',
      ],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    // Kassirga qo'shilish
    socket.on('join-cashier', (cashierId: string) => {
      socket.join(`cashier-${cashierId}`);
      console.log(`👤 Cashier ${cashierId} joined room`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Saqlangan chek yuborilganda barcha kassir qurilmalariga xabar yuborish
export const notifySavedReceipt = (cashierId: string, receipt: any) => {
  if (io) {
    io.to(`cashier-${cashierId}`).emit('receipt-saved', receipt);
    console.log(`📤 Receipt saved notification sent to cashier-${cashierId}`);
  }
};

// Chek o'chirilganda xabar yuborish
export const notifyReceiptDeleted = (cashierId: string, receiptId: string) => {
  if (io) {
    io.to(`cashier-${cashierId}`).emit('receipt-deleted', receiptId);
    console.log(`🗑️ Receipt deleted notification sent to cashier-${cashierId}`);
  }
};

// Chek ochilganda xabar yuborish
export const notifyReceiptOpened = (cashierId: string, receiptId: string) => {
  if (io) {
    io.to(`cashier-${cashierId}`).emit('receipt-opened', receiptId);
    console.log(`📂 Receipt opened notification sent to cashier-${cashierId}`);
  }
};
