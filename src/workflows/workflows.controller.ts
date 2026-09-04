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
import { WorkflowsService } from './workflows.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/role.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/enums/users.enum.js';
import { type Request } from 'express';

@Controller('projects')
export class WorkflowsController {
  constructor(
    @Optional() private readonly workflowsService?: WorkflowsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post(':projectId/workflow')
  async createWorkflow(
    @Param('projectId') projectId: string,
    @Body() data: Record<string, unknown>,
    @Req() request: Request,
  ) {
    const user = (request as any).user;
    await this.workflowsService!.assertCanManage(
      projectId,
      user?.userId,
      user?.organization_id,
    );
    return this.workflowsService!.createWorkflow(
      projectId,
      data,
      user?.userId,
      user?.organization_id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':projectId/workflow')
  async getWorkflow(
    @Param('projectId') projectId: string,
    @Req() request: Request,
  ) {
    await this.workflowsService!.assertCanAccess(
      projectId,
      (request as any).user?.userId,
      (request as any).user?.role,
      (request as any).user?.organization_id,
    );
    return this.workflowsService!.getWorkflow(projectId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':projectId/workflow')
  async updateWorkflow(
    @Param('projectId') projectId: string,
    @Body() data: Record<string, unknown>,
    @Req() request: Request,
  ) {
    await this.workflowsService!.assertCanManage(
      projectId,
      (request as any).user?.userId,
      (request as any).user?.organization_id,
    );
    return this.workflowsService!.updateWorkflow(projectId, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post(':projectId/workflow/stages')
  async createStage(
    @Param('projectId') projectId: string,
    @Body() data: { name: string; position: number },
    @Req() request: Request,
  ) {
    await this.workflowsService!.assertCanManage(
      projectId,
      (request as any).user?.userId,
      (request as any).user?.organization_id,
    );
    return this.workflowsService!.createStage(projectId, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':projectId/workflow/stages/:stageId')
  async updateStage(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Body() data: Record<string, unknown>,
    @Req() request: Request,
  ) {
    await this.workflowsService!.assertCanManage(
      projectId,
      (request as any).user?.userId,
      (request as any).user?.organization_id,
    );
    return this.workflowsService!.updateStage(stageId, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete(':projectId/workflow/stages/:stageId')
  async deleteStage(
    @Param('projectId') projectId: string,
    @Param('stageId') stageId: string,
    @Req() request: Request,
  ) {
    await this.workflowsService!.assertCanManage(
      projectId,
      (request as any).user?.userId,
      (request as any).user?.organization_id,
    );
    return this.workflowsService!.deleteStage(stageId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':projectId/workflow/stages/reorder')
  async reorderStages(
    @Param('projectId') projectId: string,
    @Body() body: Array<{ id: string; position: number }>,
    @Req() request: Request,
  ) {
    await this.workflowsService!.assertCanManage(
      projectId,
      (request as any).user?.userId,
      (request as any).user?.organization_id,
    );
    return this.workflowsService!.reorderStages(projectId, body);
  }
}
