import mongoose, { Document } from 'mongoose';
export interface ITelegramUser extends Document {
    telegramId: number;
    phone: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    customerId?: mongoose.Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const TelegramUser: mongoose.Model<ITelegramUser, {}, {}, {}, mongoose.Document<unknown, {}, ITelegramUser, {}, {}> & ITelegramUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=TelegramUser.d.ts.map