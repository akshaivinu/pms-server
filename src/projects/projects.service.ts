import { ConflictException, ForbiddenException, Injectable, NotFoundException, Optional } from '@nestjs/common';
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

  async create(name: string, description: string, organization_id: Types.ObjectId, creatorId?: string, creatorRole?: string) {
    const project = await this.projectModel!.create({
      name,
      description,
      organization_id,
    });

    if (creatorId && creatorRole === 'manager') {
      await this.projectMemberModel!.create({
        project_id: project._id,
        user_id: creatorId,
        project_role: 'PROJECT_MANAGER',
      });
    }
    return {
      success: true,
      data: project,
    };
  }

  async findAll(organizationId: Types.ObjectId, userId?: string, role?: string) {
    const filter: Record<string, unknown> = { organization_id: organizationId };
    if (role === 'member') {
      const memberships = await this.projectMemberModel!.find({ user_id: userId }).select('project_id').lean().exec();
      filter._id = { $in: memberships.map((membership) => membership.project_id) };
    }
    const projects = await this.projectModel!.find(filter).exec();

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

  async assertCanAccess(projectId: Types.ObjectId, userId: string, role: string) {
    if (role === 'admin' || role === 'manager') return;
    const membership = await this.projectMemberModel!.findOne({ project_id: projectId, user_id: userId }).lean().exec();
    if (!membership) throw new ForbiddenException('You do not have access to this project');
  }

  async assertProjectOrganization(projectId: Types.ObjectId, organizationId: string) {
    const project = await this.projectModel!.findOne({ _id: projectId, organization_id: organizationId }).select('_id').lean().exec();
    if (!project) throw new ForbiddenException('You do not have access to this project');
  }

  async assertCanManage(projectId: Types.ObjectId, userId: string, role: string) {
    if (role === 'admin') return;
    const membership = await this.projectMemberModel!.findOne({
      project_id: projectId,
      user_id: userId,
      project_role: { $in: ['MANAGER', 'PROJECT_MANAGER', 'manager', 'project_manager'] },
    }).lean().exec();
    if (!membership) throw new ForbiddenException('You cannot manage this project');
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
    const updated = await this.projectMemberModel!.findOneAndUpdate(
      { project_id: projectId, user_id: userId },
      { project_role: projectRole },
      { new: true },
    )
      .populate('user_id', 'name email role organization_id')
      .exec();
    return { success: true, data: updated };
  }

  async removeMember(projectId: Types.ObjectId, userId: string) {
    const removed = await this.projectMemberModel!.findOneAndDelete({
      project_id: projectId,
      user_id: userId,
    }).exec();
    return { success: true, data: removed };
  }
}
