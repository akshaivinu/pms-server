import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ActivityLog,
  ActivityAction,
  ActivityEntityType,
} from './schemas/activity-logs.schema.js';
import { Task } from '../tasks/schemas/task.schema.js';
import { Project } from '../projects/schemas/project.schema.js';

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectModel(ActivityLog.name)
    @Optional()
    private readonly activityLogModel?: Model<ActivityLog>,
    @InjectModel(Task.name)
    @Optional()
    private readonly taskModel?: Model<Task>,
    @InjectModel(Project.name)
    @Optional()
    private readonly projectModel?: Model<Project>,
  ) {}

  async getOrganizationActivity(organizationId: string) {
    const logs = await this.activityLogModel!.find({
      organization_id: organizationId,
    }).exec();
    return { success: true, data: logs };
  }

  async assertOrgMatches(organizationId: string, userOrgId?: string) {
    if (userOrgId && organizationId !== userOrgId) {
      throw new BadRequestException(
        'You do not have access to this organization',
      );
    }
  }

  async assertProjectOrg(projectId: string, userOrgId?: string) {
    const project = await this.projectModel!.findById(projectId)
      .select('organization_id')
      .lean()
      .exec();
    if (!project) throw new BadRequestException('Project not found');
    if (userOrgId && String(project.organization_id) !== userOrgId) {
      throw new BadRequestException('You do not have access to this project');
    }
  }

  async assertTaskOrg(taskId: string, userOrgId?: string) {
    const task = await this.taskModel!.findById(taskId)
      .select('project_id')
      .lean()
      .exec();
    if (!task) throw new BadRequestException('Task not found');
    await this.assertProjectOrg(String(task.project_id), userOrgId);
  }

  private describe(log: any): string {
    const details = log?.details ?? {};
    const entity = String(log?.entity_type ?? '');
    const title = details?.title ? String(details.title) : null;
    const name = details?.name ? String(details.name) : null;
    switch (log?.action) {
      case 'create':
        return title ? `${entity} "${title}" created` : `${entity} created`;
      case 'delete':
        return title ? `${entity} "${title}" deleted` : `${entity} deleted`;
      case 'update':
        return title ? `${entity} "${title}" updated` : `${entity} updated`;
      case 'status_changed':
        return title
          ? `${entity} "${title}" status changed`
          : `${entity} status changed`;
      case 'assigned':
        return title ? `${entity} "${title}" assigned` : `${entity} assigned`;
      case 'role_changed':
        return name ? `Role changed for ${name}` : 'Role changed';
      default:
        return `${entity ?? 'Team'} event recorded`;
    }
  }

  async getRecentActivity(organizationId: string) {
    const raw = await this.activityLogModel!.find({
      organization_id: organizationId,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('user_id', 'name email')
      .lean()
      .exec();

    const data = raw.map((log: any) => {
      const user = log?.user_id ?? {};
      return {
        id: String(log?._id),
        userName: String(user?.name ?? user?.email ?? 'Team member'),
        action: log?.action,
        message: this.describe(log),
        createdAt: log?.createdAt,
      };
    });

    return { success: true, data };
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

  async logActivity(data: {
    organizationId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: Types.ObjectId;
    details?: Record<string, any>;
  }) {
    try {
      await this.activityLogModel!.create({
        organization_id: data.organizationId,
        user_id: data.userId,
        action: data.action as ActivityAction,
        entity_type: data.entityType as ActivityEntityType,
        entity_id: data.entityId,
        details: data.details ?? null,
      });
    } catch {
      // Silently ignore activity logging failures
    }
  }
}
