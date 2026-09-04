import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Organization {
  @Prop({ required: true })
  name: string;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
