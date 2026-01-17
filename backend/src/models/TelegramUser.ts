/**
 * Telegram User Model
 * Telegram orqali ro'yxatdan o'tgan foydalanuvchilar
 */

import mongoose, { Schema, Document } from 'mongoose';

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

const TelegramUserSchema = new Schema<ITelegramUser>(
  {
    telegramId: {
      type: Number,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      index: true,
    },
    firstName: String,
    lastName: String,
    username: String,
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const TelegramUser = mongoose.model<ITelegramUser>('TelegramUser', TelegramUserSchema);
