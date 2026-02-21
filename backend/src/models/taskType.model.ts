import { Schema, model, Document } from 'mongoose';

export interface ICustomField {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date';
  label: string;
}

export interface ITaskType extends Document {
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

const TaskTypeSchema = new Schema<ITaskType>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  color: { type: String, required: true, default: '#6366F1' },
  customFields: [CustomFieldSchema],
  createdAt: { type: Date, default: () => new Date() }
});

// Ensure name uniqueness per user
TaskTypeSchema.index({ user: 1, name: 1 }, { unique: true });

export default model<ITaskType>('TaskType', TaskTypeSchema);
