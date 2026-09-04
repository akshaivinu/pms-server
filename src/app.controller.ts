import {
  BadRequestException,
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { type Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppService } from './app.service.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { ActivityLogsService } from './activity-logs/activity-logs.service.js';
import { Task } from './tasks/schemas/task.schema.js';
import { Project } from './projects/schemas/project.schema.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly activityLogsService: ActivityLogsService,
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  async getDashboard(@Req() request: Request) {
    const organizationId = (request as any).user?.organization_id;
    if (!organizationId) {
      throw new BadRequestException('User does not belong to an organization');
    }
    const orgProjects = await this.projectModel
      .find({ organization_id: new Types.ObjectId(organizationId) })
      .select('_id')
      .lean()
      .exec();
    const projectIds = orgProjects.map((p) => p._id);
    const totalTasks = await this.taskModel
      .countDocuments({ project_id: { $in: projectIds } })
      .exec();
    const completedTasks = await this.taskModel
      .countDocuments({
        project_id: { $in: projectIds },
        workflow_stage_id: { $exists: true },
      })
      .exec();
    const overdueTasks = await this.taskModel
      .countDocuments({
        project_id: { $in: projectIds },
        due_date: { $lt: new Date(), $ne: null },
      })
      .exec();
    return {
      success: true,
      summary: { totalTasks, completedTasks, overdueTasks },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/task-summary')
  async getTaskSummary(@Req() request: Request) {
    const organizationId = (request as any).user?.organization_id;
    if (!organizationId) {
      throw new BadRequestException('User does not belong to an organization');
    }
    const orgProjects = await this.projectModel
      .find({ organization_id: new Types.ObjectId(organizationId) })
      .select('_id')
      .lean()
      .exec();
    const projectIds = orgProjects.map((p) => p._id);
    const totalTasks = await this.taskModel
      .countDocuments({ project_id: { $in: projectIds } })
      .exec();
    const overdueTasks = await this.taskModel
      .countDocuments({
        project_id: { $in: projectIds },
        due_date: { $lt: new Date(), $ne: null },
      })
      .exec();
    return {
      success: true,
      data: { totalTasks, completedTasks: 0, overdueTasks },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/overdue-tasks')
  async getOverdueTasks(@Req() request: Request) {
    const organizationId = (request as any).user?.organization_id;
    if (!organizationId) {
      throw new BadRequestException('User does not belong to an organization');
    }
    const orgProjects = await this.projectModel
      .find({ organization_id: new Types.ObjectId(organizationId) })
      .select('_id')
      .lean()
      .exec();
    const projectIds = orgProjects.map((p) => p._id);
    const tasks = await this.taskModel
      .find({
        project_id: { $in: projectIds },
        due_date: { $lt: new Date(), $ne: null },
      })
      .sort({ due_date: 1 })
      .lean()
      .exec();
    return { success: true, data: tasks };
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/workload')
  getWorkload() {
    return { success: true, data: [] };
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/recent-activity')
  getRecentActivity(@Req() request: Request) {
    const organizationId = (request as any).user?.organization_id;
    if (!organizationId) {
      throw new BadRequestException('User does not belong to an organization');
    }
    return this.activityLogsService.getRecentActivity(String(organizationId));
  }

  @UseGuards(JwtAuthGuard)
  @Get('projects/:projectId/dashboard')
  getProjectDashboard() {
    return {
      success: true,
      data: {
        projectId: null,
        summary: {
          totalTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
        },
      },
    };
  }
}
