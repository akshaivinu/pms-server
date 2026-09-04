import {
  Body,
  Controller,
  Delete,
  Get,
  Optional,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { type Request } from 'express';
import { AttachmentsService } from './attachments.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/role.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/enums/users.enum.js';
import { Attachment, AttachmentType } from './schemas/attachment.schema.js';

@Controller()
export class AttachmentsController {
  constructor(
    @Optional() private readonly attachmentsService?: AttachmentsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('tasks/:taskId/attachments')
  async list(@Param('taskId') taskId: string, @Req() request: Request) {
    await this.attachmentsService!.assertCanAccess(
      taskId,
      (request as any).user?.userId,
      (request as any).user?.role,
      (request as any).user?.organization_id,
    );
    return this.attachmentsService!.list(taskId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER)
  @Post('tasks/:taskId/attachments')
  async create(
    @Param('taskId') taskId: string,
    @Body() data: Partial<Attachment> & { type: AttachmentType },
    @Req() request: Request,
  ) {
    await this.attachmentsService!.assertCanAccess(
      taskId,
      (request as any).user?.userId,
      (request as any).user?.role,
      (request as any).user?.organization_id,
    );
    return this.attachmentsService!.create(taskId, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER)
  @Delete('tasks/:taskId/attachments/:attachmentId')
  async remove(
    @Param('taskId') taskId: string,
    @Param('attachmentId') attachmentId: string,
    @Req() request: Request,
  ) {
    await this.attachmentsService!.assertCanAccess(
      taskId,
      (request as any).user?.userId,
      (request as any).user?.role,
      (request as any).user?.organization_id,
    );
    return this.attachmentsService!.remove(taskId, attachmentId);
  }
}
