import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export enum AttachmentType {
  FILE = 'file',
  LINK = 'link',
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Attachment {

  @Prop({
    type: Types.ObjectId,
    ref: 'Task',
    required: true,
  })
  task_id: Types.ObjectId;

  @Prop({
    enum: AttachmentType,
    required: true,
  })
  type: AttachmentType;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;

  @Prop({
    type: String,
    default: null,
  })
  file_type: string | null;
  
  @Prop({
    type: Number,
    default: null,
  })
  file_size: number | null;
}

export const AttachmentSchema =
  SchemaFactory.createForClass(Attachment);