import { Module } from '@nestjs/common';
import { WorkflowsService } from './workflows.service.js';
import { WorkflowsController } from './workflows.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Workflow, WorkflowSchema } from './schemas/workflow.schema.js';
import { WorkflowStage, WorkflowStageSchema } from './schemas/workflow-stage.schema.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workflow.name, schema: WorkflowSchema },
      { name: WorkflowStage.name, schema: WorkflowStageSchema },
    ]),
    AuthModule,
  ],
  providers: [WorkflowsService],
  controllers: [WorkflowsController]
})
export class WorkflowsModule {}
