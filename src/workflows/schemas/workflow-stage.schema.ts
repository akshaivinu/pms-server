import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class WorkflowStage {
  @Prop({
    type: Types.ObjectId,
    ref: 'Workflow',
    required: true,
  })
  workflow_id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  position: number;
}

export const WorkflowStageSchema = SchemaFactory.createForClass(WorkflowStage);
