import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Label } from './schemas/label.schema.js';
import { TaskLabel } from './schemas/task-label.schema.js';

@Injectable()
export class LabelsService {
  constructor(
    @InjectModel(Label.name) @Optional() private readonly labelModel?: Model<Label>,
    @InjectModel(TaskLabel.name) @Optional() private readonly taskLabelModel?: Model<TaskLabel>,
  ) {}

  async createLabel(organizationId: string, name: string) {
    const label = await this.labelModel!.create({ organization_id: organizationId, name });
    return { success: true, data: label };
  }

  async listLabels(organizationId: string) {
    const labels = await this.labelModel!.find({ organization_id: organizationId }).exec();
    return { success: true, data: labels };
  }

  async updateLabel(labelId: string, data: Partial<Label>) {
    const label = await this.labelModel!.findByIdAndUpdate(labelId, data, { new: true }).exec();
    return { success: true, data: label };
  }

  async deleteLabel(labelId: string) {
    const label = await this.labelModel!.findByIdAndDelete(labelId).exec();
    return { success: true, data: label };
  }

  async assignLabel(taskId: string, labelId: string) {
    const record = await this.taskLabelModel!.create({ task_id: taskId, label_id: labelId });
    return { success: true, data: record };
  }

  async removeLabel(taskId: string, labelId: string) {
    const record = await this.taskLabelModel!.findOneAndDelete({ task_id: taskId, label_id: labelId }).exec();
    return { success: true, data: record };
  }
}
