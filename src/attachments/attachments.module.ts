import { Module } from '@nestjs/common';
import { AttachmentsService } from './attachments.service.js';
import { AttachmentsController } from './attachments.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';
import { Attachment, AttachmentSchema } from './schemas/attachment.schema.js';
import { Task, TaskSchema } from '../tasks/schemas/task.schema.js';
import { Project, ProjectSchema } from '../projects/schemas/project.schema.js';
import {
  ProjectMember,
  ProjectMemberSchema,
} from '../projects/schemas/project-member.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attachment.name, schema: AttachmentSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: ProjectMember.name, schema: ProjectMemberSchema },
    ]),
    AuthModule,
  ],

  providers: [AttachmentsService],
  controllers: [AttachmentsController],
})
export class AttachmentsModule {}
