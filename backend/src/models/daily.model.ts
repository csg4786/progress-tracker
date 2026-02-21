import { Schema, model, Document } from 'mongoose';

export interface IDailyTask {
  _id?: string;
  title: string;
  type: 'dsa' | 'backend' | 'system-design' | 'project' | string; // Allow custom types
  completed: boolean;
  customFields?: { [key: string]: any }; // Store custom field values
}

export interface IDaily extends Document {
  user: string;
  date: Date;
  tasks?: IDailyTask[];
  dsaCompleted: number;
  backendLearning: number;
  systemDesign: number;
  projectWork: number;
  notes?: string;
  timeSpentHours?: number;
  energyLevel?: number; // 0-5
  score: number; // 0-5
}

const DailySchema = new Schema<IDaily>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  tasks: [
    {
      title: { type: String, required: true },
      type: { type: String, required: true }, // Allow any task type
      completed: { type: Boolean, default: false },
      customFields: { type: Schema.Types.Mixed, default: {} } // Store custom field values
    }
  ],
  dsaCompleted: { type: Number, default: 0 },
  backendLearning: { type: Number, default: 0 },
  systemDesign: { type: Number, default: 0 },
  projectWork: { type: Number, default: 0 },
  notes: { type: String },
  timeSpentHours: { type: Number, default: 0 },
  energyLevel: { type: Number, default: 3 },
  score: { type: Number, default: 0 }
});

// calculate score before save
DailySchema.pre('save', function (next) {
  const doc = this as IDaily;
  // Calculate score based on completed tasks
  if (doc.tasks && doc.tasks.length > 0) {
    const completed = doc.tasks.filter((t) => t.completed).length;
    const total = doc.tasks.length;
    const percentage = (completed / total) * 100;
    // Map percentage to 0-5 score
    doc.score = Math.round((percentage / 100) * 5);
  } else {
    // Fallback to old calculation if no tasks
    const components = [doc.dsaCompleted, doc.backendLearning, doc.systemDesign, doc.projectWork];
    const compAvg = components.reduce((a, b) => a + b, 0) / (components.length || 1);
    const energyFactor = doc.energyLevel || 3;
    const score = Math.min(5, Math.round((compAvg / Math.max(1, compAvg + 1) * 4 + energyFactor) / 2));
    doc.score = score;
  }
  next();
});

// Ensure uniqueness per user+date
DailySchema.index({ user: 1, date: 1 }, { unique: true });

export default model<IDaily>('Daily', DailySchema);
