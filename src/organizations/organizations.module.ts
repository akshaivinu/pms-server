import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service.js';
import { OrganizationsController } from './organizations.controller.js';
import { Organization, OrganizationSchema } from './schema/organization.schema.js';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Organization.name,
        schema: OrganizationSchema,
      },
    ]),
    AuthModule,
  ],
  providers: [OrganizationsService],
  controllers: [OrganizationsController]
})
export class OrganizationsModule {}
