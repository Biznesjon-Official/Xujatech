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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebtLog = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const GuarantorSchema = new mongoose_1.Schema({
    fullName: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
}, { _id: false });
const InstallmentSchema = new mongoose_1.Schema({
    installmentNumber: { type: Number, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    isPaid: { type: Boolean, default: false },
    paidDate: { type: Date },
    paidAmount: { type: Number, default: 0 },
}, { _id: false });
const DebtLogSchema = new mongoose_1.Schema({
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer', required: true },
    cashierId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ['created', 'edited', 'deleted', 'paid', 'added', 'payment'], required: true },
    previousAmount: { type: Number, required: true },
    newAmount: { type: Number, required: true },
    changeAmount: { type: Number, required: true },
    notes: { type: String },
    receivedBy: { type: String },
    initialPayment: { type: Number },
    guarantor: { type: GuarantorSchema },
    isInstallment: { type: Boolean, default: false },
    installmentCount: { type: Number },
    installments: [InstallmentSchema],
}, {
    timestamps: true,
});
DebtLogSchema.index({ cashierId: 1, createdAt: -1 });
DebtLogSchema.index({ customerId: 1, createdAt: -1 });
exports.DebtLog = mongoose_1.default.model('DebtLog', DebtLogSchema);
//# sourceMappingURL=DebtLog.js.map