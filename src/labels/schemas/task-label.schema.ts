import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class TaskLabel {

  @Prop({
    type: Types.ObjectId,
    ref: 'Task',
    required: true,
  })
  task_id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Label',
    required: true,
  })
  label_id: Types.ObjectId;
}

export const TaskLabelSchema = SchemaFactory.createForClass(TaskLabel);