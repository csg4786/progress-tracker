import { Schema, model, Document, Types } from 'mongoose';

export interface IWorkspaceMember {
  user: Types.ObjectId;
  role: 'owner' | 'editor' | 'viewer';
}

export interface IWorkspace extends Document {
  name: string;
  description?: string;
  owner: Types.ObjectId;
  members: IWorkspaceMember[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceMemberSchema = new Schema<IWorkspaceMember>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'viewer' }
});

const WorkspaceSchema = new Schema<IWorkspace>({
  name: { type: String, required: true },
  description: { type: String },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: { type: [WorkspaceMemberSchema], default: [] }
}, { timestamps: true });

WorkspaceSchema.index({ owner: 1 });

export default model<IWorkspace>('Workspace', WorkspaceSchema);
