/**
 * Notification Service
 * Qarzlar va mahsulot qoldiqlarini tekshirish, bildirishnomalar yuborish
 */

import { Customer, Product, TelegramUser } from '../models';
import { NotificationLog } from '../models/NotificationLog';
import { sendBotMessage, sendDebtReminder, formatAmount, formatDate, getDaysUntil } from './telegram.service';

/**
 * Bugungi kunning boshi va oxirini olish
 */
function getTodayRange(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Bugun bildirishnoma yuborilganligini tekshirish
 */
async function wasNotificationSentToday(
  type: string,
  referenceId: string
): Promise<boolean> {
  const { start, end } = getTodayRange();
  
  const existing = await NotificationLog.findOne({
    type,
    referenceId,
    sentAt: { $gte: start, $lte: end },
  });
  
  return !!existing;
}

/**
 * Yuborilgan bildirishnoma logini saqlash
 */
async function logNotification(
  type: string,
  referenceId: string,
  message: string
): Promise<void> {
  await NotificationLog.create({
    type,
    referenceId,
    message,
    sentAt: new Date(),
  });
}

/**
 * Qarzdorlarga eslatma yuborish (5 kun, 1 kun, bugun, muddati o'tgan)
 */
export async function checkAndNotifyDebtors(): Promise<void> {
  console.log('🔍 Qarzdorlarga eslatma yuborish...');
  
  try {
    // Qarzli va telegram bilan bog'langan mijozlarni topish
    const telegramUsers = await TelegramUser.find({ isActive: true, customerId: { $exists: true } }).maxTimeMS(5000);
    
    let sentCount = 0;

    for (const telegramUser of telegramUsers) {
      const customer = await Customer.findById(telegramUser.customerId).maxTimeMS(5000);
      
      if (!customer || customer.currentDebt <= 0 || !customer.debtDueDate) {
        continue;
      }

      const daysLeft = getDaysUntil(customer.debtDueDate);
      
      // Faqat 5 kun, 1 kun, 0 kun (bugun) va muddati o'tgan holatlar uchun
      if (daysLeft !== 5 && daysLeft !== 1 && daysLeft !== 0 && daysLeft >= 0) {
        continue;
      }

      // Muddati o'tgan bo'lsa, har kuni eslatish
      const notificationType = daysLeft < 0 ? `debt_overdue_${customer._id}` : `debt_${daysLeft}_${customer._id}`;
      
      const alreadySent = await wasNotificationSentToday(notificationType, customer._id.toString());
      
      if (alreadySent) {
        continue;
      }

      const sent = await sendDebtReminder(customer._id.toString(), daysLeft);
      
      if (sent) {
        await logNotification(notificationType, customer._id.toString(), `Eslatma yuborildi: ${daysLeft} kun qoldi`);
        sentCount++;
        console.log(`✅ ${customer.fullName} ga eslatma yuborildi (${daysLeft} kun qoldi)`);
      }

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📨 Qarzdorlarga yuborilgan eslatmalar: ${sentCount}`);
  } catch (error) {
    console.error('❌ Qarzdorlarga eslatma yuborishda xatolik:', error);
  }
}

/**
 * Admin uchun qarz eslatmalari (ertaga to'lanadigan)
 */
export async function checkDebtsAndNotify(): Promise<void> {
  console.log('🔍 Admin uchun qarzlarni tekshirish...');
  
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const customersWithDebt = await Customer.find({
      isActive: true,
      currentDebt: { $gt: 0 },
      debtDueDate: { $gte: tomorrow, $lte: tomorrowEnd },
    }).maxTimeMS(5000);

    console.log(`📋 Ertaga to'lanadigan qarzlar: ${customersWithDebt.length} ta`);

    let sentCount = 0;

    for (const customer of customersWithDebt) {
      const alreadySent = await wasNotificationSentToday('admin_debt', customer._id.toString());
      
      if (alreadySent) continue;

      const message = `⚠️ <b>Qarz eslatmasi</b>

👤 Mijoz: <b>${customer.fullName}</b>
📞 Telefon: ${customer.phone || "ko'rsatilmagan"}
💰 Summa: <b>${formatAmount(customer.currentDebt)} so'm</b>
📅 To'lash sanasi: <b>${formatDate(customer.debtDueDate!)}</b>

Iltimos, mijozga to'lov haqida eslatib qo'ying.`;

      const sent = await sendBotMessage(message);
      
      if (sent) {
        await logNotification('admin_debt', customer._id.toString(), message);
        sentCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📨 Admin ga yuborilgan qarz eslatmalari: ${sentCount}/${customersWithDebt.length}`);
  } catch (error) {
    console.error('❌ Qarzlarni tekshirishda xatolik:', error);
  }
}

/**
 * Muddati o'tgan qarzlar haqida admin ga xabar
 */
export async function checkOverdueDebtsAndNotify(): Promise<void> {
  console.log('🔍 Muddati o\'tgan qarzlarni tekshirish...');
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueDebts = await Customer.find({
      isActive: true,
      currentDebt: { $gt: 0 },
      debtDueDate: { $lt: today },
    }).maxTimeMS(5000);

    console.log(`⚠️ Muddati o'tgan qarzlar: ${overdueDebts.length} ta`);

    let sentCount = 0;

    for (const customer of overdueDebts) {
      const alreadySent = await wasNotificationSentToday('admin_overdue', customer._id.toString());
      
      if (alreadySent) continue;

      const daysOverdue = Math.abs(getDaysUntil(customer.debtDueDate!));

      const message = `🚨 <b>MUDDATI O'TGAN QARZ!</b>

👤 Mijoz: <b>${customer.fullName}</b>
📞 Telefon: ${customer.phone || "ko'rsatilmagan"}
💰 Summa: <b>${formatAmount(customer.currentDebt)} so'm</b>
📅 To'lash sanasi: ${formatDate(customer.debtDueDate!)}
⏰ O'tgan kunlar: <b>${daysOverdue} kun</b>

Zudlik bilan mijoz bilan bog'laning!`;

      const sent = await sendBotMessage(message);
      
      if (sent) {
        await logNotification('admin_overdue', customer._id.toString(), message);
        sentCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📨 Muddati o'tgan qarz eslatmalari: ${sentCount}`);
  } catch (error) {
    console.error('❌ Muddati o\'tgan qarzlarni tekshirishda xatolik:', error);
  }
}

/**
 * Mahsulot qoldiqlarini tekshirish
 */
export async function checkLowStockAndNotify(): Promise<void> {
  console.log('🔍 Kam qolgan mahsulotlarni tekshirish...');
  
  try {
    // Kam qolgan mahsulotlar (3 dona yoki undan kam)
    const lowStockProducts = await Product.find({
      isActive: true,
      currentStock: { $lte: 3 }, // Bu yerda chegarani o'zgartirish mumkin
    });

    console.log(`📦 Kam qolgan mahsulotlar: ${lowStockProducts.length} ta`);

    let sentCount = 0;

    for (const product of lowStockProducts) {
      const alreadySent = await wasNotificationSentToday('low_stock', product._id.toString());
      
      if (alreadySent) continue;

      const message = `📦 <b>Mahsulot kam qoldi</b>

🏷️ Mahsulot: <b>${product.name}</b>
🔢 Kod: ${product.barcode || '-'}
📊 Qoldi: <b>${product.currentStock} ${product.unit}</b>

Omborni to'ldirishni tavsiya qilamiz.`;

      const sent = await sendBotMessage(message);
      
      if (sent) {
        await logNotification('low_stock', product._id.toString(), message);
        sentCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📨 Mahsulot eslatmalari: ${sentCount}/${lowStockProducts.length}`);
  } catch (error) {
    console.error('❌ Mahsulotlarni tekshirishda xatolik:', error);
  }
}

/**
 * Barcha tekshiruvlarni ishga tushirish
 */
export async function runAllNotificationChecks(): Promise<void> {
  console.log('🚀 Barcha tekshiruvlar ishga tushirilmoqda...');
  console.log('━'.repeat(50));
  
  // Qarzdorlarga eslatma (5 kun, 1 kun, bugun)
  await checkAndNotifyDebtors();
  console.log('━'.repeat(50));
  
  // Admin uchun ertaga to'lanadigan qarzlar
  await checkDebtsAndNotify();
  console.log('━'.repeat(50));
  
  // Admin uchun muddati o'tgan qarzlar
  await checkOverdueDebtsAndNotify();
  console.log('━'.repeat(50));
  
  // Kam qolgan mahsulotlar
  await checkLowStockAndNotify();
  console.log('━'.repeat(50));
  
  console.log('✅ Barcha tekshiruvlar yakunlandi');
}
