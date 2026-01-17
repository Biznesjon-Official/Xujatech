import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
  parentId?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  description: { type: String },
  parentId: { type: Schema.Types.ObjectId, ref: 'Category' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
