import { Schema, model, Document } from 'mongoose';

export interface IDSA extends Document {
  name: string;
  link?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  pattern?: string;
  topic?: string;
  status?: string;
  notes?: string;
  tags?: string[];
}

const DSASchema = new Schema<IDSA>({
  name: { type: String, required: true },
  link: { type: String },
  difficulty: { type: String },
  pattern: { type: String },
  topic: { type: String },
  status: { type: String, default: 'todo' },
  notes: { type: String },
  tags: [String]
});

export default model<IDSA>('DSA', DSASchema);
