import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
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
    private readonly projectsService: ProjectsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createProject(
    @Body() data: {
      name: string;
      description: string;
    },
    @Req() request: Request,
  ) {
    // @ts-ignore
    const organizationId = request.user?.organization_id;
    
    if (!organizationId) {
      throw new BadRequestException(
        'User does not belong to an organization',
      );
    }
    // @ts-ignore
    const organizationObjectId = new Types.ObjectId(request.user?.organization_id);
    
    return this.projectsService.create(
      data.name,
      data.description,
      organizationObjectId,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getProject(
    @Param('id') projectId: string,
    @Req() request: Request,
  ) {
    // @ts-ignore
    const organizationId = request.user?.organization_id;
    
    if (!organizationId) {
      throw new BadRequestException(
        'User does not belong to an organization',
      );
    }
    // @ts-ignore
    const organizationObjectId = new Types.ObjectId(request.user?.organization_id);
  
    return this.projectsService.findOne(
      projectId,
      organizationId,
    );
  }
  
}