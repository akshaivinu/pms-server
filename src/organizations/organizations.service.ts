import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Organization } from './schema/organization.schema.js';
import { Model } from 'mongoose';

@Injectable()
export class OrganizationsService {
  constructor(@InjectModel(Organization.name) private organizationModel: Model<Organization>) { }

  async create(name: string) {
    const createdOrganization = await this.organizationModel.create({ name });
    return createdOrganization;
  }
  
}
