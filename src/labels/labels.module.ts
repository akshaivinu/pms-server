import { Module } from '@nestjs/common';
import { LabelsService } from './labels.service.js';
import { LabelsController } from './labels.controller.js';
import { Label, LabelSchema } from './schemas/label.schema.js';
import { TaskLabel, TaskLabelSchema } from './schemas/task-label.schema.js';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';
import { Task, TaskSchema } from '../tasks/schemas/task.schema.js';
import { Project, ProjectSchema } from '../projects/schemas/project.schema.js';
import {
  ProjectMember,
  ProjectMemberSchema,
} from '../projects/schemas/project-member.schema.js';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Label.name, schema: LabelSchema },
      { name: TaskLabel.name, schema: TaskLabelSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: ProjectMember.name, schema: ProjectMemberSchema },
    ]),
    AuthModule,
    ActivityLogsModule,
  ],

  providers: [LabelsService],
  controllers: [LabelsController],
})
export class LabelsModule {}
