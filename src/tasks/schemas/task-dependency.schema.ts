import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class TaskDependency {
  @Prop({
    type: Types.ObjectId,
    ref: 'Task',
    required: true,
  })
  task_id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Task',
    required: true,
  })
  depends_on_task_id: Types.ObjectId;
}

export const TaskDependencySchema =
  SchemaFactory.createForClass(TaskDependency);
