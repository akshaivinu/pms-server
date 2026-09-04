import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  getDashboard() {
    return {
      success: true,
      summary: {
        totalTasks: 0,
        overdueTasks: 0,
        completedTasks: 0,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/task-summary')
  getTaskSummary() {
    return { success: true, data: { totalTasks: 0, completedTasks: 0 } };
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/overdue-tasks')
  getOverdueTasks() {
    return { success: true, data: [] };
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/workload')
  getWorkload() {
    return { success: true, data: [] };
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/recent-activity')
  getRecentActivity() {
    return { success: true, data: [] };
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
