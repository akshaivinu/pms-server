import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Task {

  @Prop({
    type: Types.ObjectId,
    ref: 'Project',
    required: true,
  })
  project_id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  })
  priority: string;

  @Prop({
    type: Date,
    default: null,
  })
  due_date: Date | null;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  assignee_id: Types.ObjectId | null;

  @Prop({
    type: Types.ObjectId,
    ref: 'WorkflowStage',
    required: true,
  })
  workflow_stage_id: Types.ObjectId;
}

export const TaskSchema = SchemaFactory.createForClass(Task);