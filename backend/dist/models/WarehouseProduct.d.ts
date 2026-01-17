import mongoose, { Document } from 'mongoose';
export interface IWarehouseProduct extends Document {
    barcode?: string;
    name: string;
    description?: string;
    categoryId?: mongoose.Types.ObjectId;
    purchasePrice: number;
    sellingPrice: number;
    warehouseStock: number;
    minimumStock: number;
    unit: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IWarehouseProduct, {}, {}, {}, mongoose.Document<unknown, {}, IWarehouseProduct, {}, {}> & IWarehouseProduct & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=WarehouseProduct.d.ts.map