/**
 * Telegram Webhook Routes
 */

import { Router, Request, Response } from 'express';
import { handleTelegramUpdate } from '../services/telegram.service';

const router = Router();

interface TelegramApiResponse {
  ok: boolean;
  result?: any;
  description?: string;
}

/**
 * Telegram webhook endpoint
 * POST /api/telegram/webhook
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const update = req.body;
    
    // Async handle - tez javob qaytarish
    handleTelegramUpdate(update).catch(err => {
      console.error('Telegram update error:', err);
    });
    
    // Telegram 200 OK kutadi
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).send('OK'); // Telegram uchun har doim 200
  }
});

/**
 * Webhook ni o'rnatish (manual)
 * GET /api/telegram/set-webhook?url=https://your-domain.com/api/telegram/webhook
 */
router.get('/set-webhook', async (req: Request, res: Response) => {
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
    
    const data = await response.json() as TelegramApiResponse;
    
    res.json({ success: data.ok, data });
  } catch (error) {
    console.error('Set webhook error:', error);
    res.status(500).json({ success: false, message: 'Failed to set webhook' });
  }
});

/**
 * Webhook holatini tekshirish
 * GET /api/telegram/webhook-info
 */
router.get('/webhook-info', async (req: Request, res: Response) => {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      return res.status(400).json({ success: false, message: 'Bot token not configured' });
    }
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const data = await response.json() as TelegramApiResponse;
    
    res.json({ success: data.ok, data: data.result });
  } catch (error) {
    console.error('Get webhook info error:', error);
    res.status(500).json({ success: false, message: 'Failed to get webhook info' });
  }
});

export default router;
