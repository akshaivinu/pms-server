import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Workflow {
  @Prop({
    type: Types.ObjectId,
    ref: 'Project',
    required: true,
  })
  project_id: Types.ObjectId;

  @Prop({ required: true, default: 'Default workflow' })
  name: string;
}

export const WorkflowSchema = SchemaFactory.createForClass(Workflow);
