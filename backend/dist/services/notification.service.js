"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndNotifyDebtors = checkAndNotifyDebtors;
exports.checkDebtsAndNotify = checkDebtsAndNotify;
exports.checkOverdueDebtsAndNotify = checkOverdueDebtsAndNotify;
exports.checkLowStockAndNotify = checkLowStockAndNotify;
exports.runAllNotificationChecks = runAllNotificationChecks;
const models_1 = require("../models");
const NotificationLog_1 = require("../models/NotificationLog");
const telegram_service_1 = require("./telegram.service");
function getTodayRange() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
}
async function wasNotificationSentToday(type, referenceId) {
    const { start, end } = getTodayRange();
    const existing = await NotificationLog_1.NotificationLog.findOne({
        type,
        referenceId,
        sentAt: { $gte: start, $lte: end },
    });
    return !!existing;
}
async function logNotification(type, referenceId, message) {
    await NotificationLog_1.NotificationLog.create({
        type,
        referenceId,
        message,
        sentAt: new Date(),
    });
}
async function checkAndNotifyDebtors() {
    console.log('🔍 Qarzdorlarga eslatma yuborish...');
    try {
        const telegramUsers = await models_1.TelegramUser.find({ isActive: true, customerId: { $exists: true } });
        let sentCount = 0;
        for (const telegramUser of telegramUsers) {
            const customer = await models_1.Customer.findById(telegramUser.customerId);
            if (!customer || customer.currentDebt <= 0 || !customer.debtDueDate) {
                continue;
            }
            const daysLeft = (0, telegram_service_1.getDaysUntil)(customer.debtDueDate);
            if (daysLeft !== 5 && daysLeft !== 1 && daysLeft !== 0 && daysLeft >= 0) {
                continue;
            }
            const notificationType = daysLeft < 0 ? `debt_overdue_${customer._id}` : `debt_${daysLeft}_${customer._id}`;
            const alreadySent = await wasNotificationSentToday(notificationType, customer._id.toString());
            if (alreadySent) {
                continue;
            }
            const sent = await (0, telegram_service_1.sendDebtReminder)(customer._id.toString(), daysLeft);
            if (sent) {
                await logNotification(notificationType, customer._id.toString(), `Eslatma yuborildi: ${daysLeft} kun qoldi`);
                sentCount++;
                console.log(`✅ ${customer.fullName} ga eslatma yuborildi (${daysLeft} kun qoldi)`);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log(`📨 Qarzdorlarga yuborilgan eslatmalar: ${sentCount}`);
    }
    catch (error) {
        console.error('❌ Qarzdorlarga eslatma yuborishda xatolik:', error);
    }
}
async function checkDebtsAndNotify() {
    console.log('🔍 Admin uchun qarzlarni tekshirish...');
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const tomorrowEnd = new Date(tomorrow);
        tomorrowEnd.setHours(23, 59, 59, 999);
        const customersWithDebt = await models_1.Customer.find({
            isActive: true,
            currentDebt: { $gt: 0 },
            debtDueDate: { $gte: tomorrow, $lte: tomorrowEnd },
        });
        console.log(`📋 Ertaga to'lanadigan qarzlar: ${customersWithDebt.length} ta`);
        let sentCount = 0;
        for (const customer of customersWithDebt) {
            const alreadySent = await wasNotificationSentToday('admin_debt', customer._id.toString());
            if (alreadySent)
                continue;
            const message = `⚠️ <b>Qarz eslatmasi</b>

👤 Mijoz: <b>${customer.fullName}</b>
📞 Telefon: ${customer.phone || "ko'rsatilmagan"}
💰 Summa: <b>${(0, telegram_service_1.formatAmount)(customer.currentDebt)} so'm</b>
📅 To'lash sanasi: <b>${(0, telegram_service_1.formatDate)(customer.debtDueDate)}</b>

Iltimos, mijozga to'lov haqida eslatib qo'ying.`;
            const sent = await (0, telegram_service_1.sendBotMessage)(message);
            if (sent) {
                await logNotification('admin_debt', customer._id.toString(), message);
                sentCount++;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log(`📨 Admin ga yuborilgan qarz eslatmalari: ${sentCount}/${customersWithDebt.length}`);
    }
    catch (error) {
        console.error('❌ Qarzlarni tekshirishda xatolik:', error);
    }
}
async function checkOverdueDebtsAndNotify() {
    console.log('🔍 Muddati o\'tgan qarzlarni tekshirish...');
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const overdueDebts = await models_1.Customer.find({
            isActive: true,
            currentDebt: { $gt: 0 },
            debtDueDate: { $lt: today },
        });
        console.log(`⚠️ Muddati o'tgan qarzlar: ${overdueDebts.length} ta`);
        let sentCount = 0;
        for (const customer of overdueDebts) {
            const alreadySent = await wasNotificationSentToday('admin_overdue', customer._id.toString());
            if (alreadySent)
                continue;
            const daysOverdue = Math.abs((0, telegram_service_1.getDaysUntil)(customer.debtDueDate));
            const message = `🚨 <b>MUDDATI O'TGAN QARZ!</b>

👤 Mijoz: <b>${customer.fullName}</b>
📞 Telefon: ${customer.phone || "ko'rsatilmagan"}
💰 Summa: <b>${(0, telegram_service_1.formatAmount)(customer.currentDebt)} so'm</b>
📅 To'lash sanasi: ${(0, telegram_service_1.formatDate)(customer.debtDueDate)}
⏰ O'tgan kunlar: <b>${daysOverdue} kun</b>

Zudlik bilan mijoz bilan bog'laning!`;
            const sent = await (0, telegram_service_1.sendBotMessage)(message);
            if (sent) {
                await logNotification('admin_overdue', customer._id.toString(), message);
                sentCount++;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log(`📨 Muddati o'tgan qarz eslatmalari: ${sentCount}`);
    }
    catch (error) {
        console.error('❌ Muddati o\'tgan qarzlarni tekshirishda xatolik:', error);
    }
}
async function checkLowStockAndNotify() {
    console.log('🔍 Kam qolgan mahsulotlarni tekshirish...');
    try {
        const lowStockProducts = await models_1.Product.find({
            isActive: true,
            currentStock: { $lte: 3 },
        });
        console.log(`📦 Kam qolgan mahsulotlar: ${lowStockProducts.length} ta`);
        let sentCount = 0;
        for (const product of lowStockProducts) {
            const alreadySent = await wasNotificationSentToday('low_stock', product._id.toString());
            if (alreadySent)
                continue;
            const message = `📦 <b>Mahsulot kam qoldi</b>

🏷️ Mahsulot: <b>${product.name}</b>
🔢 Kod: ${product.barcode || '-'}
📊 Qoldi: <b>${product.currentStock} ${product.unit}</b>

Omborni to'ldirishni tavsiya qilamiz.`;
            const sent = await (0, telegram_service_1.sendBotMessage)(message);
            if (sent) {
                await logNotification('low_stock', product._id.toString(), message);
                sentCount++;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log(`📨 Mahsulot eslatmalari: ${sentCount}/${lowStockProducts.length}`);
    }
    catch (error) {
        console.error('❌ Mahsulotlarni tekshirishda xatolik:', error);
    }
}
async function runAllNotificationChecks() {
    console.log('🚀 Barcha tekshiruvlar ishga tushirilmoqda...');
    console.log('━'.repeat(50));
    await checkAndNotifyDebtors();
    console.log('━'.repeat(50));
    await checkDebtsAndNotify();
    console.log('━'.repeat(50));
    await checkOverdueDebtsAndNotify();
    console.log('━'.repeat(50));
    await checkLowStockAndNotify();
    console.log('━'.repeat(50));
    console.log('✅ Barcha tekshiruvlar yakunlandi');
}
//# sourceMappingURL=notification.service.js.map