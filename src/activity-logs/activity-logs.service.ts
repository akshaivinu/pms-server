import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ActivityLog } from './schemas/activity-logs.schema.js';

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectModel(ActivityLog.name) @Optional() private readonly activityLogModel?: Model<ActivityLog>,
  ) {}

  async getOrganizationActivity(organizationId: string) {
    const logs = await this.activityLogModel!.find({ organization_id: organizationId }).exec();
    return { success: true, data: logs };
  }

  async getProjectActivity(projectId: string) {
    const logs = await this.activityLogModel!.find({
      entity_type: 'project' as any,
      entity_id: projectId,
    }).exec();
    return { success: true, data: logs };
  }

  async getTaskActivity(taskId: string) {
    const logs = await this.activityLogModel!.find({
      entity_type: 'task' as any,
      entity_id: taskId,
    }).exec();
    return { success: true, data: logs };
  }
}
