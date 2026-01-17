import mongoose, { Schema, Document } from 'mongoose';

export interface IBranch extends Document {
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  isMain: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>({
  name: { type: String, required: true },
  address: { type: String },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  isMain: { type: Boolean, default: false },
}, {
  timestamps: true
});

export const Branch = mongoose.model<IBranch>('Branch', BranchSchema);
