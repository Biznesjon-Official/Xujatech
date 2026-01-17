import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  barcode?: string;
  sku?: string;
  description?: string;
  categoryId?: mongoose.Types.ObjectId;
  purchasePrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  currentStock: number;
  minimumStock: number;
  unit: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  barcode: { type: String, index: true },
  sku: { type: String, index: true },
  description: { type: String },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  purchasePrice: { type: Number, required: true, default: 0 },
  sellingPrice: { type: Number, required: true, default: 0 },
  wholesalePrice: { type: Number },
  currentStock: { type: Number, default: 0 },
  minimumStock: { type: Number, default: 5 },
  unit: { type: String, default: 'dona' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Index for search
ProductSchema.index({ name: 'text', barcode: 'text' });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
