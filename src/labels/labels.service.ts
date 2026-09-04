import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Label } from './schemas/label.schema.js';
import { TaskLabel } from './schemas/task-label.schema.js';
import { Task } from '../tasks/schemas/task.schema.js';
import { Project } from '../projects/schemas/project.schema.js';
import { ProjectMember } from '../projects/schemas/project-member.schema.js';
import { ActivityLogsService } from '../activity-logs/activity-logs.service.js';

@Injectable()
export class LabelsService {
  constructor(
    @InjectModel(Label.name) @Optional() private labelModel?: Model<Label>,
    @InjectModel(TaskLabel.name)
    @Optional()
    private taskLabelModel?: Model<TaskLabel>,
    @InjectModel(Task.name) @Optional() private taskModel?: Model<Task>,
    @InjectModel(Project.name)
    @Optional()
    private projectModel?: Model<Project>,
    @InjectModel(ProjectMember.name)
    @Optional()
    private memberModel?: Model<ProjectMember>,
    private activity?: ActivityLogsService,
  ) {}

  private async assertLabelOrg(labelId: string, orgId?: string) {
    if (!orgId) return;
    const label = await this.labelModel!.findById(labelId)
      .select('organization_id')
      .lean();
    if (!label || String(label.organization_id) !== orgId)
      throw new BadRequestException('Access denied');
  }

  private async assertTaskAccess(
    taskId: string,
    userId: string,
    role: string,
    orgId?: string,
  ) {
    const task = await this.taskModel!.findById(taskId)
      .select('project_id')
      .lean();
    if (!task) throw new BadRequestException('Task not found');
    const project = await this.projectModel!.findById(task.project_id)
      .select('organization_id')
      .lean();
    if (!project || (orgId && String(project.organization_id) !== orgId))
      throw new BadRequestException('Access denied');
    if (role === 'admin') return;
    const member = await this.memberModel!.findOne({
      project_id: task.project_id,
      user_id: new Types.ObjectId(userId),
    }).lean();
    if (!member) throw new BadRequestException('Access denied');
  }

  async createLabel(orgId: string, name: string, userId?: string) {
    const label = await this.labelModel!.create({
      organization_id: orgId,
      name,
    });
    if (userId)
      this.activity?.logActivity({
        organizationId: orgId,
        userId,
        action: 'create',
        entityType: 'task',
        entityId: label._id,
        details: { title: name },
      });
    return { success: true, data: label };
  }

  async listLabels(orgId: string) {
    return {
      success: true,
      data: await this.labelModel!.find({ organization_id: orgId }),
    };
  }

  async updateLabel(labelId: string, data: Partial<Label>, orgId?: string) {
    await this.assertLabelOrg(labelId, orgId);
    return {
      success: true,
      data: await this.labelModel!.findByIdAndUpdate(labelId, data, {
        new: true,
      }),
    };
  }

  async deleteLabel(labelId: string, orgId?: string) {
    await this.assertLabelOrg(labelId, orgId);
    return {
      success: true,
      data: await this.labelModel!.findByIdAndDelete(labelId),
    };
  }

  async assignLabel(
    taskId: string,
    labelId: string,
    userId?: string,
    role?: string,
    orgId?: string,
  ) {
    await this.assertTaskAccess(taskId, userId ?? '', role ?? 'member', orgId);
    await this.assertLabelOrg(labelId, orgId);
    return {
      success: true,
      data: await this.taskLabelModel!.create({
        task_id: taskId,
        label_id: labelId,
      }),
    };
  }

  async removeLabel(
    taskId: string,
    labelId: string,
    userId?: string,
    role?: string,
    orgId?: string,
  ) {
    await this.assertTaskAccess(taskId, userId ?? '', role ?? 'member', orgId);
    await this.assertLabelOrg(labelId, orgId);
    return {
      success: true,
      data: await this.taskLabelModel!.findOneAndDelete({
        task_id: taskId,
        label_id: labelId,
      }),
    };
  }

  async getLabelsForTask(
    taskId: string,
    userId?: string,
    role?: string,
    orgId?: string,
  ) {
    await this.assertTaskAccess(taskId, userId ?? '', role ?? 'member', orgId);
    const taskLabels = await this.taskLabelModel!.find({ task_id: taskId })
      .select('label_id')
      .lean();
    const labels = await this.labelModel!.find({
      _id: { $in: taskLabels.map((tl) => tl.label_id) },
    }).lean();
    return { success: true, data: labels };
  }
}
