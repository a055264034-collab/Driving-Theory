import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExamHistory extends Document {
  licenseType: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  score: number;
  passed: boolean;
  timeTaken: number; // in seconds
  answers: {
    questionId: string;
    questionNumber: string;
    questionText: string;
    selectedAnswerIndex: number | null;
    correctAnswerIndex: number;
    isCorrect: boolean;
    answersList: string[];
    category: string;
  }[];
  categoryBreakdown: Record<string, { correct: number; total: number }>;
  createdAt: Date;
}

const ExamHistorySchema = new Schema<IExamHistory>({
  licenseType: { type: String, required: true, default: 'B' },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  wrongAnswers: { type: Number, required: true },
  score: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  timeTaken: { type: Number, required: true },
  answers: [
    {
      questionId: { type: String, required: true },
      questionNumber: { type: String, default: '' },
      questionText: { type: String, default: '' },
      selectedAnswerIndex: { type: Number, default: null },
      correctAnswerIndex: { type: Number, required: true },
      isCorrect: { type: Boolean, required: true },
      answersList: [{ type: String }],
      category: { type: String, default: 'כללי' },
    },
  ],
  categoryBreakdown: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
});

export const ExamHistoryModel: Model<IExamHistory> =
  mongoose.models.ExamHistory || mongoose.model<IExamHistory>('ExamHistory', ExamHistorySchema);
