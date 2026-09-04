import { ForbiddenException, Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Types } from 'mongoose';
import { Workflow } from './schemas/workflow.schema.js';
import { WorkflowStage } from './schemas/workflow-stage.schema.js';
import { ProjectMember } from '../projects/schemas/project-member.schema.js';
import { User } from '../users/schemas/user.schema.js';
import { Project } from '../projects/schemas/project.schema.js';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectModel(Workflow.name) @Optional() private readonly workflowModel?: Model<Workflow>,
    @InjectModel(WorkflowStage.name) @Optional() private readonly stageModel?: Model<WorkflowStage>,
    @InjectModel(ProjectMember.name) @Optional() private readonly projectMemberModel?: Model<ProjectMember>,
    @InjectModel(User.name) @Optional() private readonly userModel?: Model<User>,
    @InjectModel(Project.name) @Optional() private readonly projectModel?: Model<Project>,
  ) {}

  async assertCanManage(projectId: string, userId: string, organizationId?: string) {
    const project = await this.projectModel!.findById(projectId).select('organization_id').lean().exec();
    if (!project || (organizationId && String(project.organization_id) !== organizationId)) {
      throw new ForbiddenException('You cannot manage this project workflow');
    }
    const user = await this.userModel!.findById(userId).select('role').lean().exec();
    if (user?.role === 'admin') return;
    const membership = await this.projectMemberModel!.findOne({
      project_id: projectId,
      user_id: userId,
      project_role: { $in: ['MANAGER', 'PROJECT_MANAGER', 'manager', 'project_manager'] },
    }).lean().exec();
    if (!membership) throw new ForbiddenException('You cannot manage this project workflow');
  }

  async assertCanAccess(projectId: string, userId: string, role: string, organizationId?: string) {
    const project = await this.projectModel!.findById(projectId).select('organization_id').lean().exec();
    if (!project || (organizationId && String(project.organization_id) !== organizationId)) {
      throw new ForbiddenException('You do not have access to this project workflow');
    }
    if (role === 'admin') return;
    const membership = await this.projectMemberModel!.findOne({
      project_id: projectId,
      user_id: userId,
      ...(role === 'manager' ? { project_role: { $in: ['MANAGER', 'PROJECT_MANAGER', 'manager', 'project_manager'] } } : {}),
    }).lean().exec();
    if (!membership) throw new ForbiddenException('You do not have access to this project workflow');
  }

  async createWorkflow(projectId: string, data: Partial<Workflow>) {
    const workflow = await this.workflowModel!.findOneAndUpdate(
      { project_id: projectId },
      { project_id: projectId, name: data.name ?? 'Default workflow', ...data },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
    const stages = await this.ensureStages(workflow._id);
    return { success: true, data: { ...workflow.toObject(), stages } };
  }

  async getWorkflow(projectId: string) {
    const workflow = await this.workflowModel!.findOne({ project_id: projectId }).exec();
    if (!workflow) return { success: true, data: null };
    const stages = await this.stageModel!.find({ workflow_id: workflow._id }).sort({ position: 1 }).exec();
    return { success: true, data: { ...workflow.toObject(), stages } };
  }

  async updateWorkflow(projectId: string, data: Partial<Workflow>) {
    const workflow = await this.workflowModel!.findOneAndUpdate(
      { project_id: projectId },
      data,
      { new: true },
    );
    return { success: true, data: workflow };
  }

  async createStage(projectId: string, data: { name: string; position: number }) {
    const workflow = await this.workflowModel!.findOneAndUpdate(
      { project_id: projectId },
      { $setOnInsert: { project_id: projectId, name: 'Default workflow' } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
    const stage = await this.stageModel!.create({
      workflow_id: workflow._id,
      name: data.name,
      position: data.position,
    });
    const stages = await this.ensureStages(workflow._id);
    return { success: true, data: { ...workflow.toObject(), stages } };
  }

  private async ensureStages(workflowId: Types.ObjectId) {
    const existingStages = await this.stageModel!
      .find({ workflow_id: workflowId })
      .sort({ position: 1 })
      .exec();
    if (existingStages.length) return existingStages;

    return this.stageModel!.insertMany(
      ['Backlog', 'Planning', 'In Progress', 'Review', 'Completed'].map(
        (name, position) => ({ workflow_id: workflowId, name, position }),
      ),
    );
  }

  async updateStage(stageId: string, data: Partial<WorkflowStage>) {
    const stage = await this.stageModel!.findByIdAndUpdate(stageId, data, { new: true }).exec();
    return { success: true, data: stage };
  }

  async deleteStage(stageId: string) {
    const stage = await this.stageModel!.findByIdAndDelete(stageId).exec();
    return { success: true, data: stage };
  }

  async reorderStages(projectId: string, stages: Array<{ id: string; position: number }>) {
    await Promise.all(
      stages.map((item) =>
        this.stageModel!.findByIdAndUpdate(item.id, { position: item.position }).exec(),
      ),
    );

    const workflow = await this.getWorkflow(projectId);
    return { success: true, data: workflow.data };
  }
}
