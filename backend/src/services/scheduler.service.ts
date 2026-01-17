/**
 * Scheduler Service
 * node-cron yordamida vazifalar rejalashtiruvchisi
 */

import cron from 'node-cron';
import { runAllNotificationChecks } from './notification.service';

let isSchedulerRunning = false;

/**
 * Vazifalar rejalashtiruvchisini ishga tushirish
 */
export function startScheduler(): void {
  if (isSchedulerRunning) {
    console.log('⚠️ Rejalashtiruvchi allaqachon ishlayapti');
    return;
  }

  console.log('🕐 Bildirishnomalar rejalashtiruvchisi ishga tushirilmoqda...');

  // Har daqiqada tekshirish
  cron.schedule('* * * * *', async () => {
    console.log('⏰ Bildirishnomalarni tekshirish...');
    await runAllNotificationChecks();
  }, {
    timezone: 'Asia/Tashkent'
  });

  isSchedulerRunning = true;
  console.log('✅ Rejalashtiruvchi ishga tushdi - har daqiqada tekshiriladi');
}

/**
 * Rejalashtiruvchini to'xtatish (testlar uchun)
 */
export function stopScheduler(): void {
  isSchedulerRunning = false;
  console.log('🛑 Rejalashtiruvchi to\'xtatildi');
}

/**
 * Rejalashtiruvchi holatini tekshirish
 */
export function isSchedulerActive(): boolean {
  return isSchedulerRunning;
}
