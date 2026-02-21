import { Schema, model, Document } from 'mongoose';

export interface IMonthly extends Document {
  month: string; // YYYY-MM
  dsaTotal: number;
  backendTopics: number;
  systemDesignTopics: number;
  projectProgressPercent: number;
  resumeUpdates?: string[];
  confidenceLevel?: number;
  switchStage?: string;
}

const MonthlySchema = new Schema<IMonthly>({
  month: { type: String, required: true, unique: true },
  dsaTotal: { type: Number, default: 0 },
  backendTopics: { type: Number, default: 0 },
  systemDesignTopics: { type: Number, default: 0 },
  projectProgressPercent: { type: Number, default: 0 },
  resumeUpdates: [String],
  confidenceLevel: { type: Number, default: 3 },
  switchStage: { type: String }
});

export default model<IMonthly>('Monthly', MonthlySchema);
