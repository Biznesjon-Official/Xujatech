import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    username: string;
    password: string;
    fullName: string;
    email?: string;
    phone?: string;
    role: 'admin' | 'manager' | 'cashier';
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map