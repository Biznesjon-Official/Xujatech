import mongoose, { Document } from 'mongoose';
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
export declare const Customer: mongoose.Model<ICustomer, {}, {}, {}, mongoose.Document<unknown, {}, ICustomer, {}, {}> & ICustomer & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Customer.d.ts.map