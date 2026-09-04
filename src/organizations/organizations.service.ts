import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Organization } from './schema/organization.schema.js';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema.js';
import { type Request } from 'express';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name)
    @Optional()
    private organizationModel?: Model<Organization>,

    @InjectModel(User.name)
    @Optional()
    private userModel?: Model<User>,
  ) {}

  async createOrganization(data: Organization, req: Request) {
    const createdOrganization = await this.organizationModel!.create({
      name: data.name,
    });

    await this.userModel!.findOneAndUpdate(
      // @ts-ignore
      { _id: req?.user?.userId },
      { organization_id: createdOrganization._id },
    );

    return createdOrganization;
  }

  async findOne(organizationId: string) {
    const organization =
      await this.organizationModel!.findById(organizationId).exec();
    if (!organization) {
      return { success: false, message: 'Organization not found' };
    }

    return { success: true, data: organization };
  }

  async update(organizationId: string, data: Partial<Organization>) {
    const organization = await this.organizationModel!.findByIdAndUpdate(
      organizationId,
      data,
      { new: true },
    ).exec();

    return {
      success: true,
      data: organization,
    };
  }
}
