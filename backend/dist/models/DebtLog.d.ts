import mongoose, { Document } from 'mongoose';
export interface IGuarantor {
    fullName: string;
    phone?: string;
    address?: string;
}
export interface IInstallment {
    installmentNumber: number;
    amount: number;
    dueDate: Date;
    isPaid: boolean;
    paidDate?: Date;
    paidAmount?: number;
}
export interface IDebtLog extends Document {
    customerId: mongoose.Types.ObjectId;
    cashierId?: mongoose.Types.ObjectId;
    action: 'created' | 'edited' | 'deleted' | 'paid' | 'added' | 'payment';
    previousAmount: number;
    newAmount: number;
    changeAmount: number;
    notes?: string;
    receivedBy?: string;
    initialPayment?: number;
    guarantor?: IGuarantor;
    isInstallment?: boolean;
    installmentCount?: number;
    installments?: IInstallment[];
    createdAt: Date;
}
export declare const DebtLog: mongoose.Model<IDebtLog, {}, {}, {}, mongoose.Document<unknown, {}, IDebtLog, {}, {}> & IDebtLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=DebtLog.d.ts.map