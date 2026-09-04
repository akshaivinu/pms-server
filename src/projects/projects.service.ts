import { ConflictException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project } from './schemas/project.schema.js';
import { ProjectMember } from './schemas/project-member.schema.js';
import { User } from '../users/schemas/user.schema.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    @Optional()
    private projectModel?: Model<Project>,
    @InjectModel(ProjectMember.name)
    @Optional()
    private projectMemberModel?: Model<ProjectMember>,
    @InjectModel(User.name)
    @Optional()
    private userModel?: Model<User>,
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

  async findAll(organizationId?: Types.ObjectId) {
    const projects = organizationId
      ? await this.projectModel!.find({ organization_id: organizationId }).exec()
      : await this.projectModel!.find().exec();

    return { success: true, data: projects };
  }

  async findOne(projectId: Types.ObjectId, organizationId: Types.ObjectId | string) {
    const project = await this.projectModel!.findOne({
      _id: projectId,
      organization_id: organizationId,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return { success: true, data: project };
  }

  async update(projectId: Types.ObjectId, data: Record<string, unknown>) {
    const project = await this.projectModel!.findByIdAndUpdate(projectId, data, { new: true }).exec();
    return { success: true, data: project };
  }

  async remove(projectId: Types.ObjectId) {
    const project = await this.projectModel!.findByIdAndDelete(projectId).exec();
    return { success: true, data: project };
  }

  async archive(projectId: Types.ObjectId) {
    const project = await this.projectModel!.findByIdAndUpdate(
      projectId,
      { status: 'archived', archived_at: new Date() },
      { new: true },
    ).exec();

    return { success: true, data: project };
  }

  async listMembers(projectId: Types.ObjectId) {
    const members = await this.projectMemberModel!.find({ project_id: projectId })
      .populate('user_id', 'name email role organization_id')
      .lean()
      .exec();
    return { success: true, data: members };
  }

  async addMember(projectId: Types.ObjectId, email: string, organizationId: Types.ObjectId, projectRole?: string) {
    const project = await this.projectModel!.findOne({
      _id: projectId,
      organization_id: organizationId,
    }).exec();
    if (!project) throw new NotFoundException('Project not found in this organization');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new ConflictException('Member email is required');

    let user = await this.userModel!.findOne({ email: normalizedEmail });
    if (!user) {
      const temporaryPassword = await bcrypt.hash(`${normalizedEmail}-${Date.now()}`, 10);
      user = await this.userModel!.create({
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password: temporaryPassword,
        organization_id: organizationId,
      });
    } else if (!user.organization_id) {
      user.organization_id = organizationId;
      await user.save();
    } else if (String(user.organization_id) !== String(organizationId)) {
      throw new ConflictException('This member belongs to another organization');
    }

    const member = await this.projectMemberModel!.findOneAndUpdate(
      { project_id: projectId, user_id: user._id },
      { project_id: projectId, user_id: user._id, project_role: projectRole ?? 'TEAM_MEMBER' },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
    if (!member) throw new Error('Project member could not be saved');

    await member.populate('user_id', 'name email role organization_id');
    return { success: true, data: member };
  }

  async updateMember(projectId: Types.ObjectId, userId: string, projectRole: string) {
    return { success: true, data: { projectId, userId, project_role: projectRole } };
  }

  async removeMember(projectId: Types.ObjectId, userId: string) {
    return { success: true, data: { projectId, userId, removed: true } };
  }
}
