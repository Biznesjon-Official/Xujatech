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
exports.Sale = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SaleItemSchema = new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true }
}, { _id: false });
const PaymentSchema = new mongoose_1.Schema({
    method: { type: String, enum: ['cash', 'card', 'transfer', 'debt', 'click', 'payme', 'credit'], required: true },
    amount: { type: Number, required: true },
    reference: { type: String }
}, { _id: false });
const SaleSchema = new mongoose_1.Schema({
    saleNumber: { type: String, unique: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer' },
    cashierId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [SaleItemSchema],
    payments: [PaymentSchema],
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, required: true },
    changeAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['completed', 'pending', 'cancelled', 'refunded'], default: 'completed' },
    notes: { type: String }
}, {
    timestamps: true
});
SaleSchema.pre('save', async function (next) {
    if (!this.saleNumber) {
        const date = new Date();
        const prefix = `SALE-${date.getFullYear()}`;
        const count = await mongoose_1.default.model('Sale').countDocuments();
        this.saleNumber = `${prefix}-${String(count + 1).padStart(6, '0')}`;
    }
    next();
});
exports.Sale = mongoose_1.default.model('Sale', SaleSchema);
//# sourceMappingURL=Sale.js.map