"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_service_1 = require("../services/notification.service");
const telegram_service_1 = require("../services/telegram.service");
const NotificationLog_1 = require("../models/NotificationLog");
const router = (0, express_1.Router)();
router.post('/test', async (req, res) => {
    try {
        const message = `🧪 <b>Тестовое сообщение</b>

✅ Telegram бот успешно подключен!
📅 Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}

Уведомления будут приходить автоматически.`;
        const sent = await (0, telegram_service_1.sendBotMessage)(message);
        if (sent) {
            res.json({ success: true, message: 'Тестовое сообщение отправлено' });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Не удалось отправить сообщение. Проверьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID'
            });
        }
    }
    catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ success: false, message: 'Ошибка отправки' });
    }
});
router.post('/run-all', async (req, res) => {
    try {
        await (0, notification_service_1.runAllNotificationChecks)();
        res.json({ success: true, message: 'Все проверки выполнены' });
    }
    catch (error) {
        console.error('Run all notifications error:', error);
        res.status(500).json({ success: false, message: 'Ошибка выполнения проверок' });
    }
});
router.post('/check-debts', async (req, res) => {
    try {
        await (0, notification_service_1.checkDebtsAndNotify)();
        await (0, notification_service_1.checkOverdueDebtsAndNotify)();
        res.json({ success: true, message: 'Проверка долгов выполнена' });
    }
    catch (error) {
        console.error('Check debts error:', error);
        res.status(500).json({ success: false, message: 'Ошибка проверки долгов' });
    }
});
router.post('/check-stock', async (req, res) => {
    try {
        await (0, notification_service_1.checkLowStockAndNotify)();
        res.json({ success: true, message: 'Проверка остатков выполнена' });
    }
    catch (error) {
        console.error('Check stock error:', error);
        res.status(500).json({ success: false, message: 'Ошибка проверки остатков' });
    }
});
router.get('/logs', async (req, res) => {
    try {
        const { type, limit = 50 } = req.query;
        const filter = {};
        if (type)
            filter.type = type;
        const logs = await NotificationLog_1.NotificationLog.find(filter)
            .sort({ sentAt: -1 })
            .limit(Number(limit));
        res.json({ success: true, data: logs });
    }
    catch (error) {
        console.error('Get notification logs error:', error);
        res.status(500).json({ success: false, message: 'Ошибка получения логов' });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalToday, debtToday, stockToday, totalAll] = await Promise.all([
            NotificationLog_1.NotificationLog.countDocuments({ sentAt: { $gte: today } }),
            NotificationLog_1.NotificationLog.countDocuments({ type: 'debt', sentAt: { $gte: today } }),
            NotificationLog_1.NotificationLog.countDocuments({ type: 'low_stock', sentAt: { $gte: today } }),
            NotificationLog_1.NotificationLog.countDocuments(),
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
    }
    catch (error) {
        console.error('Get notification stats error:', error);
        res.status(500).json({ success: false, message: 'Ошибка получения статистики' });
    }
});
router.post('/set-chat-id', async (req, res) => {
    try {
        const { chatId } = req.body;
        if (!chatId) {
            return res.status(400).json({ success: false, message: 'chatId обязателен' });
        }
        res.json({
            success: true,
            message: `Добавьте TELEGRAM_CHAT_ID=${chatId} в файл .env и перезапустите сервер`,
            chatId
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Ошибка' });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map