import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

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

  @Get('dashboard/task-summary')
  getTaskSummary() {
    return { success: true, data: { totalTasks: 0, completedTasks: 0 } };
  }

  @Get('dashboard/overdue-tasks')
  getOverdueTasks() {
    return { success: true, data: [] };
  }

  @Get('dashboard/workload')
  getWorkload() {
    return { success: true, data: [] };
  }

  @Get('dashboard/recent-activity')
  getRecentActivity() {
    return { success: true, data: [] };
  }

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
