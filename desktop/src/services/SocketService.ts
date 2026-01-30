/**
 * Socket.IO Client Service
 * Real-time yangilanishlar uchun
 */

import { io, Socket } from 'socket.io-client';

class SocketService {
    private socket: Socket | null = null;
    private cashierId: string | null = null;

    /**
     * Socket.IO ga ulanish
     */
    connect(cashierId: string) {
        if (this.socket?.connected && this.cashierId === cashierId) {
            console.log('✅ Socket already connected');
            return;
        }

        // Eski ulanishni yopish
        if (this.socket) {
            this.socket.disconnect();
        }

        this.cashierId = cashierId;

        // Yangi ulanish - to'g'ridan-to'g'ri backend portiga
        const serverUrl = 'http://localhost:3006';
        console.log('🔌 Connecting to Socket.IO server:', serverUrl);

        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
            console.log('✅ Socket connected:', this.socket?.id);
            // Kassir xonasiga qo'shilish
            this.socket?.emit('join-cashier', cashierId);
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
        });
    }

    /**
     * Ulanishni uzish
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.cashierId = null;
            console.log('🔌 Socket disconnected manually');
        }
    }

    /**
     * Yangi chek saqlanganda listener
     */
    onReceiptSaved(callback: (receipt: any) => void) {
        if (!this.socket) {
            console.warn('⚠️ Socket not connected');
            return;
        }

        this.socket.on('receipt-saved', (receipt) => {
            console.log('📥 Receipt saved event received:', receipt);
            callback(receipt);
        });
    }

    /**
     * Chek o'chirilganda listener
     */
    onReceiptDeleted(callback: (receiptId: string) => void) {
        if (!this.socket) {
            console.warn('⚠️ Socket not connected');
            return;
        }

        this.socket.on('receipt-deleted', (receiptId) => {
            console.log('🗑️ Receipt deleted event received:', receiptId);
            callback(receiptId);
        });
    }

    /**
     * Chek ochilganda listener
     */
    onReceiptOpened(callback: (receiptId: string) => void) {
        if (!this.socket) {
            console.warn('⚠️ Socket not connected');
            return;
        }

        this.socket.on('receipt-opened', (receiptId) => {
            console.log('📂 Receipt opened event received:', receiptId);
            callback(receiptId);
        });
    }

    /**
     * Barcha listenerlarni tozalash
     */
    removeAllListeners() {
        if (this.socket) {
            this.socket.off('receipt-saved');
            this.socket.off('receipt-deleted');
            this.socket.off('receipt-opened');
        }
    }

    /**
     * Ulanish holatini tekshirish
     */
    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

// Singleton instance
const socketService = new SocketService();

export default socketService;
