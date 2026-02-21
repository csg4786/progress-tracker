import { Schema, model, Document } from 'mongoose';

export interface IWeekly extends Document {
  weekStart: Date;
  weekEnd: Date;
  dsaTotal: number;
  backendTopicsCompleted: number;
  systemDesignTopics: number;
  projectCommits: number;
  wins?: string[];
  failures?: string[];
  fixes?: string[];
  weeklyScore: number;
  status?: string;
}

const WeeklySchema = new Schema<IWeekly>({
  weekStart: { type: Date, required: true },
  weekEnd: { type: Date, required: true },
  dsaTotal: { type: Number, default: 0 },
  backendTopicsCompleted: { type: Number, default: 0 },
  systemDesignTopics: { type: Number, default: 0 },
  projectCommits: { type: Number, default: 0 },
  wins: [String],
  failures: [String],
  fixes: [String],
  weeklyScore: { type: Number, default: 0 },
  status: { type: String, default: 'on-track' }
});

// weighted formula example
WeeklySchema.pre('save', function (next) {
  const doc = this as IWeekly;
  const score = Math.round(
    (doc.dsaTotal * 0.4 + doc.backendTopicsCompleted * 0.2 + doc.systemDesignTopics * 0.2 + doc.projectCommits * 0.2) / 10
  );
  doc.weeklyScore = Math.max(0, Math.min(100, score));
  next();
});

export default model<IWeekly>('Weekly', WeeklySchema);
