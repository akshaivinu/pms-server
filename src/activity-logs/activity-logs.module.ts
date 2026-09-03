import { Module } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service.js';
import { ActivityLogsController } from './activity-logs.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';
import { ActivityLog, ActivityLogSchema } from './schemas/activity-logs.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ActivityLog.name, schema: ActivityLogSchema }]),
    AuthModule,
  ],
  
  providers: [ActivityLogsService],
  controllers: [ActivityLogsController]
})
export class ActivityLogsModule {}
