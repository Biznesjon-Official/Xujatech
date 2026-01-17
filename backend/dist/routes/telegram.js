"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const telegram_service_1 = require("../services/telegram.service");
const router = (0, express_1.Router)();
router.post('/webhook', async (req, res) => {
    try {
        const update = req.body;
        (0, telegram_service_1.handleTelegramUpdate)(update).catch(err => {
            console.error('Telegram update error:', err);
        });
        res.status(200).send('OK');
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(200).send('OK');
    }
});
router.get('/set-webhook', async (req, res) => {
    try {
        const { url } = req.query;
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            return res.status(400).json({ success: false, message: 'Bot token not configured' });
        }
        if (!url) {
            return res.status(400).json({ success: false, message: 'URL required' });
        }
        const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });
        const data = await response.json();
        res.json({ success: data.ok, data });
    }
    catch (error) {
        console.error('Set webhook error:', error);
        res.status(500).json({ success: false, message: 'Failed to set webhook' });
    }
});
router.get('/webhook-info', async (req, res) => {
    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            return res.status(400).json({ success: false, message: 'Bot token not configured' });
        }
        const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
        const data = await response.json();
        res.json({ success: data.ok, data: data.result });
    }
    catch (error) {
        console.error('Get webhook info error:', error);
        res.status(500).json({ success: false, message: 'Failed to get webhook info' });
    }
});
exports.default = router;
//# sourceMappingURL=telegram.js.map