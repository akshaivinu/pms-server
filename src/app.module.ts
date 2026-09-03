import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/module/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { LabelsModule } from './labels/labels.module.js';
import { AttachmentsModule } from './attachments/attachments.module.js';
import { ActivityLogsModule } from './activity-logs/activity-logs.module.js';
import { WorkflowsModule } from './workflows/workflows.module.js';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          uri: configService.get<string>('MONGO_URI'),
        };
      },
    }),
    UsersModule,
    AuthModule,
    OrganizationsModule,
    ProjectsModule,
    TasksModule,
    LabelsModule,
    AttachmentsModule,
    ActivityLogsModule,
    WorkflowsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
