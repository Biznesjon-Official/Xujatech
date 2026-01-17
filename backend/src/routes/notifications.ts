/**
 * Notifications API Routes
 * Управление уведомлениями и ручной запуск проверок
 */

import { Router, Request, Response } from 'express';
import { 
  runAllNotificationChecks, 
  checkDebtsAndNotify, 
  checkLowStockAndNotify,
  checkOverdueDebtsAndNotify 
} from '../services/notification.service';
import { sendBotMessage } from '../services/telegram.service';
import { NotificationLog } from '../models/NotificationLog';

const router = Router();

/**
 * POST /api/notifications/test
 * Отправить тестовое сообщение в Telegram
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const message = `🧪 <b>Тестовое сообщение</b>

✅ Telegram бот успешно подключен!
📅 Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}

Уведомления будут приходить автоматически.`;

    const sent = await sendBotMessage(message);

    if (sent) {
      res.json({ success: true, message: 'Тестовое сообщение отправлено' });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Не удалось отправить сообщение. Проверьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID' 
      });
    }
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ success: false, message: 'Ошибка отправки' });
  }
});

/**
 * POST /api/notifications/run-all
 * Запустить все проверки вручную
 */
router.post('/run-all', async (req: Request, res: Response) => {
  try {
    await runAllNotificationChecks();
    res.json({ success: true, message: 'Все проверки выполнены' });
  } catch (error) {
    console.error('Run all notifications error:', error);
    res.status(500).json({ success: false, message: 'Ошибка выполнения проверок' });
  }
});

/**
 * POST /api/notifications/check-debts
 * Проверить долги вручную
 */
router.post('/check-debts', async (req: Request, res: Response) => {
  try {
    await checkDebtsAndNotify();
    await checkOverdueDebtsAndNotify();
    res.json({ success: true, message: 'Проверка долгов выполнена' });
  } catch (error) {
    console.error('Check debts error:', error);
    res.status(500).json({ success: false, message: 'Ошибка проверки долгов' });
  }
});

/**
 * POST /api/notifications/check-stock
 * Проверить остатки товаров вручную
 */
router.post('/check-stock', async (req: Request, res: Response) => {
  try {
    await checkLowStockAndNotify();
    res.json({ success: true, message: 'Проверка остатков выполнена' });
  } catch (error) {
    console.error('Check stock error:', error);
    res.status(500).json({ success: false, message: 'Ошибка проверки остатков' });
  }
});

/**
 * GET /api/notifications/logs
 * Получить историю отправленных уведомлений
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { type, limit = 50 } = req.query;
    
    const filter: any = {};
    if (type) filter.type = type;

    const logs = await NotificationLog.find(filter)
      .sort({ sentAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Get notification logs error:', error);
    res.status(500).json({ success: false, message: 'Ошибка получения логов' });
  }
});

/**
 * GET /api/notifications/stats
 * Статистика уведомлений
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalToday, debtToday, stockToday, totalAll] = await Promise.all([
      NotificationLog.countDocuments({ sentAt: { $gte: today } }),
      NotificationLog.countDocuments({ type: 'debt', sentAt: { $gte: today } }),
      NotificationLog.countDocuments({ type: 'low_stock', sentAt: { $gte: today } }),
      NotificationLog.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        today: {
          total: totalToday,
          debts: debtToday,
          lowStock: stockToday,
        },
        allTime: totalAll,
      },
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({ success: false, message: 'Ошибка получения статистики' });
  }
});

/**
 * POST /api/notifications/set-chat-id
 * Установить CHAT_ID (для первоначальной настройки)
 */
router.post('/set-chat-id', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.body;
    
    if (!chatId) {
      return res.status(400).json({ success: false, message: 'chatId обязателен' });
    }

    // В продакшене это должно сохраняться в базу или .env
    // Пока просто возвращаем инструкцию
    res.json({ 
      success: true, 
      message: `Добавьте TELEGRAM_CHAT_ID=${chatId} в файл .env и перезапустите сервер`,
      chatId 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Ошибка' });
  }
});

export default router;
