import { Schema, model, Document } from 'mongoose';

export interface IDailyTask {
  _id?: string;
  title: string;
  type: 'dsa' | 'backend' | 'system-design' | 'project' | string; // Allow custom types
  completed: boolean;
  assignee?: string; // User ID of assignee
  customFields?: { [key: string]: any }; // Store custom field values
}

export interface IDaily extends Document {
  workspace?: string | null;
  user?: string | null;
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

const TaskSubSchema = new Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true },
    completed: { type: Boolean, default: false },
    assignee: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    customFields: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: true }
);

const DailySchema = new Schema<IDaily>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: false },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    date: { type: Date, required: true },
    tasks: { type: [TaskSubSchema], default: [] },
    dsaCompleted: { type: Number, default: 0 },
    backendLearning: { type: Number, default: 0 },
    systemDesign: { type: Number, default: 0 },
    projectWork: { type: Number, default: 0 },
    notes: { type: String },
    timeSpentHours: { type: Number, default: 0 },
    energyLevel: { type: Number, default: 3 },
    score: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// calculate score before save
DailySchema.pre('save', function (next) {
  const doc: any = this;
  if (doc.tasks && doc.tasks.length > 0) {
    const completed = doc.tasks.filter((t: any) => t.completed).length;
    const total = doc.tasks.length;
    const percentage = (completed / Math.max(1, total)) * 100;
    doc.score = Math.round((percentage / 100) * 5);
  } else {
    const components = [doc.dsaCompleted || 0, doc.backendLearning || 0, doc.systemDesign || 0, doc.projectWork || 0];
    const compAvg = components.reduce((a: number, b: number) => a + b, 0) / (components.length || 1);
    const energyFactor = doc.energyLevel || 3;
    const score = Math.min(5, Math.round((compAvg / Math.max(1, compAvg + 1) * 4 + energyFactor) / 2));
    doc.score = score;
  }
  next();
});

// Ensure uniqueness per user+date and per workspace+date (use partialFilterExpression to avoid collisions when null)
DailySchema.index({ user: 1, date: 1 }, { unique: true, partialFilterExpression: { user: { $exists: true, $ne: null } } });
DailySchema.index({ workspace: 1, date: 1 }, { unique: true, partialFilterExpression: { workspace: { $exists: true, $ne: null } } });

export default model<IDaily>('Daily', DailySchema);
