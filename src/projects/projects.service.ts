import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project } from './schemas/project.schema.js';
import { ProjectMember } from './schemas/project-member.schema.js';
import { User } from '../users/schemas/user.schema.js';
import { ActivityLogsService } from '../activity-logs/activity-logs.service.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    @Optional()
    private projectModel?: Model<Project>,
    @InjectModel(ProjectMember.name)
    @Optional()
    private memberModel?: Model<ProjectMember>,
    @InjectModel(User.name) @Optional() private userModel?: Model<User>,
    private activity?: ActivityLogsService,
  ) {}

  async create(
    name: string,
    description: string,
    orgId: Types.ObjectId,
    creatorId?: string,
    creatorRole?: string,
  ) {
    const project = await this.projectModel!.create({
      name,
      description,
      organization_id: orgId,
    });
    if (creatorId && creatorRole === 'manager') {
      await this.memberModel!.create({
        project_id: project._id,
        user_id: creatorId,
        project_role: 'PROJECT_MANAGER',
      });
    }
    if (creatorId)
      this.activity?.logActivity({
        organizationId: String(orgId),
        userId: creatorId,
        action: 'create',
        entityType: 'project',
        entityId: project._id,
        details: { title: name },
      });
    return { success: true, data: project };
  }

  async findAll(orgId: Types.ObjectId, userId?: string, role?: string) {
    const filter: Record<string, unknown> = { organization_id: orgId };
    if (role === 'member') {
      const memberships = await this.memberModel!.find({
        user_id: new Types.ObjectId(userId),
      })
        .select('project_id')
        .lean();
      filter._id = { $in: memberships.map((m) => m.project_id) };
    }
    return { success: true, data: await this.projectModel!.find(filter) };
  }

  async findOne(projectId: Types.ObjectId, orgId: Types.ObjectId | string) {
    const project = await this.projectModel!.findOne({
      _id: projectId,
      organization_id: orgId,
    });
    if (!project) throw new NotFoundException('Project not found');
    return { success: true, data: project };
  }

  async assertCanAccess(
    projectId: Types.ObjectId,
    userId: string,
    role: string,
  ) {
    if (role === 'admin' || role === 'manager') return;
    const member = await this.memberModel!.findOne({
      project_id: projectId,
      user_id: new Types.ObjectId(userId),
    }).lean();
    if (!member) throw new ForbiddenException('Access denied');
  }

  async assertCanManage(
    projectId: Types.ObjectId,
    userId: string,
    role: string,
    orgId?: string,
  ) {
    const project = await this.projectModel!.findById(projectId)
      .select('organization_id')
      .lean();
    if (!project) throw new NotFoundException('Project not found');
    if (orgId && String(project.organization_id) !== orgId)
      throw new ForbiddenException('Access denied');
    if (role === 'admin') return;
    const member = await this.memberModel!.findOne({
      project_id: projectId,
      user_id: new Types.ObjectId(userId),
      project_role: {
        $in: ['MANAGER', 'PROJECT_MANAGER', 'manager', 'project_manager'],
      },
    }).lean();
    if (!member) throw new ForbiddenException('Cannot manage this project');
  }

  async update(projectId: Types.ObjectId, data: Record<string, unknown>) {
    return {
      success: true,
      data: await this.projectModel!.findByIdAndUpdate(projectId, data, {
        new: true,
      }),
    };
  }

  async remove(projectId: Types.ObjectId) {
    return {
      success: true,
      data: await this.projectModel!.findByIdAndDelete(projectId),
    };
  }

  async archive(projectId: Types.ObjectId) {
    return {
      success: true,
      data: await this.projectModel!.findByIdAndUpdate(
        projectId,
        { status: 'archived', archived_at: new Date() },
        { new: true },
      ),
    };
  }

  async listMembers(projectId: Types.ObjectId) {
    return {
      success: true,
      data: await this.memberModel!.find({ project_id: projectId })
        .populate('user_id', 'name email role organization_id')
        .lean(),
    };
  }

  async addMember(
    projectId: Types.ObjectId,
    email: string,
    orgId: Types.ObjectId,
    projectRole?: string,
    actorId?: string,
  ) {
    const project = await this.projectModel!.findOne({
      _id: projectId,
      organization_id: orgId,
    });
    if (!project) throw new NotFoundException('Project not found');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new ConflictException('Email required');

    let user = await this.userModel!.findOne({ email: normalizedEmail });
    if (!user) {
      user = await this.userModel!.create({
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password: await bcrypt.hash(`${normalizedEmail}-${Date.now()}`, 10),
        organization_id: orgId,
      });
    } else if (!user.organization_id) {
      user.organization_id = orgId;
      await user.save();
    } else if (String(user.organization_id) !== String(orgId)) {
      throw new ConflictException('User belongs to another organization');
    }

    const member = await this.memberModel!.findOneAndUpdate(
      { project_id: projectId, user_id: user._id },
      {
        project_id: projectId,
        user_id: user._id,
        project_role: projectRole ?? 'TEAM_MEMBER',
      },
      { upsert: true, new: true },
    );
    if (actorId)
      this.activity?.logActivity({
        organizationId: String(orgId),
        userId: actorId,
        action: 'assigned',
        entityType: 'project',
        entityId: projectId,
        details: { title: project.name, memberEmail: normalizedEmail },
      });
    await member.populate('user_id', 'name email role organization_id');
    return { success: true, data: member };
  }

  async updateMember(
    projectId: Types.ObjectId,
    userId: string,
    projectRole: string,
  ) {
    return {
      success: true,
      data: await this.memberModel!.findOneAndUpdate(
        { project_id: projectId, user_id: new Types.ObjectId(userId) },
        { project_role: projectRole },
        { new: true },
      ).populate('user_id', 'name email role organization_id'),
    };
  }

  async removeMember(projectId: Types.ObjectId, userId: string) {
    return {
      success: true,
      data: await this.memberModel!.findOneAndDelete({
        project_id: projectId,
        user_id: new Types.ObjectId(userId),
      }),
    };
  }
}
