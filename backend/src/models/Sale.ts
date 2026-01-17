import mongoose, { Schema, Document } from 'mongoose';

export interface ISaleItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalPrice: number;
}

export interface IPayment {
  method: 'cash' | 'card' | 'transfer' | 'debt' | 'click' | 'payme' | 'credit';
  amount: number;
  reference?: string;
}

export interface ISale extends Document {
  saleNumber: string;
  customerId?: mongoose.Types.ObjectId;
  cashierId: mongoose.Types.ObjectId;
  items: ISaleItem[];
  payments: IPayment[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SaleItemSchema = new Schema<ISaleItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true }
}, { _id: false });

const PaymentSchema = new Schema<IPayment>({
  method: { type: String, enum: ['cash', 'card', 'transfer', 'debt', 'click', 'payme', 'credit'], required: true },
  amount: { type: Number, required: true },
  reference: { type: String }
}, { _id: false });

const SaleSchema = new Schema<ISale>({
  saleNumber: { type: String, unique: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  cashierId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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

// Generate sale number - always generate before save
SaleSchema.pre('save', async function(next) {
  if (!this.saleNumber) {
    const date = new Date();
    const prefix = `SALE-${date.getFullYear()}`;
    const count = await mongoose.model('Sale').countDocuments();
    this.saleNumber = `${prefix}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const Sale = mongoose.model<ISale>('Sale', SaleSchema);
