import { Controller, Post, Body, HttpCode, UseGuards, Req } from '@nestjs/common';
import { OrganizationsService } from './organizations.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/enums/users.enum.js';
import { RolesGuard } from '../auth/guards/role.guard.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Organization } from './schema/organization.schema.js';
import { type Request } from 'express';

@Controller('organizations')
export class OrganizationsController {

  constructor(private readonly organizationsService: OrganizationsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post() 
  @HttpCode(201)
  createOrganization(@Body() data: Organization, @Req() req: Request) {
    this.organizationsService.createOrganization(data, req)
    return { message: 'Organization created successfully' }
  }
  
}
