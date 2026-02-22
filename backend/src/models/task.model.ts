import { Schema, model, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  user?: string;
  column: string;
  priority?: 'Low' | 'Medium' | 'High';
  area?: string;
  notes?: string;
  order?: number;
}

const TaskSchema = new Schema<ITask>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: false },
  title: { type: String, required: true },
  description: { type: String },
  column: { type: String, default: 'Backlog' },
  priority: { type: String, default: 'Medium' },
  area: { type: String },
  notes: { type: String },
  order: { type: Number, default: 0 }
});

// Index to quickly query a user's or workspace's tasks by column/order
TaskSchema.index({ user: 1, column: 1, order: 1 }, { sparse: true });
TaskSchema.index({ workspace: 1, column: 1, order: 1 }, { sparse: true });

export default model<ITask>('Task', TaskSchema);
