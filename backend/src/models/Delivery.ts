/**
 * Delivery Model - Tovar kelishi / Ta'minotchi yetkazib berishi
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IDeliveryItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  purchasePrice: number;
  totalPrice: number;
}

export interface IDelivery extends Document {
  supplierId?: mongoose.Types.ObjectId;
  supplierName: string;
  supplierPhone?: string;
  items: IDeliveryItem[];
  totalAmount: number;
  notes?: string;
  deliveryDate: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryItemSchema = new Schema<IDeliveryItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    purchasePrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const DeliverySchema = new Schema<IDelivery>(
  {
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    supplierName: { type: String, required: true },
    supplierPhone: { type: String },
    items: [DeliveryItemSchema],
    totalAmount: { type: Number, required: true, default: 0 },
    notes: { type: String },
    deliveryDate: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

// Index for date-based queries
DeliverySchema.index({ deliveryDate: -1 });
DeliverySchema.index({ createdAt: -1 });

export const Delivery = mongoose.model<IDelivery>('Delivery', DeliverySchema);
