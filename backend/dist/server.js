"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const database_1 = require("./config/database");
const scheduler_service_1 = require("./services/scheduler.service");
const telegram_service_1 = require("./services/telegram.service");
const auth_1 = __importDefault(require("./routes/auth"));
const products_1 = __importDefault(require("./routes/products"));
const categories_1 = __importDefault(require("./routes/categories"));
const customers_1 = __importDefault(require("./routes/customers"));
const sales_1 = __importDefault(require("./routes/sales"));
const suppliers_1 = __importDefault(require("./routes/suppliers"));
const users_1 = __importDefault(require("./routes/users"));
const reports_1 = __importDefault(require("./routes/reports"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const settings_1 = __importDefault(require("./routes/settings"));
const branches_1 = __importDefault(require("./routes/branches"));
const receipts_1 = __importDefault(require("./routes/receipts"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const telegram_1 = __importDefault(require("./routes/telegram"));
const deliveries_1 = __importDefault(require("./routes/deliveries"));
const warehouses_1 = __importDefault(require("./routes/warehouses"));
const myDebts_1 = __importDefault(require("./routes/myDebts"));
const returns_1 = __importDefault(require("./routes/returns"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/auth', auth_1.default);
app.use('/api/products', products_1.default);
app.use('/api/categories', categories_1.default);
app.use('/api/customers', customers_1.default);
app.use('/api/sales', sales_1.default);
app.use('/api/suppliers', suppliers_1.default);
app.use('/api/users', users_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/inventory', inventory_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/branches', branches_1.default);
app.use('/api/receipts', receipts_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/telegram', telegram_1.default);
app.use('/api/deliveries', deliveries_1.default);
app.use('/api/warehouses', warehouses_1.default);
app.use('/api/my-debts', myDebts_1.default);
app.use('/api/returns', returns_1.default);
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi' });
});
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint topilmadi' });
});
async function startServer() {
    try {
        await (0, database_1.connectDatabase)();
        (0, scheduler_service_1.startScheduler)();
        (0, telegram_service_1.startPolling)();
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map