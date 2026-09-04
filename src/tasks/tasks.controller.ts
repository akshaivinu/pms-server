import {
  Body,
  Controller,
  Delete,
  Get,
  Optional,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/role.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/enums/users.enum.js';
import { type Request } from 'express';

@Controller()
export class TasksController {
  constructor(@Optional() private readonly tasksService?: TasksService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER)
  @Post('projects/:projectId/tasks')
  async createTask(
    @Param('projectId') projectId: string,
    @Body() data: Record<string, any>,
    @Req() request: Request,
  ) {
    await this.tasksService!.assertCanAccessProject(projectId, (request as any).user?.userId, (request as any).user?.role, (request as any).user?.organization_id);
    return this.tasksService!.createTask(projectId, data, (request as any).user?.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('projects/:projectId/tasks')
  async listTasks(@Param('projectId') projectId: string, @Req() request: Request) {
    await this.tasksService!.assertCanAccessProject(projectId, (request as any).user?.userId, (request as any).user?.role, (request as any).user?.organization_id);
    return this.tasksService!.listTasks(projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tasks/:taskId')
  async getTask(@Param('taskId') taskId: string, @Req() request: Request) {
    const task = await this.tasksService!.findTask(taskId);
    const taskData = task.data as any;
    if (!taskData) return task;
    await this.tasksService!.assertCanAccessProject(String(taskData.project_id), (request as any).user?.userId, (request as any).user?.role, (request as any).user?.organization_id);
    return this.tasksService!.findTask(taskId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch('tasks/:taskId')
  async updateTask(@Param('taskId') taskId: string, @Body() data: Record<string, any>, @Req() request: Request) {
    await this.tasksService!.assertCanManageTask(taskId, (request as any).user?.userId, (request as any).user?.role);
    return this.tasksService!.updateTask(taskId, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete('tasks/:taskId')
  async deleteTask(@Param('taskId') taskId: string, @Req() request: Request) {
    await this.tasksService!.assertCanManageTask(taskId, (request as any).user?.userId, (request as any).user?.role);
    return this.tasksService!.deleteTask(taskId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER)
  @Patch('tasks/:taskId/assignee')
  async updateAssignee(
    @Param('taskId') taskId: string,
    @Body() body: { assigneeId?: string | null },
    @Req() request: Request,
  ) {
    return this.tasksService!.updateAssignee(taskId, body.assigneeId ?? null, (request as any).user?.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER)
  @Patch('tasks/:taskId/stage')
  async updateStage(
    @Param('taskId') taskId: string,
    @Body() body: { workflowStageId: string },
  ) {
    return this.tasksService!.updateStage(taskId, body.workflowStageId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER)
  @Patch('tasks/:taskId/priority')
  async updatePriority(
    @Param('taskId') taskId: string,
    @Body() body: { priority: string },
  ) {
    return this.tasksService!.updatePriority(taskId, body.priority);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER)
  @Patch('tasks/:taskId/due-date')
  async updateDueDate(
    @Param('taskId') taskId: string,
    @Body() body: { dueDate: string | null },
  ) {
    return this.tasksService!.updateDueDate(taskId, body.dueDate ? new Date(body.dueDate) : null);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tasks/:taskId/dependencies')
  async listDependencies(@Param('taskId') taskId: string) {
    return this.tasksService!.listDependencies(taskId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER)
  @Post('tasks/:taskId/dependencies')
  async createDependency(
    @Param('taskId') taskId: string,
    @Body() body: { dependsOnTaskId: string },
  ) {
    return this.tasksService!.createDependency(taskId, body.dependsOnTaskId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete('tasks/:taskId/dependencies/:dependencyTaskId')
  async removeDependency(
    @Param('taskId') taskId: string,
    @Param('dependencyTaskId') dependencyTaskId: string,
  ) {
    return this.tasksService!.removeDependency(taskId, dependencyTaskId);
  }
}
