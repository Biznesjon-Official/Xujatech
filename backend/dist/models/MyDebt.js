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
const mongoose_1 = __importStar(require("mongoose"));
const MyDebtPaymentSchema = new mongoose_1.Schema({
    _id: { type: String, required: true },
    amount: { type: Number, required: true },
    paidAt: { type: Date, default: Date.now },
    notes: { type: String },
});
const MyDebtSchema = new mongoose_1.Schema({
    creditorName: { type: String, required: true },
    creditorPhone: { type: String },
    amount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: true },
    dueDate: { type: Date },
    notes: { type: String },
    type: { type: String, enum: ['supplier', 'person', 'other'], default: 'supplier' },
    payments: [MyDebtPaymentSchema],
    status: { type: String, enum: ['active', 'paid'], default: 'active' },
    branchId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Branch' },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
exports.default = mongoose_1.default.model('MyDebt', MyDebtSchema);
//# sourceMappingURL=MyDebt.js.map