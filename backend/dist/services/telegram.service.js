"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBotMessage = void 0;
exports.sendSellerBotMessage = sendSellerBotMessage;
exports.sendCustomerBotMessage = sendCustomerBotMessage;
exports.sendDebtReminder = sendDebtReminder;
exports.startPolling = startPolling;
exports.stopPolling = stopPolling;
exports.getDaysUntil = getDaysUntil;
exports.formatAmount = formatAmount;
exports.formatDate = formatDate;
exports.handleTelegramUpdate = handleTelegramUpdate;
const models_1 = require("../models");
const SELLER_BOT_TOKEN = process.env.TELEGRAM_SELLER_BOT_TOKEN || '';
const CUSTOMER_BOT_TOKEN = process.env.TELEGRAM_CUSTOMER_BOT_TOKEN || '';
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
let adminChatError = false;
const blockedUsers = new Set();
async function sendMessage(botToken, chatId, text, replyMarkup) {
    if (!botToken)
        return false;
    if (blockedUsers.has(chatId))
        return false;
    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const body = {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML',
        };
        if (replyMarkup) {
            body.reply_markup = replyMarkup;
        }
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = (await response.json());
        if (data.ok) {
            return true;
        }
        else {
            if (data.description?.includes('chat not found') || data.description?.includes('bot was blocked')) {
                blockedUsers.add(chatId);
            }
            return false;
        }
    }
    catch (error) {
        console.error('❌ Failed to send Telegram message:', error);
        return false;
    }
}
async function sendSellerBotMessage(text) {
    if (!ADMIN_CHAT_ID || adminChatError || !SELLER_BOT_TOKEN) {
        return false;
    }
    const result = await sendMessage(SELLER_BOT_TOKEN, ADMIN_CHAT_ID, text);
    if (!result) {
        adminChatError = true;
        console.log('⚠️ Admin chat error. Seller bot notifications disabled.');
    }
    return result;
}
exports.sendBotMessage = sendSellerBotMessage;
function getPhoneRequestKeyboard() {
    return {
        keyboard: [
            [
                {
                    text: '📱 Telefon raqamni yuborish',
                    request_contact: true,
                },
            ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
    };
}
function removeKeyboard() {
    return {
        remove_keyboard: true,
    };
}
async function sendCustomerBotMessage(chatId, text, replyMarkup) {
    return sendMessage(CUSTOMER_BOT_TOKEN, chatId, text, replyMarkup);
}
async function registerCustomer(telegramId, phone, firstName, lastName, username) {
    try {
        let formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.startsWith('998')) {
            formattedPhone = '+' + formattedPhone;
        }
        else if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+998' + formattedPhone;
        }
        let telegramUser = await models_1.TelegramUser.findOne({ telegramId });
        if (telegramUser) {
            telegramUser.phone = formattedPhone;
            telegramUser.firstName = firstName;
            telegramUser.lastName = lastName;
            telegramUser.username = username;
            telegramUser.isActive = true;
            await telegramUser.save();
        }
        else {
            telegramUser = await models_1.TelegramUser.create({
                telegramId,
                phone: formattedPhone,
                firstName,
                lastName,
                username,
                isActive: true,
            });
        }
        const phoneDigits = formattedPhone.replace(/\D/g, '');
        const customer = await models_1.Customer.findOne({
            $or: [
                { phone: formattedPhone },
                { phone: phoneDigits },
                { phone: { $regex: phoneDigits.slice(-9), $options: 'i' } },
            ],
            isActive: true,
        });
        if (customer) {
            telegramUser.customerId = customer._id;
            await telegramUser.save();
            if (customer.currentDebt > 0) {
                let message = `✅ Ro'yxatdan o'tdingiz!\n\n💰 Sizning joriy qarzingiz: <b>${formatAmount(customer.currentDebt)} so'm</b>`;
                if (customer.debtDueDate) {
                    const daysLeft = getDaysUntil(customer.debtDueDate);
                    message += `\n📅 To'lash sanasi: <b>${formatDate(customer.debtDueDate)}</b>`;
                    if (daysLeft < 0) {
                        message += `\n⚠️ <b>Muddat ${Math.abs(daysLeft)} kun oldin o'tgan!</b>`;
                    }
                    else if (daysLeft === 0) {
                        message += `\n⚠️ <b>Bugun to'lash kerak!</b>`;
                    }
                    else {
                        message += `\n⏰ Qolgan vaqt: <b>${daysLeft} kun</b>`;
                    }
                }
                message += `\n\nQarz to'lash muddati yaqinlashganda sizga eslatma yuboramiz.`;
                return { success: true, message, debt: customer.currentDebt };
            }
            else {
                return {
                    success: true,
                    message: `✅ Ro'yxatdan o'tdingiz!\n\n🎉 Sizda hozircha qarz yo'q.\n\nQarz paydo bo'lganda sizga xabar beramiz.`,
                    debt: 0,
                };
            }
        }
        else {
            return {
                success: true,
                message: `✅ Ro'yxatdan o'tdingiz!\n\nSizning telefon raqamingiz tizimda topilmadi. Agar sizda qarz bo'lsa, do'kon bilan bog'laning.`,
            };
        }
    }
    catch (error) {
        console.error('❌ Register customer error:', error);
        return {
            success: false,
            message: "❌ Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
        };
    }
}
async function checkCustomerDebt(telegramId) {
    try {
        const telegramUser = await models_1.TelegramUser.findOne({ telegramId, isActive: true });
        if (!telegramUser) {
            return "⚠️ Siz hali ro'yxatdan o'tmagansiz.\n\n/start buyrug'ini yuboring va telefon raqamingizni ulashing.";
        }
        if (!telegramUser.customerId) {
            return "⚠️ Sizning telefon raqamingiz tizimda topilmadi.\n\nAgar sizda qarz bo'lsa, do'kon bilan bog'laning.";
        }
        const customer = await models_1.Customer.findById(telegramUser.customerId);
        if (!customer) {
            return "⚠️ Ma'lumotlar topilmadi.";
        }
        if (customer.currentDebt > 0) {
            let message = `💰 <b>Sizning qarzingiz</b>\n\n`;
            message += `📊 Summa: <b>${formatAmount(customer.currentDebt)} so'm</b>\n`;
            if (customer.debtDueDate) {
                const daysLeft = getDaysUntil(customer.debtDueDate);
                message += `📅 To'lash sanasi: <b>${formatDate(customer.debtDueDate)}</b>\n`;
                if (daysLeft < 0) {
                    message += `⚠️ <b>Muddat ${Math.abs(daysLeft)} kun oldin o'tgan!</b>`;
                }
                else if (daysLeft === 0) {
                    message += `⚠️ <b>Bugun to'lash kerak!</b>`;
                }
                else {
                    message += `⏰ Qolgan vaqt: <b>${daysLeft} kun</b>`;
                }
            }
            return message;
        }
        else {
            return "🎉 Sizda hozircha qarz yo'q!";
        }
    }
    catch (error) {
        console.error('❌ Check debt error:', error);
        return '❌ Xatolik yuz berdi.';
    }
}
async function handleCustomerBotUpdate(update) {
    if (!update.message)
        return;
    const { message } = update;
    const chatId = message.chat.id;
    const telegramId = message.from.id;
    const text = message.text;
    const contact = message.contact;
    if (contact) {
        const result = await registerCustomer(telegramId, contact.phone_number, contact.first_name, contact.last_name, message.from.username);
        await sendCustomerBotMessage(chatId, result.message, removeKeyboard());
        return;
    }
    if (text) {
        const command = text.toLowerCase().trim();
        if (command === '/start') {
            const welcomeMessage = `👋 <b>Assalomu alaykum!</b>

Bu bot orqali siz o'z qarzlaringizni kuzatib borishingiz mumkin.

📱 Ro'yxatdan o'tish uchun telefon raqamingizni yuboring:`;
            await sendCustomerBotMessage(chatId, welcomeMessage, getPhoneRequestKeyboard());
            return;
        }
        if (command === '/qarz' || command === '/debt' || command === '/check') {
            const debtInfo = await checkCustomerDebt(telegramId);
            await sendCustomerBotMessage(chatId, debtInfo);
            return;
        }
        if (command === '/help' || command === '/yordam') {
            const helpMessage = `📋 <b>Buyruqlar ro'yxati:</b>

/start - Ro'yxatdan o'tish
/qarz - Qarzni tekshirish
/help - Yordam

❓ Savollar bo'lsa, do'kon bilan bog'laning.`;
            await sendCustomerBotMessage(chatId, helpMessage);
            return;
        }
        await sendCustomerBotMessage(chatId, "❓ Noma'lum buyruq.\n\n/help - barcha buyruqlar ro'yxati");
    }
}
async function sendDebtReminder(customerId, daysLeft) {
    try {
        const customer = await models_1.Customer.findById(customerId);
        if (!customer || customer.currentDebt <= 0)
            return false;
        const telegramUser = await models_1.TelegramUser.findOne({
            customerId: customer._id,
            isActive: true,
        });
        if (!telegramUser)
            return false;
        let message = '';
        if (daysLeft === 5) {
            message = `⏰ <b>Qarz eslatmasi</b>

Hurmatli ${customer.fullName}!

Sizning qarzingiz to'lash muddatiga <b>5 kun</b> qoldi.

💰 Qarz summasi: <b>${formatAmount(customer.currentDebt)} so'm</b>
📅 To'lash sanasi: <b>${formatDate(customer.debtDueDate)}</b>

Iltimos, o'z vaqtida to'lashni unutmang! 🙏`;
        }
        else if (daysLeft === 1) {
            message = `⚠️ <b>MUHIM ESLATMA!</b>

Hurmatli ${customer.fullName}!

Sizning qarzingiz to'lash muddatiga <b>1 kun</b> qoldi!

💰 Qarz summasi: <b>${formatAmount(customer.currentDebt)} so'm</b>
📅 To'lash sanasi: <b>ERTAGA!</b>

Iltimos, qarzni o'z vaqtida to'lang! 🙏`;
        }
        else if (daysLeft === 0) {
            message = `🚨 <b>BUGUN TO'LASH KERAK!</b>

Hurmatli ${customer.fullName}!

Sizning qarzingiz to'lash muddati <b>BUGUN</b>!

💰 Qarz summasi: <b>${formatAmount(customer.currentDebt)} so'm</b>

Iltimos, bugun to'lashni unutmang! 🙏`;
        }
        else if (daysLeft < 0) {
            message = `🔴 <b>MUDDAT O'TDI!</b>

Hurmatli ${customer.fullName}!

Sizning qarzingiz to'lash muddati <b>${Math.abs(daysLeft)} kun oldin o'tgan</b>!

💰 Qarz summasi: <b>${formatAmount(customer.currentDebt)} so'm</b>

Iltimos, tezroq to'lang! 🙏`;
        }
        if (message) {
            return await sendCustomerBotMessage(telegramUser.telegramId, message);
        }
        return false;
    }
    catch (error) {
        console.error('❌ Send debt reminder error:', error);
        return false;
    }
}
let sellerLastUpdateId = 0;
let customerLastUpdateId = 0;
let pollingActive = false;
async function startPolling() {
    if (pollingActive) {
        console.log('⚠️ Polling already active');
        return;
    }
    pollingActive = true;
    if (SELLER_BOT_TOKEN) {
        console.log('🤖 Sotuvchi bot polling started...');
        pollSellerBot();
    }
    else {
        console.log('⚠️ Sotuvchi bot token not configured');
    }
    if (CUSTOMER_BOT_TOKEN) {
        console.log('🛒 Xaridor bot polling started...');
        pollCustomerBot();
    }
    else {
        console.log('⚠️ Xaridor bot token not configured');
    }
}
async function pollSellerBot() {
    while (pollingActive && SELLER_BOT_TOKEN) {
        try {
            const url = `https://api.telegram.org/bot${SELLER_BOT_TOKEN}/getUpdates?offset=${sellerLastUpdateId + 1}&timeout=30`;
            const response = await fetch(url);
            const data = (await response.json());
            if (data.ok && data.result && data.result.length > 0) {
                for (const update of data.result) {
                    sellerLastUpdateId = update.update_id;
                    if (update.message?.text) {
                        const chatId = update.message.chat.id;
                        await sendMessage(SELLER_BOT_TOKEN, chatId, '👋 Bu sotuvchi boti.\n\nSiz bu bot orqali qarz va mahsulot eslatmalarini olasiz.');
                    }
                }
            }
        }
        catch (error) {
            console.error('Seller bot polling error:', error);
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
}
async function pollCustomerBot() {
    while (pollingActive && CUSTOMER_BOT_TOKEN) {
        try {
            const url = `https://api.telegram.org/bot${CUSTOMER_BOT_TOKEN}/getUpdates?offset=${customerLastUpdateId + 1}&timeout=30`;
            const response = await fetch(url);
            const data = (await response.json());
            if (data.ok && data.result && data.result.length > 0) {
                for (const update of data.result) {
                    customerLastUpdateId = update.update_id;
                    try {
                        await handleCustomerBotUpdate(update);
                    }
                    catch (err) {
                        console.error('Error handling customer update:', err);
                    }
                }
            }
        }
        catch (error) {
            console.error('Customer bot polling error:', error);
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
}
function stopPolling() {
    pollingActive = false;
    console.log('🛑 Telegram bots polling stopped');
}
function getDaysUntil(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
function formatAmount(amount) {
    return amount.toLocaleString('uz-UZ');
}
function formatDate(date) {
    return new Date(date).toLocaleDateString('uz-UZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}
async function handleTelegramUpdate(update) {
    await handleCustomerBotUpdate(update);
}
//# sourceMappingURL=telegram.service.js.map