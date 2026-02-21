import { Schema, model, Document } from 'mongoose';

export interface IJob extends Document {
  company: string;
  role?: string;
  location?: string;
  referral?: string;
  stage?: string;
  notes?: string;
  appliedAt?: Date;
}

const JobSchema = new Schema<IJob>({
  company: { type: String, required: true },
  role: { type: String },
  location: { type: String },
  referral: { type: String },
  stage: { type: String, default: 'applied' },
  notes: { type: String },
  appliedAt: { type: Date, default: Date.now }
});

export default model<IJob>('Job', JobSchema);
