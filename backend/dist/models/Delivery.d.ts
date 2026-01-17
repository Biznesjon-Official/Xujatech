import mongoose, { Document } from 'mongoose';
export interface IDeliveryItem {
    productId: mongoose.Types.ObjectId;
    productName: string;
    quantity: number;
    purchasePrice: number;
    totalPrice: number;
}
export interface IDelivery extends Document {
    supplierId?: mongoose.Types.ObjectId;
    supplierName: string;
    supplierPhone?: string;
    items: IDeliveryItem[];
    totalAmount: number;
    notes?: string;
    deliveryDate: Date;
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Delivery: mongoose.Model<IDelivery, {}, {}, {}, mongoose.Document<unknown, {}, IDelivery, {}, {}> & IDelivery & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Delivery.d.ts.map