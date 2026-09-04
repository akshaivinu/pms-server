import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Optional,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/enums/users.enum.js';
import { RolesGuard } from '../auth/guards/role.guard.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Organization } from './schema/organization.schema.js';
import { type Request } from 'express';

@Controller('organizations')
export class OrganizationsController {
  constructor(
    @Optional() private readonly organizationsService?: OrganizationsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @HttpCode(201)
  async createOrganization(@Body() data: Organization, @Req() req: Request) {
    const organization = await this.organizationsService!.createOrganization(
      data,
      req,
    );
    return {
      success: true,
      message: 'Organization created successfully',
      data: organization,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':organizationId')
  async getOrganization(
    @Param('organizationId') organizationId: string,
    @Req() req: Request,
  ) {
    if ((req as any).user?.organization_id !== organizationId) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }
    return this.organizationsService!.findOne(organizationId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':organizationId')
  async updateOrganization(
    @Param('organizationId') organizationId: string,
    @Body() data: Partial<Organization>,
    @Req() req: Request,
  ) {
    if ((req as any).user?.organization_id !== organizationId) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }
    return this.organizationsService!.update(organizationId, data);
  }
}
