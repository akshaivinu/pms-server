import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { TasksController } from './tasks.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from './schemas/task.schema.js';
import { AuthModule } from '../auth/auth.module.js';
import { TaskDependency, TaskDependencySchema } from './schemas/task-dependency.schema.js';
import { Workflow, WorkflowSchema } from '../workflows/schemas/workflow.schema.js';
import { WorkflowStage, WorkflowStageSchema } from '../workflows/schemas/workflow-stage.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Task.name,
        schema: TaskSchema
      },
      {
        name: TaskDependency.name,
        schema: TaskDependencySchema
      },
      {
        name: Workflow.name,
        schema: WorkflowSchema,
      },
      {
        name: WorkflowStage.name,
        schema: WorkflowStageSchema,
      },
    ]),
    
    AuthModule
  ],
  providers: [TasksService],
  controllers: [TasksController]
})
export class TasksModule {}
