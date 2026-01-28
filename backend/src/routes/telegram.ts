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
 * GET /api/telegram/set-webhook?url=https://your-domain.com/api/telegram/webhook&bot=seller
 */
router.get('/set-webhook', async (req: Request, res: Response) => {
  try {
    const { url, bot } = req.query;
    
    // Qaysi bot uchun webhook o'rnatish
    const botType = (bot as string) || 'seller';
    const botToken = botType === 'customer' 
      ? process.env.TELEGRAM_CUSTOMER_BOT_TOKEN 
      : process.env.TELEGRAM_SELLER_BOT_TOKEN;
    
    if (!botToken) {
      return res.status(400).json({ success: false, message: `${botType} bot token not configured` });
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
    
    res.json({ success: data.ok, data, bot: botType });
  } catch (error) {
    console.error('Set webhook error:', error);
    res.status(500).json({ success: false, message: 'Failed to set webhook' });
  }
});

/**
 * Webhook holatini tekshirish
 * GET /api/telegram/webhook-info?bot=seller
 */
router.get('/webhook-info', async (req: Request, res: Response) => {
  try {
    const { bot } = req.query;
    
    // Qaysi bot uchun webhook tekshirish
    const botType = (bot as string) || 'seller';
    const botToken = botType === 'customer' 
      ? process.env.TELEGRAM_CUSTOMER_BOT_TOKEN 
      : process.env.TELEGRAM_SELLER_BOT_TOKEN;
    
    if (!botToken) {
      return res.status(400).json({ success: false, message: `${botType} bot token not configured` });
    }
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const data = await response.json() as TelegramApiResponse;
    
    res.json({ success: data.ok, data: data.result, bot: botType });
  } catch (error) {
    console.error('Get webhook info error:', error);
    res.status(500).json({ success: false, message: 'Failed to get webhook info' });
  }
});

export default router;
