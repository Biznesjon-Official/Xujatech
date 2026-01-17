import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IReturn, {}, {}, {}, mongoose.Document<unknown, {}, IReturn, {}, {}> & IReturn & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Return.d.ts.map