import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project } from './schemas/project.schema.js';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private projectModel: Model<Project>,
  ) {}

  async create(
    name: string,
    description: string,
    organization_id: Types.ObjectId,
  ) {
    const project = await this.projectModel.create({
      name,
      description,
      organization_id,
    });

    return project;
  }
}