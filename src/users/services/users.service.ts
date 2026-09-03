import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../schemas/user.schema.js';
import { Model } from 'mongoose';
import { UserRole } from '../enums/users.enum.js';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) @Optional() private userModel?: Model<User>) {}

  async listUsers(organizationId: string) {
    const users = await this.userModel!.find({ organization_id: organizationId }).exec();
    return { success: true, data: users };
  }

  async findOne(organizationId: string, userId: string) {
    const user = await this.userModel!.findOne({
      _id: userId,
      organization_id: organizationId,
    });

    return {
      success: !!user,
      data: user,
    };
  }

  async update(organizationId: string, userId: string, data: Record<string, unknown>) {
    const user = await this.userModel!.findOneAndUpdate(
      { _id: userId, organization_id: organizationId },
      data,
      { new: true },
    );

    return { success: true, data: user };
  }

  async updateRole(organizationId: string, userId: string, role: UserRole) {
    const user = await this.userModel!.findOneAndUpdate(
      { _id: userId, organization_id: organizationId },
      { role },
      { new: true },
    );

    return { success: true, data: user };
  }

  async remove(organizationId: string, userId: string, currentUser?: { userId?: string }) {
    if (currentUser?.userId === userId) {
      return { success: false, message: 'You cannot remove your own account.' };
    }

    const user = await this.userModel!.findOneAndDelete({
      _id: userId,
      organization_id: organizationId,
    });

    return {
      success: true,
      data: user,
    };
  }
}
