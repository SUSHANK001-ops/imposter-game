import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWord extends Document {
  word: string;
  category: string;
  addedBy: 'system' | 'admin';
  roomCode?: string | null;
  usageCount: number;
  createdAt: Date;
}

const WordSchema = new Schema<IWord>({
  word: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true, index: true },
  addedBy: { type: String, enum: ['system', 'admin'], default: 'system' },
  roomCode: { type: String, default: null, index: true },
  usageCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Index to prevent duplicate words per room or global
WordSchema.index({ word: 1, category: 1, roomCode: 1 }, { unique: true });

export const Word: Model<IWord> = mongoose.models.Word || mongoose.model<IWord>('Word', WordSchema);
