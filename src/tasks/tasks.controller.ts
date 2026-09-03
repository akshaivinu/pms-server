import {
  Body,
  Controller,
  Delete,
  Get,
  Optional,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/role.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/enums/users.enum.js';

@Controller()
export class TasksController {
  constructor(@Optional() private readonly tasksService?: TasksService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER)
  @Post('projects/:projectId/tasks')
  async createTask(
    @Param('projectId') projectId: string,
    @Body() data: Record<string, any>,
  ) {
    return this.tasksService!.createTask(projectId, data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('projects/:projectId/tasks')
  async listTasks(@Param('projectId') projectId: string) {
    return this.tasksService!.listTasks(projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tasks/:taskId')
  async getTask(@Param('taskId') taskId: string) {
    return this.tasksService!.findTask(taskId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch('tasks/:taskId')
  async updateTask(@Param('taskId') taskId: string, @Body() data: Record<string, any>) {
    return this.tasksService!.updateTask(taskId, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete('tasks/:taskId')
  async deleteTask(@Param('taskId') taskId: string) {
    return this.tasksService!.deleteTask(taskId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER)
  @Patch('tasks/:taskId/assignee')
  async updateAssignee(
    @Param('taskId') taskId: string,
    @Body() body: { assigneeId?: string | null },
  ) {
    return this.tasksService!.updateAssignee(taskId, body.assigneeId ?? null);
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
