import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attachment } from './schemas/attachment.schema.js';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectModel(Attachment.name) @Optional() private readonly attachmentModel?: Model<Attachment>,
  ) {}

  async list(taskId: string) {
    const attachments = await this.attachmentModel!.find({ task_id: taskId }).exec();
    return { success: true, data: attachments };
  }

  async create(taskId: string, data: Partial<Attachment>) {
    const attachment = await this.attachmentModel!.create({ task_id: taskId, ...data });
    return { success: true, data: attachment };
  }

  async remove(taskId: string, attachmentId: string) {
    const attachment = await this.attachmentModel!.findOneAndDelete({
      _id: attachmentId,
      task_id: taskId,
    }).exec();
    return { success: true, data: attachment };
  }
}
