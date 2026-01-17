import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationLog extends Document {
  type: 'debt' | 'low_stock';
  referenceId: mongoose.Types.ObjectId;
  message: string;
  sentAt: Date;
  createdAt: Date;
}

const NotificationLogSchema = new Schema<INotificationLog>({
  type: { type: String, enum: ['debt', 'low_stock'], required: true },
  referenceId: { type: Schema.Types.ObjectId, required: true },
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
}, {
  timestamps: true
});

// Индекс для быстрого поиска отправленных уведомлений за день
NotificationLogSchema.index({ type: 1, referenceId: 1, sentAt: 1 });

// TTL индекс - автоматически удалять записи старше 7 дней
NotificationLogSchema.index({ sentAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export const NotificationLog = mongoose.model<INotificationLog>('NotificationLog', NotificationLogSchema);
