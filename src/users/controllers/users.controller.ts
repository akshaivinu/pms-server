import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Optional,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../services/users.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/role.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../enums/users.enum.js';
import { type Request } from 'express';
import { ForbiddenException } from '@nestjs/common';

@Controller('organizations')
export class UsersController {
  constructor(@Optional() private readonly usersService?: UsersService) {}

  private assertOrganization(organizationId: string, request: Request) {
    if ((request as any).user?.organization_id !== organizationId) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':organizationId/users')
  async listUsers(
    @Param('organizationId') organizationId: string,
    @Req() request: Request,
  ) {
    this.assertOrganization(organizationId, request);
    return this.usersService!.listUsers(organizationId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':organizationId/users/:userId')
  async getUser(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
    @Req() request: Request,
  ) {
    this.assertOrganization(organizationId, request);
    return this.usersService!.findOne(organizationId, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':organizationId/users/:userId')
  async updateUser(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
    @Body() data: Record<string, unknown>,
    @Req() request: Request,
  ) {
    this.assertOrganization(organizationId, request);
    return this.usersService!.update(organizationId, userId, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':organizationId/users/:userId/role')
  async updateUserRole(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
    @Body() body: { role: UserRole },
    @Req() request: Request,
  ) {
    this.assertOrganization(organizationId, request);
    return this.usersService!.updateRole(organizationId, userId, body.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':organizationId/users/:userId')
  @HttpCode(200)
  async deleteUser(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    this.assertOrganization(organizationId, req);
    return this.usersService!.remove(organizationId, userId, (req as any).user);
  }
}

export { UsersController as ControllersController };
