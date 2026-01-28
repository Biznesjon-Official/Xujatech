/**
 * Kutayotgan cheklar monitori
 * Noutbuk uchun - telefondan kelgan cheklar real-time kuzatiladi
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bell, FileText, X, Check, Printer, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import ReceiptModal from './ReceiptModal';

interface ReceiptItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
}

interface PendingReceipt {
  _id: string;
  cashierName: string;
  items: ReceiptItem[];
  total: number;
  createdAt: string;
  source: string;
}

interface Props {
  onReceiptClick?: (receiptId: string) => void;
  pollingInterval?: number; // milliseconds
}

const PendingReceiptsMonitor: React.FC<Props> = ({ 
  onReceiptClick,
  pollingInterval = 3000 // 3 soniya
}) => {
  const [pendingReceipts, setPendingReceipts] = useState<PendingReceipt[]>([]);
  const [showNotifications, setShowNotifications] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const previousCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Polling - har 3 soniyada yangi cheklar tekshiriladi
  useEffect(() => {
    const fetchPendingReceipts = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/receipts/pending', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const receipts = data.data || [];
          
          // Yangi cheklar borligini tekshirish
          if (receipts.length > previousCountRef.current) {
            const newReceiptsCount = receipts.length - previousCountRef.current;
            showNewReceiptNotification(newReceiptsCount, receipts[0]);
          }

          previousCountRef.current = receipts.length;
          setPendingReceipts(receipts);
          setLastCheckTime(new Date());
        }
      } catch (error) {
        console.error('Cheklar yuklash xatosi:', error);
      }
    };

    // Dastlabki yuklash
    fetchPendingReceipts();

    // Polling interval
    const interval = setInterval(fetchPendingReceipts, pollingInterval);

    return () => clearInterval(interval);
  }, [pollingInterval]);

  // Browser notification
  const showNewReceiptNotification = (count: number, receipt: PendingReceipt) => {
    // Audio alert
    playNotificationSound();

    // Toast notification
    toast.success(
      `${count} ta yangi chek keldi!\n${receipt.cashierName} - ${receipt.total.toLocaleString()} so'm`,
      {
        duration: 5000,
        icon: '🔔',
      }
    );

    // Browser notification (agar ruxsat berilgan bo'lsa)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Yangi chek keldi!', {
        body: `${receipt.cashierName} - ${receipt.total.toLocaleString()} so'm`,
        icon: '/icons/icon-192x192.svg',
        tag: receipt._id,
        requireInteraction: true,
      });
    }
  };

  // Notification sound
  const playNotificationSound = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/notification.mp3');
    }
    audioRef.current.play().catch(err => console.log('Audio play error:', err));
  };

  // Browser notification ruxsatini so'rash
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Chekni ochish
  const handleOpenReceipt = (receiptId: string) => {
    setSelectedReceiptId(receiptId);
    if (onReceiptClick) {
      onReceiptClick(receiptId);
    }
  };

  // Modal yopilganda
  const handleCloseModal = () => {
    setSelectedReceiptId(null);
  };

  // To'lov tugaganda
  const handleComplete = () => {
    // Chekni ro'yxatdan olib tashlash
    setPendingReceipts(prev => prev.filter(r => r._id !== selectedReceiptId));
    previousCountRef.current = Math.max(0, previousCountRef.current - 1);
  };

  if (!showNotifications || pendingReceipts.length === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed top-20 right-4 z-50 w-96 max-h-[80vh] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 animate-bounce" />
          <span className="font-semibold">
            Yangi cheklar ({pendingReceipts.length})
          </span>
        </div>
        <button
          onClick={() => setShowNotifications(false)}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Receipts List */}
      <div className="bg-white rounded-b-2xl shadow-2xl max-h-[70vh] overflow-y-auto">
        {pendingReceipts.map((receipt) => (
          <div
            key={receipt._id}
            className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-gray-900">
                    {receipt.cashierName}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(receipt.createdAt).toLocaleTimeString('uz-UZ', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-600">
                  {receipt.total.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">so'm</p>
              </div>
            </div>

            {/* Items preview */}
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">
                {receipt.items.length} ta mahsulot
              </p>
              <div className="text-xs text-gray-600 line-clamp-2">
                {receipt.items.slice(0, 2).map((item, idx) => (
                  <span key={idx}>
                    {item.name} ({item.quantity})
                    {idx < Math.min(receipt.items.length, 2) - 1 && ', '}
                  </span>
                ))}
                {receipt.items.length > 2 && '...'}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleOpenReceipt(receipt._id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                Ochish
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Last check time */}
      <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 text-center rounded-b-2xl">
        Oxirgi tekshiruv: {lastCheckTime.toLocaleTimeString('uz-UZ')}
      </div>
    </div>

    {/* Receipt Modal */}
    {selectedReceiptId && (
      <ReceiptModal
        receiptId={selectedReceiptId}
        onClose={handleCloseModal}
        onComplete={handleComplete}
      />
    )}
  </>
  );
};

export default PendingReceiptsMonitor;
