import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service.js';
import { ProjectsController } from './projects.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './schemas/project.schema.js';
import { ProjectMember, ProjectMemberSchema } from './schemas/project-member.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Project.name,
        schema: ProjectSchema
      },
      {
        name: ProjectMember.name,
        schema: ProjectMemberSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    AuthModule
  ],
  providers: [ProjectsService],
  controllers: [ProjectsController]
})
export class ProjectsModule {}
