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
import { type Request } from 'express';
import { LabelsService } from './labels.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/role.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/enums/users.enum.js';

@Controller()
export class LabelsController {
  constructor(@Optional() private readonly labelsService?: LabelsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('labels')
  async createLabel(@Req() req: Request, @Body() body: { name: string }) {
    const organizationId = (req as any).user?.organization_id;
    return this.labelsService!.createLabel(organizationId, body.name);
  }

  @UseGuards(JwtAuthGuard)
  @Get('labels')
  async listLabels(@Req() req: Request) {
    const organizationId = (req as any).user?.organization_id;
    return this.labelsService!.listLabels(organizationId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch('labels/:labelId')
  async updateLabel(@Param('labelId') labelId: string, @Body() body: Partial<{ name: string }>) {
    return this.labelsService!.updateLabel(labelId, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete('labels/:labelId')
  async deleteLabel(@Param('labelId') labelId: string) {
    return this.labelsService!.deleteLabel(labelId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('tasks/:taskId/labels')
  async assignLabelToTask(
    @Param('taskId') taskId: string,
    @Body() body: { labelId: string },
  ) {
    return this.labelsService!.assignLabel(taskId, body.labelId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('tasks/:taskId/labels/:labelId')
  async removeLabelFromTask(
    @Param('taskId') taskId: string,
    @Param('labelId') labelId: string,
  ) {
    return this.labelsService!.removeLabel(taskId, labelId);
  }
}
