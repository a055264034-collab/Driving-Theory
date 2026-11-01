import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuestionDoc extends Document {
  id: string;
  questionNumber: string;
  text: string;
  answers: string[];
  correctAnswerIndex: number;
  category: string;
  imageUrl: string | null;
  licenseTypes: string[];
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestionDoc>({
  id: { type: String, required: true, unique: true, index: true },
  questionNumber: { type: String, required: true, index: true },
  text: { type: String, required: true },
  answers: [{ type: String, required: true }],
  correctAnswerIndex: { type: Number, required: true },
  category: { type: String, required: true, index: true },
  imageUrl: { type: String, default: null },
  licenseTypes: [{ type: String, index: true }],
  updatedAt: { type: Date, default: Date.now },
});

export const QuestionModel: Model<IQuestionDoc> =
  mongoose.models.Question || mongoose.model<IQuestionDoc>('Question', QuestionSchema);
