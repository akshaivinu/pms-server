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
import { WorkflowsService } from './workflows.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/role.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/enums/users.enum.js';

@Controller('projects')
export class WorkflowsController {
  constructor(@Optional() private readonly workflowsService?: WorkflowsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post(':projectId/workflow')
  async createWorkflow(
    @Param('projectId') projectId: string,
    @Body() data: Record<string, unknown>,
  ) {
    return this.workflowsService!.createWorkflow(projectId, data);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':projectId/workflow')
  async getWorkflow(@Param('projectId') projectId: string) {
    return this.workflowsService!.getWorkflow(projectId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':projectId/workflow')
  async updateWorkflow(
    @Param('projectId') projectId: string,
    @Body() data: Record<string, unknown>,
  ) {
    return this.workflowsService!.updateWorkflow(projectId, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post(':projectId/workflow/stages')
  async createStage(
    @Param('projectId') projectId: string,
    @Body() data: { name: string; position: number },
  ) {
    return this.workflowsService!.createStage(projectId, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':projectId/workflow/stages/:stageId')
  async updateStage(
    @Param('stageId') stageId: string,
    @Body() data: Record<string, unknown>,
  ) {
    return this.workflowsService!.updateStage(stageId, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete(':projectId/workflow/stages/:stageId')
  async deleteStage(@Param('stageId') stageId: string) {
    return this.workflowsService!.deleteStage(stageId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':projectId/workflow/stages/reorder')
  async reorderStages(
    @Param('projectId') projectId: string,
    @Body() body: Array<{ id: string; position: number }>,
  ) {
    return this.workflowsService!.reorderStages(projectId, body);
  }
}
