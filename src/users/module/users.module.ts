import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/user.schema.js';
import {
  Project,
  ProjectSchema,
} from '../../projects/schemas/project.schema.js';
import {
  ProjectMember,
  ProjectMemberSchema,
} from '../../projects/schemas/project-member.schema.js';
import { UsersController } from '../controllers/users.controller.js';
import { UsersService } from '../services/users.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Project.name,
        schema: ProjectSchema,
      },
      {
        name: ProjectMember.name,
        schema: ProjectMemberSchema,
      },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
