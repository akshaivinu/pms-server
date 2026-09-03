import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from './schemas/task.schema.js';
import { TaskDependency } from './schemas/task-dependency.schema.js';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) @Optional() private readonly taskModel?: Model<Task>,
    @InjectModel(TaskDependency.name) @Optional() private readonly taskDependencyModel?: Model<TaskDependency>,
  ) {}

  async createTask(projectId: string, data: Partial<Task>) {
    const task = await this.taskModel!.create({ project_id: projectId, ...data });
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

  async updateAssignee(taskId: string, assigneeId: string | null) {
    const task = await this.taskModel!.findByIdAndUpdate(taskId, { assignee_id: assigneeId }, { new: true }).exec();
    return { success: true, data: task };
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
