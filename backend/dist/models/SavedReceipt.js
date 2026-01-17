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
exports.SavedReceipt = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SavedReceiptItemSchema = new mongoose_1.Schema({
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    barcode: { type: String },
}, { _id: false });
const SavedReceiptSchema = new mongoose_1.Schema({
    localId: { type: String, unique: true, sparse: true },
    cashierId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    cashierName: { type: String },
    items: [SavedReceiptItemSchema],
    total: { type: Number, required: true },
    status: {
        type: String,
        enum: ['saved', 'completed', 'cancelled'],
        default: 'saved'
    },
    source: {
        type: String,
        enum: ['mobile', 'desktop'],
        default: 'mobile'
    },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String },
}, {
    timestamps: true
});
SavedReceiptSchema.index({ status: 1 });
SavedReceiptSchema.index({ cashierId: 1 });
SavedReceiptSchema.index({ source: 1 });
SavedReceiptSchema.index({ createdAt: -1 });
exports.SavedReceipt = mongoose_1.default.model('SavedReceipt', SavedReceiptSchema);
//# sourceMappingURL=SavedReceipt.js.map