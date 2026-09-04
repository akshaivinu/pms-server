import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProjectMemberDocument = HydratedDocument<ProjectMember>;

@Schema({ timestamps: true })
export class ProjectMember {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  project_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ default: 'TEAM_MEMBER' })
  project_role: string;
}

export const ProjectMemberSchema = SchemaFactory.createForClass(ProjectMember);
ProjectMemberSchema.index({ project_id: 1, user_id: 1 }, { unique: true });
