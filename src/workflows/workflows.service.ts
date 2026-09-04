import { ForbiddenException, Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Workflow } from './schemas/workflow.schema.js';
import { WorkflowStage } from './schemas/workflow-stage.schema.js';
import { ProjectMember } from '../projects/schemas/project-member.schema.js';
import { User } from '../users/schemas/user.schema.js';
import { Project } from '../projects/schemas/project.schema.js';
import { ActivityLogsService } from '../activity-logs/activity-logs.service.js';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectModel(Workflow.name) @Optional() private wfModel?: Model<Workflow>,
    @InjectModel(WorkflowStage.name)
    @Optional()
    private stageModel?: Model<WorkflowStage>,
    @InjectModel(ProjectMember.name)
    @Optional()
    private memberModel?: Model<ProjectMember>,
    @InjectModel(User.name) @Optional() private userModel?: Model<User>,
    @InjectModel(Project.name)
    @Optional()
    private projectModel?: Model<Project>,
    private activity?: ActivityLogsService,
  ) {}

  private async assertAccess(
    projectId: string,
    userId: string,
    role: string,
    orgId?: string,
    manageOnly = false,
  ) {
    const project = await this.projectModel!.findById(projectId)
      .select('organization_id')
      .lean();
    if (!project || (orgId && String(project.organization_id) !== orgId))
      throw new ForbiddenException('Access denied');
    if (role === 'admin') return;
    if (!manageOnly && role === 'manager') return;
    const member = await this.memberModel!.findOne({
      project_id: new Types.ObjectId(projectId),
      user_id: new Types.ObjectId(userId),
      ...(!manageOnly
        ? {}
        : {
            project_role: {
              $in: ['MANAGER', 'PROJECT_MANAGER', 'manager', 'project_manager'],
            },
          }),
    }).lean();
    if (!member) throw new ForbiddenException('Access denied');
  }

  async assertCanManage(projectId: string, userId: string, orgId?: string) {
    const user = await this.userModel!.findById(userId).select('role').lean();
    if (user?.role === 'admin') return;
    await this.assertAccess(projectId, userId, 'member', orgId, true);
  }

  async assertCanAccess(
    projectId: string,
    userId: string,
    role: string,
    orgId?: string,
  ) {
    await this.assertAccess(projectId, userId, role, orgId);
  }

  async createWorkflow(
    projectId: string,
    data: Partial<Workflow>,
    userId?: string,
    orgId?: string,
  ) {
    const wf = await this.wfModel!.findOneAndUpdate(
      { project_id: projectId },
      { project_id: projectId, name: data.name ?? 'Default workflow', ...data },
      { upsert: true, new: true },
    );
    const stages = await this.ensureStages(wf._id);
    if (userId && orgId) {
      const project = await this.projectModel!.findById(projectId)
        .select('name')
        .lean();
      this.activity?.logActivity({
        organizationId: orgId,
        userId,
        action: 'create',
        entityType: 'workflow',
        entityId: wf._id,
        details: {
          title: data.name ?? 'Default workflow',
          projectName: project?.name,
        },
      });
    }
    return { success: true, data: { ...wf.toObject(), stages } };
  }

  async getWorkflow(projectId: string) {
    const wf = await this.wfModel!.findOne({ project_id: projectId });
    if (!wf) return { success: true, data: null };
    const stages = await this.stageModel!.find({ workflow_id: wf._id }).sort({
      position: 1,
    });
    return { success: true, data: { ...wf.toObject(), stages } };
  }

  async updateWorkflow(projectId: string, data: Partial<Workflow>) {
    return {
      success: true,
      data: await this.wfModel!.findOneAndUpdate(
        { project_id: projectId },
        data,
        { new: true },
      ),
    };
  }

  async createStage(
    projectId: string,
    data: { name: string; position: number },
  ) {
    const wf = await this.wfModel!.findOneAndUpdate(
      { project_id: projectId },
      { $setOnInsert: { project_id: projectId, name: 'Default workflow' } },
      { upsert: true, new: true },
    );
    await this.stageModel!.create({
      workflow_id: wf._id,
      name: data.name,
      position: data.position,
    });
    const stages = await this.ensureStages(wf._id);
    return { success: true, data: { ...wf.toObject(), stages } };
  }

  private async ensureStages(workflowId: Types.ObjectId) {
    const existing = await this.stageModel!.find({
      workflow_id: workflowId,
    }).sort({ position: 1 });
    if (existing.length) return existing;
    return this.stageModel!.insertMany(
      ['Backlog', 'Planning', 'In Progress', 'Review', 'Completed'].map(
        (name, i) => ({ workflow_id: workflowId, name, position: i }),
      ),
    );
  }

  async updateStage(stageId: string, data: Partial<WorkflowStage>) {
    return {
      success: true,
      data: await this.stageModel!.findByIdAndUpdate(stageId, data, {
        new: true,
      }),
    };
  }

  async deleteStage(stageId: string) {
    return {
      success: true,
      data: await this.stageModel!.findByIdAndDelete(stageId),
    };
  }

  async reorderStages(
    projectId: string,
    stages: Array<{ id: string; position: number }>,
  ) {
    await Promise.all(
      stages.map((s) =>
        this.stageModel!.findByIdAndUpdate(s.id, { position: s.position }),
      ),
    );
    return this.getWorkflow(projectId);
  }
}
