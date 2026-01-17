import mongoose, { Document } from 'mongoose';
export interface IBranch extends Document {
    name: string;
    address?: string;
    phone?: string;
    isActive: boolean;
    isMain: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Branch: mongoose.Model<IBranch, {}, {}, {}, mongoose.Document<unknown, {}, IBranch, {}, {}> & IBranch & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Branch.d.ts.map