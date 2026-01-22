import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IMyDebt, {}, {}, {}, mongoose.Document<unknown, {}, IMyDebt, {}, {}> & IMyDebt & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=MyDebt.d.ts.map