import { Schema, model, Document } from 'mongoose';

export interface IBackendTopic extends Document {
  topic: string;
  category?: string;
  status?: string;
  notes?: string;
  githubLink?: string;
}

const BackendTopicSchema = new Schema<IBackendTopic>({
  topic: { type: String, required: true },
  category: { type: String },
  status: { type: String, default: 'todo' },
  notes: { type: String },
  githubLink: { type: String }
});

export default model<IBackendTopic>('BackendTopic', BackendTopicSchema);
