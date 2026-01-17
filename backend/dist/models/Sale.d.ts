import mongoose, { Document } from 'mongoose';
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
export declare const Sale: mongoose.Model<ISale, {}, {}, {}, mongoose.Document<unknown, {}, ISale, {}, {}> & ISale & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Sale.d.ts.map