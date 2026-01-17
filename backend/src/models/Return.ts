import mongoose, { Schema, Document } from 'mongoose';

export interface IReturnItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IReturn extends Document {
  saleId?: mongoose.Types.ObjectId;
  items: IReturnItem[];
  totalAmount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  branchId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
}, { _id: false });

const ReturnSchema = new Schema({
  saleId: { type: Schema.Types.ObjectId, ref: 'Sale' },
  items: [ReturnItemSchema],
  totalAmount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  customerName: { type: String },
  customerPhone: { type: String },
  notes: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
}, { timestamps: true });

export default mongoose.model<IReturn>('Return', ReturnSchema);
