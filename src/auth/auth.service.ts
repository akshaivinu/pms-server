import { ConflictException, Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema.js';
import { CreateUserDto, LoginDto } from './dto/auth.dto.js';

import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../users/enums/users.enum.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) @Optional() private readonly userModel?: Model<User>,
    @Optional() private readonly jwtService?: JwtService,
  ) { }

  async create(user: CreateUserDto) {
    const existingUser = await this.userModel!.findOne({ email: user.email });
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }
    const hashPassword = await bcrypt.hash(user.password, 10);
    const newUser = new this.userModel!({ ...user, password: hashPassword });
    newUser.save();
    return {
      success: true,
      message: `user ${user.name} created successfully`
    }
  }
  
  async login(data: LoginDto) {
    const user = await this.userModel!.findOne({ email: data.email.trim().toLowerCase() })
    if (!user) {
      throw new ConflictException("User with this email does not exist");
    }
    const isPasswordValid = await bcrypt.compare(data.password, user.password)
    if (!isPasswordValid) {
      throw new ConflictException("Invalid password");
    }

    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id,
    }
    
    const token = this.jwtService!.sign(payload);

    return token;
  }

  async updateRole(role: UserRole) {
    const user = await this.userModel!.findOne({ email: "harini@gmail.com" });
    if (!user) {
      throw new ConflictException("User not found");
    }
    user.role = role;
    await user.save();
    return {
      success: true,
      message: `role updated to ${role}`
    }
  }
}
