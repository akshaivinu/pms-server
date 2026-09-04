import { Module } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service.js';
import { ActivityLogsController } from './activity-logs.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';
import {
  ActivityLog,
  ActivityLogSchema,
} from './schemas/activity-logs.schema.js';
import { Task, TaskSchema } from '../tasks/schemas/task.schema.js';
import { Project, ProjectSchema } from '../projects/schemas/project.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ActivityLog.name, schema: ActivityLogSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    AuthModule,
  ],

  providers: [ActivityLogsService],
  controllers: [ActivityLogsController],
  exports: [ActivityLogsService],
})
export class ActivityLogsModule {}
