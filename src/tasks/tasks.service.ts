import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task } from './schemas/task.schema.js';
import { TaskDependency } from './schemas/task-dependency.schema.js';
import { Workflow } from '../workflows/schemas/workflow.schema.js';
import { WorkflowStage } from '../workflows/schemas/workflow-stage.schema.js';
import { Project } from '../projects/schemas/project.schema.js';
import {
  ActivityLog,
  ActivityAction,
  ActivityEntityType,
} from '../activity-logs/schemas/activity-logs.schema.js';
import { ProjectMember } from '../projects/schemas/project-member.schema.js';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) @Optional() private taskModel?: Model<Task>,
    @InjectModel(TaskDependency.name)
    @Optional()
    private depModel?: Model<TaskDependency>,
    @InjectModel(Workflow.name)
    @Optional()
    private workflowModel?: Model<Workflow>,
    @InjectModel(WorkflowStage.name)
    @Optional()
    private stageModel?: Model<WorkflowStage>,
    @InjectModel(Project.name)
    @Optional()
    private projectModel?: Model<Project>,
    @InjectModel(ActivityLog.name)
    @Optional()
    private activityModel?: Model<ActivityLog>,
    @InjectModel(ProjectMember.name)
    @Optional()
    private memberModel?: Model<ProjectMember>,
  ) {}

  async assertCanAccessProject(
    projectId: string,
    userId: string,
    role: string,
    orgId?: string,
  ) {
    const project = await this.projectModel!.findById(projectId)
      .select('organization_id')
      .lean();
    if (!project || (orgId && String(project.organization_id) !== orgId)) {
      throw new BadRequestException('You do not have access to this project');
    }
    if (role === 'admin' || role === 'manager') return;
    const member = await this.memberModel!.findOne({
      project_id: new Types.ObjectId(projectId),
      user_id: new Types.ObjectId(userId),
    }).lean();
    if (!member)
      throw new BadRequestException('You do not have access to this project');
  }

  async assertCanAccessTask(
    taskId: string,
    userId: string,
    role: string,
    orgId?: string,
  ) {
    const task = await this.taskModel!.findById(taskId)
      .select('project_id')
      .lean();
    if (!task) throw new BadRequestException('Task not found');
    await this.assertCanAccessProject(
      String(task.project_id),
      userId,
      role,
      orgId,
    );
  }

  async assertCanManageTask(
    taskId: string,
    userId: string,
    role: string,
    orgId?: string,
  ) {
    if (role === 'admin') return;
    const task = await this.taskModel!.findById(taskId)
      .select('project_id')
      .lean();
    if (!task) throw new BadRequestException('Task not found');
    await this.assertCanAccessProject(
      String(task.project_id),
      userId,
      role,
      orgId,
    );
    const member = await this.memberModel!.findOne({
      project_id: new Types.ObjectId(String(task.project_id)),
      user_id: new Types.ObjectId(userId),
      project_role: {
        $in: ['MANAGER', 'PROJECT_MANAGER', 'manager', 'project_manager'],
      },
    }).lean();
    if (!member)
      throw new BadRequestException('You cannot manage tasks in this project');
  }

  async createTask(projectId: string, data: Partial<Task>, actorId?: string) {
    let stageId = data.workflow_stage_id;
    if (!stageId) {
      let wf = await this.workflowModel!.findOne({ project_id: projectId });
      if (!wf) wf = await this.workflowModel!.create({ project_id: projectId });
      let stage = await this.stageModel!.findOne({ workflow_id: wf._id }).sort({
        position: 1,
      });
      if (!stage) {
        const stages = await this.stageModel!.insertMany(
          ['Backlog', 'Planning', 'In Progress', 'Review', 'Completed'].map(
            (name, i) => ({ workflow_id: wf!._id, name, position: i }),
          ),
        );
        stage = stages[0];
      }
      stageId = stage._id;
    }
    if (!stageId) throw new BadRequestException('Workflow stage required');
    const task = await this.taskModel!.create({
      project_id: projectId,
      ...data,
      workflow_stage_id: stageId,
    });
    this.logActivity(projectId, actorId, 'create', 'task', task._id, {
      title: task.title,
    });
    return { success: true, data: task };
  }

  async listTasks(projectId: string) {
    return {
      success: true,
      data: await this.taskModel!.find({ project_id: projectId }),
    };
  }

  async findTask(taskId: string) {
    return { success: true, data: await this.taskModel!.findById(taskId) };
  }

  async updateTask(taskId: string, data: Partial<Task>) {
    return {
      success: true,
      data: await this.taskModel!.findByIdAndUpdate(taskId, data, {
        new: true,
      }),
    };
  }

  async deleteTask(taskId: string) {
    return {
      success: true,
      data: await this.taskModel!.findByIdAndDelete(taskId),
    };
  }

  async updateAssignee(
    taskId: string,
    assigneeId: string | null,
    actorId?: string,
  ) {
    const task = await this.taskModel!.findByIdAndUpdate(
      taskId,
      { assignee_id: assigneeId },
      { new: true },
    );
    if (task)
      this.logActivity(
        String(task.project_id),
        actorId,
        'assigned',
        'task',
        task._id,
        { assigneeId },
      );
    return { success: true, data: task };
  }

  async updateStage(taskId: string, stageId: string) {
    return {
      success: true,
      data: await this.taskModel!.findByIdAndUpdate(
        taskId,
        { workflow_stage_id: stageId },
        { new: true },
      ),
    };
  }

  async listDependencies(taskId: string) {
    return {
      success: true,
      data: await this.depModel!.find({ task_id: taskId }),
    };
  }

  async createDependency(taskId: string, depTaskId: string) {
    if (taskId === depTaskId)
      throw new BadRequestException('Cannot depend on itself');
    if (
      await this.depModel!.findOne({
        task_id: taskId,
        depends_on_task_id: depTaskId,
      })
    ) {
      throw new BadRequestException('Dependency already exists');
    }
    if (await this.hasCycle(taskId, depTaskId))
      throw new BadRequestException('Would create circular dependency');
    return {
      success: true,
      data: await this.depModel!.create({
        task_id: taskId,
        depends_on_task_id: depTaskId,
      }),
    };
  }

  async removeDependency(taskId: string, depTaskId: string) {
    return {
      success: true,
      data: await this.depModel!.findOneAndDelete({
        task_id: taskId,
        depends_on_task_id: depTaskId,
      }),
    };
  }

  private async hasCycle(taskId: string, depTaskId: string): Promise<boolean> {
    const visited = new Set<string>();
    const queue = [depTaskId];
    while (queue.length) {
      const current = queue.shift()!;
      if (current === taskId) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      const deps = await this.depModel!.find({ task_id: current })
        .select('depends_on_task_id')
        .lean();
      deps.forEach((d) => queue.push(String(d.depends_on_task_id)));
    }
    return false;
  }

  private async logActivity(
    projectId: string,
    actorId: string | undefined,
    action: string,
    entityType: string,
    entityId: Types.ObjectId,
    details: Record<string, unknown>,
  ) {
    if (!actorId) return;
    const project = await this.projectModel!.findById(projectId)
      .select('organization_id')
      .lean();
    if (!project?.organization_id) return;
    await this.activityModel!.create({
      organization_id: project.organization_id,
      user_id: actorId,
      action: action as ActivityAction,
      entity_type: entityType as ActivityEntityType,
      entity_id: entityId,
      details,
    });
  }
}
