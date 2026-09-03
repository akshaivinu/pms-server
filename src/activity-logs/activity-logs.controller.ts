import { Controller, Get, Optional, Param, UseGuards } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller()
export class ActivityLogsController {
  constructor(@Optional() private readonly activityLogsService?: ActivityLogsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('organizations/:organizationId/activity')
  async getOrganizationActivity(@Param('organizationId') organizationId: string) {
    return this.activityLogsService!.getOrganizationActivity(organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('projects/:projectId/activity')
  async getProjectActivity(@Param('projectId') projectId: string) {
    return this.activityLogsService!.getProjectActivity(projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tasks/:taskId/activity')
  async getTaskActivity(@Param('taskId') taskId: string) {
    return this.activityLogsService!.getTaskActivity(taskId);
  }
}
