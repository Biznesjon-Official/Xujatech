import mongoose, { Document } from 'mongoose';
export interface ISavedReceiptItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    barcode?: string;
}
export interface ISavedReceipt extends Document {
    localId?: string;
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
export declare const SavedReceipt: mongoose.Model<ISavedReceipt, {}, {}, {}, mongoose.Document<unknown, {}, ISavedReceipt, {}, {}> & ISavedReceipt & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=SavedReceipt.d.ts.map