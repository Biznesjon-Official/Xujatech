import mongoose, { Schema, Document } from 'mongoose';

export interface IMyDebtPayment {
  _id: string;
  amount: number;
  paidAt: Date;
  notes?: string;
  recipientName?: string;
  recipientPhone?: string;
  type?: 'full' | 'partial';
}

export interface IMyDebt extends Document {
  creditorName: string;
  creditorPhone?: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate?: Date;
  notes?: string;
  type: 'supplier' | 'person' | 'other';
  payments: IMyDebtPayment[];
  status: 'active' | 'paid';
  branchId?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MyDebtPaymentSchema = new Schema({
  _id: { type: String, required: true },
  amount: { type: Number, required: true },
  paidAt: { type: Date, default: Date.now },
  notes: { type: String },
  recipientName: { type: String },
  recipientPhone: { type: String },
  type: { type: String, enum: ['full', 'partial'], default: 'full' },
});

const MyDebtSchema = new Schema({
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
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model<IMyDebt>('MyDebt', MyDebtSchema);
