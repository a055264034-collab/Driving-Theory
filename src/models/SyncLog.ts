import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISyncLog extends Document {
  syncedAt: Date;
  status: 'success' | 'failed';
  totalQuestions: number;
  source: string;
  errorMessage?: string;
}

const SyncLogSchema = new Schema<ISyncLog>({
  syncedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['success', 'failed'], required: true },
  totalQuestions: { type: Number, default: 0 },
  source: { type: String, default: 'data.gov.il' },
  errorMessage: { type: String },
});

export const SyncLogModel: Model<ISyncLog> =
  mongoose.models.SyncLog || mongoose.model<ISyncLog>('SyncLog', SyncLogSchema);
