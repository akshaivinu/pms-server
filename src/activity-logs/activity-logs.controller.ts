import {
  Controller,
  Get,
  Optional,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { type Request } from 'express';
import { ActivityLogsService } from './activity-logs.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller()
export class ActivityLogsController {
  constructor(
    @Optional() private readonly activityLogsService?: ActivityLogsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('organizations/:organizationId/activity')
  async getOrganizationActivity(
    @Param('organizationId') organizationId: string,
    @Req() request: Request,
  ) {
    await this.activityLogsService!.assertOrgMatches(
      organizationId,
      (request as any).user?.organization_id,
    );
    return this.activityLogsService!.getOrganizationActivity(organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('projects/:projectId/activity')
  async getProjectActivity(
    @Param('projectId') projectId: string,
    @Req() request: Request,
  ) {
    await this.activityLogsService!.assertProjectOrg(
      projectId,
      (request as any).user?.organization_id,
    );
    return this.activityLogsService!.getProjectActivity(projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tasks/:taskId/activity')
  async getTaskActivity(
    @Param('taskId') taskId: string,
    @Req() request: Request,
  ) {
    await this.activityLogsService!.assertTaskOrg(
      taskId,
      (request as any).user?.organization_id,
    );
    return this.activityLogsService!.getTaskActivity(taskId);
  }
}
