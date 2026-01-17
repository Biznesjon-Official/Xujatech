import mongoose, { Document, Schema } from 'mongoose';

export interface IWarehouseProduct extends Document {
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: mongoose.Types.ObjectId;
  purchasePrice: number;
  sellingPrice: number;
  warehouseStock: number;
  minimumStock: number;
  unit: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const warehouseProductSchema = new Schema<IWarehouseProduct>({
  barcode: { type: String, index: true },
  name: { type: String, required: true },
  description: String,
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  purchasePrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, required: true },
  warehouseStock: { type: Number, default: 0 },
  minimumStock: { type: Number, default: 5 },
  unit: { type: String, default: 'dona' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IWarehouseProduct>('WarehouseProduct', warehouseProductSchema);
