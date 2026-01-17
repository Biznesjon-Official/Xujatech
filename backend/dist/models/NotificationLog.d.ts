import mongoose, { Document } from 'mongoose';
export interface INotificationLog extends Document {
    type: 'debt' | 'low_stock';
    referenceId: mongoose.Types.ObjectId;
    message: string;
    sentAt: Date;
    createdAt: Date;
}
export declare const NotificationLog: mongoose.Model<INotificationLog, {}, {}, {}, mongoose.Document<unknown, {}, INotificationLog, {}, {}> & INotificationLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=NotificationLog.d.ts.map