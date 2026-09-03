import { Module } from '@nestjs/common';
import { AttachmentsService } from './attachments.service.js';
import { AttachmentsController } from './attachments.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';
import { Attachment, AttachmentSchema } from './schemas/attachment.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Attachment.name, schema: AttachmentSchema }]),
    AuthModule,
  ],
  
  providers: [AttachmentsService],
  controllers: [AttachmentsController]
})
export class AttachmentsModule {}
