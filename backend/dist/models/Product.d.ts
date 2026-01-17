import mongoose, { Document } from 'mongoose';
export interface IProduct extends Document {
    name: string;
    barcode?: string;
    sku?: string;
    description?: string;
    categoryId?: mongoose.Types.ObjectId;
    purchasePrice: number;
    sellingPrice: number;
    wholesalePrice?: number;
    currentStock: number;
    minimumStock: number;
    unit: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Product: mongoose.Model<IProduct, {}, {}, {}, mongoose.Document<unknown, {}, IProduct, {}, {}> & IProduct & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Product.d.ts.map