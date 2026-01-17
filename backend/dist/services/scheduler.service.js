"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScheduler = startScheduler;
exports.stopScheduler = stopScheduler;
exports.isSchedulerActive = isSchedulerActive;
const node_cron_1 = __importDefault(require("node-cron"));
const notification_service_1 = require("./notification.service");
let isSchedulerRunning = false;
function startScheduler() {
    if (isSchedulerRunning) {
        console.log('⚠️ Rejalashtiruvchi allaqachon ishlayapti');
        return;
    }
    console.log('🕐 Bildirishnomalar rejalashtiruvchisi ishga tushirilmoqda...');
    node_cron_1.default.schedule('* * * * *', async () => {
        console.log('⏰ Bildirishnomalarni tekshirish...');
        await (0, notification_service_1.runAllNotificationChecks)();
    }, {
        timezone: 'Asia/Tashkent'
    });
    isSchedulerRunning = true;
    console.log('✅ Rejalashtiruvchi ishga tushdi - har daqiqada tekshiriladi');
}
function stopScheduler() {
    isSchedulerRunning = false;
    console.log('🛑 Rejalashtiruvchi to\'xtatildi');
}
function isSchedulerActive() {
    return isSchedulerRunning;
}
//# sourceMappingURL=scheduler.service.js.map