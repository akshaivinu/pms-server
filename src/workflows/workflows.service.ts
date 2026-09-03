import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Workflow } from './schemas/workflow.schema.js';
import { WorkflowStage } from './schemas/workflow-stage.schema.js';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectModel(Workflow.name) @Optional() private readonly workflowModel?: Model<Workflow>,
    @InjectModel(WorkflowStage.name) @Optional() private readonly stageModel?: Model<WorkflowStage>,
  ) {}

  async createWorkflow(projectId: string, data: Partial<Workflow>) {
    const workflow = await this.workflowModel!.findOneAndUpdate(
      { project_id: projectId },
      { project_id: projectId, ...data },
      { upsert: true, new: true },
    );
    return { success: true, data: workflow };
  }

  async getWorkflow(projectId: string) {
    const workflow = await this.workflowModel!.findOne({ project_id: projectId }).exec();
    return { success: true, data: workflow };
  }

  async updateWorkflow(projectId: string, data: Partial<Workflow>) {
    const workflow = await this.workflowModel!.findOneAndUpdate(
      { project_id: projectId },
      data,
      { new: true },
    );
    return { success: true, data: workflow };
  }

  async createStage(projectId: string, data: { name: string; position: number }) {
    const workflow = await this.workflowModel!.findOne({ project_id: projectId }).exec();
    const stage = await this.stageModel!.create({
      workflow_id: workflow?._id,
      name: data.name,
      position: data.position,
    });
    return { success: true, data: stage };
  }

  async updateStage(stageId: string, data: Partial<WorkflowStage>) {
    const stage = await this.stageModel!.findByIdAndUpdate(stageId, data, { new: true }).exec();
    return { success: true, data: stage };
  }

  async deleteStage(stageId: string) {
    const stage = await this.stageModel!.findByIdAndDelete(stageId).exec();
    return { success: true, data: stage };
  }

  async reorderStages(projectId: string, stages: Array<{ id: string; position: number }>) {
    await Promise.all(
      stages.map((item) =>
        this.stageModel!.findByIdAndUpdate(item.id, { position: item.position }).exec(),
      ),
    );

    const workflow = await this.getWorkflow(projectId);
    return { success: true, data: workflow.data };
  }
}
