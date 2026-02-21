import { Schema, model, Document } from 'mongoose';

export interface ISystemDesign extends Document {
  concept: string;
  category?: string;
  status?: string;
  diagramLink?: string;
  notes?: string;
}

const SystemDesignSchema = new Schema<ISystemDesign>({
  concept: { type: String, required: true },
  category: { type: String },
  status: { type: String, default: 'todo' },
  diagramLink: { type: String },
  notes: { type: String }
});

export default model<ISystemDesign>('SystemDesign', SystemDesignSchema);
