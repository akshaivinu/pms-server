import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project } from './schemas/project.schema.js';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    @Optional()
    private projectModel?: Model<Project>,
  ) {}

  async create(name: string, description: string, organization_id: Types.ObjectId) {
    const project = await this.projectModel!.create({
      name,
      description,
      organization_id,
    });

    return {
      success: true,
      data: project,
    };
  }

  async findAll(organizationId?: string) {
    const projects = organizationId
      ? await this.projectModel!.find({ organization_id: organizationId }).exec()
      : await this.projectModel!.find().exec();

    return { success: true, data: projects };
  }

  async findOne(projectId: string, organizationId: Types.ObjectId | string) {
    const project = await this.projectModel!.findOne({
      _id: projectId,
      organization_id: organizationId,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return { success: true, data: project };
  }

  async update(projectId: string, data: Record<string, unknown>) {
    const project = await this.projectModel!.findByIdAndUpdate(projectId, data, { new: true }).exec();
    return { success: true, data: project };
  }

  async remove(projectId: string) {
    const project = await this.projectModel!.findByIdAndDelete(projectId).exec();
    return { success: true, data: project };
  }

  async archive(projectId: string) {
    const project = await this.projectModel!.findByIdAndUpdate(
      projectId,
      { status: 'archived', archived_at: new Date() },
      { new: true },
    ).exec();

    return { success: true, data: project };
  }

  async listMembers(projectId: string) {
    return { success: true, data: [], projectId };
  }

  async addMember(projectId: string, userId: string, projectRole?: string) {
    return { success: true, data: { projectId, userId, project_role: projectRole ?? 'TEAM_MEMBER' } };
  }

  async updateMember(projectId: string, userId: string, projectRole: string) {
    return { success: true, data: { projectId, userId, project_role: projectRole } };
  }

  async removeMember(projectId: string, userId: string) {
    return { success: true, data: { projectId, userId, removed: true } };
  }
}
