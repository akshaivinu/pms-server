import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attachment } from './schemas/attachment.schema.js';
import { Task } from '../tasks/schemas/task.schema.js';
import { Project } from '../projects/schemas/project.schema.js';
import { ProjectMember } from '../projects/schemas/project-member.schema.js';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectModel(Attachment.name)
    @Optional()
    private readonly attachmentModel?: Model<Attachment>,
    @InjectModel(Task.name)
    @Optional()
    private readonly taskModel?: Model<Task>,
    @InjectModel(Project.name)
    @Optional()
    private readonly projectModel?: Model<Project>,
    @InjectModel(ProjectMember.name)
    @Optional()
    private readonly projectMemberModel?: Model<ProjectMember>,
  ) {}

  async assertCanAccess(
    taskId: string,
    userId: string,
    role: string,
    organizationId?: string,
  ) {
    const task = await this.taskModel!.findById(taskId)
      .select('project_id')
      .lean()
      .exec();
    if (!task) throw new BadRequestException('Task not found');
    const project = await this.projectModel!.findById(task.project_id)
      .select('organization_id')
      .lean()
      .exec();
    if (
      !project ||
      (organizationId && String(project.organization_id) !== organizationId)
    ) {
      throw new BadRequestException('You do not have access to this project');
    }
    if (role === 'admin') return;
    const membership = await this.projectMemberModel!.findOne({
      project_id: task.project_id,
      user_id: new Types.ObjectId(userId),
    })
      .lean()
      .exec();
    if (!membership)
      throw new BadRequestException('You do not have access to this project');
  }

  async list(taskId: string) {
    const attachments = await this.attachmentModel!.find({
      task_id: taskId,
    }).exec();
    return { success: true, data: attachments };
  }

  async create(taskId: string, data: Partial<Attachment>) {
    const attachment = await this.attachmentModel!.create({
      task_id: taskId,
      ...data,
    });
    return { success: true, data: attachment };
  }

  async remove(taskId: string, attachmentId: string) {
    const attachment = await this.attachmentModel!.findOneAndDelete({
      _id: attachmentId,
      task_id: taskId,
    }).exec();
    return { success: true, data: attachment };
  }
}
