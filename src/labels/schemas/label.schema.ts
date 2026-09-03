import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Label {

  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  organization_id: Types.ObjectId;

  @Prop({ required: true })
  name: string;
}

export const LabelSchema = SchemaFactory.createForClass(Label);