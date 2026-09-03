import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export enum ActivityAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  STATUS_CHANGED = 'status_changed',
  ASSIGNED = 'assigned',
  ROLE_CHANGED = 'role_changed',
}

export enum ActivityEntityType {
  PROJECT = 'project',
  TASK = 'task',
  USER = 'user',
  WORKFLOW = 'workflow',
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class ActivityLog {

  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  organization_id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user_id: Types.ObjectId;

  @Prop({
    enum: ActivityAction,
    required: true,
  })
  action: ActivityAction;

  @Prop({
    enum: ActivityEntityType,
    required: true,
  })
  entity_type: ActivityEntityType;

  @Prop({
    type: Types.ObjectId,
    required: true,
  })
  entity_id: Types.ObjectId;

  @Prop({
    type: Object,
    default: null,
  })
  details: Record<string, any> | null;
}

export const ActivityLogSchema =
  SchemaFactory.createForClass(ActivityLog);