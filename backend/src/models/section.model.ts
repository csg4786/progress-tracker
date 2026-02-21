import { Schema, model, Document } from 'mongoose';

export interface ISection extends Document {
  user: string;
  name: string;
  order?: number;
  createdAt?: Date;
}

const SectionSchema = new Schema<ISection>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: () => new Date() }
});

SectionSchema.index({ user: 1, name: 1 }, { unique: true });

export default model<ISection>('Section', SectionSchema);
