"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const models_1 = require("../models");
const fs = __importStar(require("fs"));
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xujatech_pos';
async function restore() {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
        const backupFiles = fs.readdirSync('./').filter(file => file.startsWith('backup_') && file.endsWith('.json'));
        if (backupFiles.length === 0) {
            console.log('❌ Backup fayllari topilmadi!');
            process.exit(1);
        }
        const latestBackup = backupFiles.sort().reverse()[0];
        console.log(`📁 Backup fayl: ${latestBackup}`);
        const backupData = JSON.parse(fs.readFileSync(latestBackup, 'utf8'));
        console.log('🔄 Ma\'lumotlar tiklanmoqda...');
        if (backupData.users && backupData.users.length > 0) {
            await models_1.User.insertMany(backupData.users);
            console.log(`✅ ${backupData.users.length} ta user tiklandi`);
        }
        if (backupData.categories && backupData.categories.length > 0) {
            await models_1.Category.insertMany(backupData.categories);
            console.log(`✅ ${backupData.categories.length} ta category tiklandi`);
        }
        if (backupData.products && backupData.products.length > 0) {
            await models_1.Product.insertMany(backupData.products);
            console.log(`✅ ${backupData.products.length} ta product tiklandi`);
        }
        if (backupData.customers && backupData.customers.length > 0) {
            await models_1.Customer.insertMany(backupData.customers);
            console.log(`✅ ${backupData.customers.length} ta customer tiklandi`);
        }
        if (backupData.settings && backupData.settings.length > 0) {
            await models_1.Setting.insertMany(backupData.settings);
            console.log(`✅ ${backupData.settings.length} ta setting tiklandi`);
        }
        console.log('\n🎉 Ma\'lumotlar muvaffaqiyatli tiklandi!');
        process.exit(0);
    }
    catch (error) {
        console.error('Restore error:', error);
        process.exit(1);
    }
}
restore();
//# sourceMappingURL=restore.js.map