import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { UserRole } from "../enums/users.enum.js";

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {

  @Prop()
  organization_id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.MEMBER })
  role: UserRole;
  
}

export const UserSchema = SchemaFactory.createForClass(User);