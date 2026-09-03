import {
  BadRequestException,
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
import { ProjectsService } from './projects.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/role.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/enums/users.enum.js';
import { Types } from 'mongoose';

@Controller('projects')
export class ProjectsController {
  constructor(
    @Optional() private readonly projectsService?: ProjectsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createProject(
    @Body() data: { name: string; description: string },
    @Req() request: Request,
  ) {
    const organizationId = (request as any).user?.organization_id;

    if (!organizationId) {
      throw new BadRequestException('User does not belong to an organization');
    }

    return this.projectsService!.create(
      data.name,
      data.description,
      new Types.ObjectId(organizationId),
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async listProjects(@Req() request: Request) {
    const organizationId = (request as any).user?.organization_id;
    return this.projectsService!.findAll(organizationId);
  }

  @Get(':projectId')
  @UseGuards(JwtAuthGuard)
  async getProject(
    @Param('projectId') projectId: string,
    @Req() request: Request,
  ) {
    const organizationId = (request as any).user?.organization_id;
    if (!organizationId) {
      throw new BadRequestException('User does not belong to an organization');
    }

    return this.projectsService!.findOne(projectId, organizationId);
  }

  @Patch(':projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateProject(
    @Param('projectId') projectId: string,
    @Body() data: Record<string, unknown>,
  ) {
    return this.projectsService!.update(projectId, data);
  }

  @Delete(':projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async deleteProject(@Param('projectId') projectId: string) {
    return this.projectsService!.remove(projectId);
  }

  @Post(':projectId/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async archiveProject(@Param('projectId') projectId: string) {
    return this.projectsService!.archive(projectId);
  }

  @Get(':projectId/members')
  @UseGuards(JwtAuthGuard)
  async listProjectMembers(@Param('projectId') projectId: string) {
    return this.projectsService!.listMembers(projectId);
  }

  @Post(':projectId/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async addProjectMember(
    @Param('projectId') projectId: string,
    @Body() body: { userId: string; projectRole?: string },
  ) {
    return this.projectsService!.addMember(projectId, body.userId, body.projectRole);
  }

  @Patch(':projectId/members/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateProjectMember(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Body() body: { projectRole: string },
  ) {
    return this.projectsService!.updateMember(projectId, userId, body.projectRole);
  }

  @Delete(':projectId/members/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async removeProjectMember(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ) {
    return this.projectsService!.removeMember(projectId, userId);
  }
}