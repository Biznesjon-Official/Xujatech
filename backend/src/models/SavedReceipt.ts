/**
 * Модель сохранённого чека
 * Используется для мобильного режима кассы
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ISavedReceiptItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
}

export interface ISavedReceipt extends Document {
  localId?: string; // IndexedDB dan kelgan ID
  cashierId?: mongoose.Types.ObjectId;
  cashierName?: string;
  items: ISavedReceiptItem[];
  total: number;
  status: 'saved' | 'completed' | 'cancelled';
  source: 'mobile' | 'desktop';
  customerId?: mongoose.Types.ObjectId;
  customerName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SavedReceiptItemSchema = new Schema<ISavedReceiptItem>({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  barcode: { type: String },
}, { _id: false });

const SavedReceiptSchema = new Schema<ISavedReceipt>({
  localId: { type: String, unique: true, sparse: true }, // IndexedDB ID
  cashierId: { type: Schema.Types.ObjectId, ref: 'User' },
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
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String },
}, {
  timestamps: true
});

// Индексы для быстрого поиска
SavedReceiptSchema.index({ status: 1 });
SavedReceiptSchema.index({ cashierId: 1 });
SavedReceiptSchema.index({ source: 1 });
SavedReceiptSchema.index({ createdAt: -1 });

export const SavedReceipt = mongoose.model<ISavedReceipt>('SavedReceipt', SavedReceiptSchema);
