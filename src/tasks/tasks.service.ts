import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from './schemas/task.schema.js';
import { TaskDependency } from './schemas/task-dependency.schema.js';
import { Workflow } from '../workflows/schemas/workflow.schema.js';
import { WorkflowStage } from '../workflows/schemas/workflow-stage.schema.js';
import { Project } from '../projects/schemas/project.schema.js';
import { ActivityLog } from '../activity-logs/schemas/activity-logs.schema.js';
import { ActivityAction, ActivityEntityType } from '../activity-logs/schemas/activity-logs.schema.js';
import { ProjectMember } from '../projects/schemas/project-member.schema.js';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) @Optional() private readonly taskModel?: Model<Task>,
    @InjectModel(TaskDependency.name) @Optional() private readonly taskDependencyModel?: Model<TaskDependency>,
    @InjectModel(Workflow.name) @Optional() private readonly workflowModel?: Model<Workflow>,
    @InjectModel(WorkflowStage.name) @Optional() private readonly workflowStageModel?: Model<WorkflowStage>,
    @InjectModel(Project.name) @Optional() private readonly projectModel?: Model<Project>,
    @InjectModel(ActivityLog.name) @Optional() private readonly activityLogModel?: Model<ActivityLog>,
    @InjectModel(ProjectMember.name) @Optional() private readonly projectMemberModel?: Model<ProjectMember>,
  ) {}

  async assertCanManageTask(taskId: string, userId: string, role: string) {
    if (role === 'admin') return;
    const task = await this.taskModel!.findById(taskId).select('project_id').lean().exec();
    const membership = task && await this.projectMemberModel!.findOne({
      project_id: task.project_id,
      user_id: userId,
      project_role: { $in: ['MANAGER', 'PROJECT_MANAGER', 'manager', 'project_manager'] },
    }).lean().exec();
    if (!membership) throw new BadRequestException('You cannot manage tasks in this project');
  }

  async assertCanAccessProject(projectId: string, userId: string, role: string, organizationId?: string) {
    const project = await this.projectModel!.findById(projectId).select('organization_id').lean().exec();
    if (!project || (organizationId && String(project.organization_id) !== organizationId)) {
      throw new BadRequestException('You do not have access to this project');
    }
    if (role === 'admin') return;
    const membership = await this.projectMemberModel!.findOne({
      project_id: projectId,
      user_id: userId,
      ...(role === 'manager' ? { project_role: { $in: ['MANAGER', 'PROJECT_MANAGER', 'manager', 'project_manager'] } } : {}),
    }).lean().exec();
    if (!membership) throw new BadRequestException('You do not have access to this project');
  }

  async createTask(projectId: string, data: Partial<Task>, actorId?: string) {
    let workflowStageId = data.workflow_stage_id;
    if (!workflowStageId) {
      let workflow = await this.workflowModel!.findOne({ project_id: projectId }).exec();
      if (!workflow) {
        workflow = await this.workflowModel!.create({ project_id: projectId });
      }

      let firstStage = await this.workflowStageModel!
        .findOne({ workflow_id: workflow._id })
        .sort({ position: 1 })
        .exec();
      if (!firstStage) {
        const defaultStages = await this.workflowStageModel!.insertMany(
          ['Backlog', 'Planning', 'In Progress', 'Review', 'Completed'].map(
            (name, position) => ({ workflow_id: workflow!._id, name, position }),
          ),
        );
        firstStage = defaultStages[0];
      }
      workflowStageId = firstStage._id;
    }

    if (!workflowStageId) {
      throw new BadRequestException('A workflow stage is required to create a task');
    }

    const task = await this.taskModel!.create({
      project_id: projectId,
      ...data,
      workflow_stage_id: workflowStageId,
    });
    await this.recordActivity(projectId, actorId, ActivityAction.CREATE, ActivityEntityType.TASK, task._id, { title: task.title });
    return { success: true, data: task };
  }

  async listTasks(projectId: string) {
    const tasks = await this.taskModel!.find({ project_id: projectId }).exec();
    return { success: true, data: tasks };
  }

  async findTask(taskId: string) {
    const task = await this.taskModel!.findById(taskId).exec();
    return { success: true, data: task };
  }

  async updateTask(taskId: string, data: Partial<Task>) {
    const task = await this.taskModel!.findByIdAndUpdate(taskId, data, { new: true }).exec();
    return { success: true, data: task };
  }

  async deleteTask(taskId: string) {
    const task = await this.taskModel!.findByIdAndDelete(taskId).exec();
    return { success: true, data: task };
  }

  async updateAssignee(taskId: string, assigneeId: string | null, actorId?: string) {
    const task = await this.taskModel!.findByIdAndUpdate(taskId, { assignee_id: assigneeId }, { new: true }).exec();
    if (task) await this.recordActivity(String(task.project_id), actorId, ActivityAction.ASSIGNED, ActivityEntityType.TASK, task._id, { assigneeId });
    return { success: true, data: task };
  }

  private async recordActivity(projectId: string, actorId: string | undefined, action: ActivityAction, entityType: ActivityEntityType, entityId: Types.ObjectId, details: Record<string, unknown>) {
    if (!actorId) return;
    const project = await this.projectModel!.findById(projectId).select('organization_id').lean().exec();
    if (!project?.organization_id) return;
    await this.activityLogModel!.create({
      organization_id: project.organization_id,
      user_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
    });
  }

  async updateStage(taskId: string, workflowStageId: string) {
    const task = await this.taskModel!.findByIdAndUpdate(taskId, { workflow_stage_id: workflowStageId }, { new: true }).exec();
    return { success: true, data: task };
  }

  async updatePriority(taskId: string, priority: string) {
    const task = await this.taskModel!.findByIdAndUpdate(taskId, { priority }, { new: true }).exec();
    return { success: true, data: task };
  }

  async updateDueDate(taskId: string, dueDate: Date | null) {
    const task = await this.taskModel!.findByIdAndUpdate(taskId, { due_date: dueDate }, { new: true }).exec();
    return { success: true, data: task };
  }

  async listDependencies(taskId: string) {
    const dependencies = await this.taskDependencyModel!.find({ task_id: taskId }).exec();
    return { success: true, data: dependencies };
  }

  async createDependency(taskId: string, dependencyTaskId: string) {
    const dependency = await this.taskDependencyModel!.create({
      task_id: taskId,
      depends_on_task_id: dependencyTaskId,
    });
    return { success: true, data: dependency };
  }

  async removeDependency(taskId: string, dependencyTaskId: string) {
    const dependency = await this.taskDependencyModel!.findOneAndDelete({ task_id: taskId, depends_on_task_id: dependencyTaskId }).exec();
    return { success: true, data: dependency };
  }
}
