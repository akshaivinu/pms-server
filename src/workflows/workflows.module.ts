import { Module } from '@nestjs/common';
import { WorkflowsService } from './workflows.service.js';
import { WorkflowsController } from './workflows.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Workflow, WorkflowSchema } from './schemas/workflow.schema.js';
import {
  WorkflowStage,
  WorkflowStageSchema,
} from './schemas/workflow-stage.schema.js';
import { AuthModule } from '../auth/auth.module.js';
import {
  ProjectMember,
  ProjectMemberSchema,
} from '../projects/schemas/project-member.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { Project, ProjectSchema } from '../projects/schemas/project.schema.js';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workflow.name, schema: WorkflowSchema },
      { name: WorkflowStage.name, schema: WorkflowStageSchema },
      { name: ProjectMember.name, schema: ProjectMemberSchema },
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    AuthModule,
    ActivityLogsModule,
  ],
  providers: [WorkflowsService],
  controllers: [WorkflowsController],
})
export class WorkflowsModule {}
