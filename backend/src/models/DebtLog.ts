import mongoose, { Schema, Document } from 'mongoose';

// Kafil (Guarantor) interfeysi
export interface IGuarantor {
  fullName: string;
  phone?: string;
  address?: string;
}

// Bo'lib to'lash (Installment) interfeysi
export interface IInstallment {
  installmentNumber: number; // Bo'lak raqami (1, 2, 3...)
  amount: number; // Bo'lak summasi
  dueDate: Date; // To'lov sanasi
  isPaid: boolean; // To'landimi?
  paidDate?: Date; // Qachon to'langan
  paidAmount?: number; // Qancha to'langan
}

export interface IDebtLog extends Document {
  customerId: mongoose.Types.ObjectId;
  cashierId?: mongoose.Types.ObjectId;
  action: 'created' | 'edited' | 'deleted' | 'paid' | 'added';
  previousAmount: number;
  newAmount: number;
  changeAmount: number;
  notes?: string;
  receivedBy?: string; // Pulni kim qabul qildi
  // Kafil ma'lumotlari
  guarantor?: IGuarantor;
  // Bo'lib to'lash (Installment)
  isInstallment?: boolean; // Bo'lib to'lashmi?
  installmentCount?: number; // Necha bo'lakka
  installments?: IInstallment[]; // Bo'laklar ro'yxati
  createdAt: Date;
}

// Kafil sxemasi
const GuarantorSchema = new Schema<IGuarantor>(
  {
    fullName: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
  },
  { _id: false }
);

// Bo'lib to'lash sxemasi
const InstallmentSchema = new Schema<IInstallment>(
  {
    installmentNumber: { type: Number, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    isPaid: { type: Boolean, default: false },
    paidDate: { type: Date },
    paidAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const DebtLogSchema = new Schema<IDebtLog>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    cashierId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ['created', 'edited', 'deleted', 'paid', 'added'], required: true },
    previousAmount: { type: Number, required: true },
    newAmount: { type: Number, required: true },
    changeAmount: { type: Number, required: true },
    notes: { type: String },
    receivedBy: { type: String }, // Pulni kim qabul qildi
    // Kafil ma'lumotlari
    guarantor: { type: GuarantorSchema },
    // Bo'lib to'lash
    isInstallment: { type: Boolean, default: false },
    installmentCount: { type: Number },
    installments: [InstallmentSchema],
  },
  {
    timestamps: true,
  }
);

DebtLogSchema.index({ cashierId: 1, createdAt: -1 });
DebtLogSchema.index({ customerId: 1, createdAt: -1 });

export const DebtLog = mongoose.model<IDebtLog>('DebtLog', DebtLogSchema);
