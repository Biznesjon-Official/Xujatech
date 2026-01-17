import mongoose, { Document } from 'mongoose';
export interface ISetting extends Document {
    key: string;
    value: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Setting: mongoose.Model<ISetting, {}, {}, {}, mongoose.Document<unknown, {}, ISetting, {}, {}> & ISetting & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Setting.d.ts.map