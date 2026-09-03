import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project>;

export enum ProjectStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

@Schema({ timestamps: true })
export class Project {

  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  organization_id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({
    enum: ProjectStatus,
    default: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;

  @Prop({ type: Date, default: null })
  archived_at: Date | null;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);