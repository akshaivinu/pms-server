import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../schemas/user.schema.js';
import { Project } from '../../projects/schemas/project.schema.js';
import { ProjectMember } from '../../projects/schemas/project-member.schema.js';
import { Model, Types } from 'mongoose';
import { UserRole } from '../enums/users.enum.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) @Optional() private userModel?: Model<User>,
    @InjectModel(Project.name)
    @Optional()
    private projectModel?: Model<Project>,
    @InjectModel(ProjectMember.name)
    @Optional()
    private projectMemberModel?: Model<ProjectMember>,
  ) {}

  async listUsers(organizationId: string) {
    const orgUsers = await this.userModel!.find({
      organization_id: organizationId,
    })
      .select('-password')
      .exec();

    const orgProjects = await this.projectModel!.find({
      organization_id: new Types.ObjectId(organizationId),
    })
      .select('_id')
      .lean()
      .exec();
    const projectIds = orgProjects.map((project) => project._id);

    let memberUserIds: Array<Types.ObjectId | string> = [];
    if (projectIds.length) {
      const memberships = await this.projectMemberModel!.find({
        project_id: { $in: projectIds },
      })
        .select('user_id')
        .lean()
        .exec();
      memberUserIds = memberships.map((membership) => membership.user_id);
    }

    const knownIds = new Set(orgUsers.map((user) => String(user._id)));
    const extraIds = memberUserIds.filter((id) => !knownIds.has(String(id)));
    if (extraIds.length) {
      const extraUsers = await this.userModel!.find({ _id: { $in: extraIds } })
        .select('-password')
        .exec();
      return { success: true, data: [...orgUsers, ...extraUsers] };
    }

    return { success: true, data: orgUsers };
  }

  private async belongsToOrganization(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    const user = await this.userModel!.findById(userId)
      .select('organization_id')
      .lean()
      .exec();
    if (
      user?.organization_id &&
      String(user.organization_id) === organizationId
    )
      return true;

    const orgProjects = await this.projectModel!.find({
      organization_id: new Types.ObjectId(organizationId),
    })
      .select('_id')
      .lean()
      .exec();
    const projectIds = orgProjects.map((project) => project._id);
    if (!projectIds.length) return false;

    const membership = await this.projectMemberModel!.findOne({
      project_id: { $in: projectIds },
      user_id: new Types.ObjectId(userId),
    })
      .lean()
      .exec();
    return !!membership;
  }

  async findOne(organizationId: string, userId: string) {
    if (!(await this.belongsToOrganization(userId, organizationId))) {
      return { success: false, data: null };
    }
    const user = await this.userModel!.findById(userId)
      .select('-password')
      .exec();

    return {
      success: !!user,
      data: user,
    };
  }

  async update(
    organizationId: string,
    userId: string,
    data: Record<string, unknown>,
  ) {
    if (!(await this.belongsToOrganization(userId, organizationId))) {
      return { success: false, data: null };
    }
    const user = await this.userModel!.findByIdAndUpdate(userId, data, {
      new: true,
    });

    return { success: true, data: user };
  }

  async updateRole(organizationId: string, userId: string, role: UserRole) {
    if (!(await this.belongsToOrganization(userId, organizationId))) {
      return { success: false, data: null };
    }
    const user = await this.userModel!.findByIdAndUpdate(
      userId,
      { role },
      { new: true },
    );

    return { success: true, data: user };
  }

  async remove(
    organizationId: string,
    userId: string,
    currentUser?: { userId?: string },
  ) {
    if (currentUser?.userId === userId) {
      return { success: false, message: 'You cannot remove your own account.' };
    }

    if (!(await this.belongsToOrganization(userId, organizationId))) {
      return { success: false, data: null };
    }

    const user = await this.userModel!.findByIdAndDelete(userId);

    return {
      success: true,
      data: user,
    };
  }
}
