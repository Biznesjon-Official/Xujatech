import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
  currentDebt: number;
  debtLimit: number;
  debtDueDate?: Date;
  totalPurchases: number;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>({
  fullName: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  currentDebt: { type: Number, default: 0 },
  debtLimit: { type: Number, default: 0 },
  debtDueDate: { type: Date },
  totalPurchases: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

CustomerSchema.index({ fullName: 'text', phone: 'text' });

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
