import { Schema, model, Document } from 'mongoose';

export interface ICustomField {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date';
  label: string;
}

export interface ITaskType extends Document {
  user?: any;
  workspace?: any;
  name: string;
  color: string; // hex color like #FF5733
  customFields?: ICustomField[];
  createdAt?: Date;
}

const CustomFieldSchema = new Schema<ICustomField>({
  name: { type: String, required: true },
  type: { type: String, enum: ['text', 'number', 'boolean', 'date'], required: true },
  label: { type: String, required: true }
});

const TaskTypeSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: false },
  name: { type: String, required: true },
  color: { type: String, required: true, default: '#6366F1' },
  customFields: [CustomFieldSchema],
  createdAt: { type: Date, default: () => new Date() }
});

// Ensure name uniqueness per user or per workspace
TaskTypeSchema.index({ user: 1, name: 1 }, { unique: true, sparse: true });
TaskTypeSchema.index({ workspace: 1, name: 1 }, { unique: true, sparse: true });

export default model('TaskType', TaskTypeSchema as any);
