import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { config } from 'dotenv';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../users/schemas/user.schema.js';

config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          return request?.cookies?.accessToken;
        },
      ]),
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: any) {
    const user = await this.userModel.findById(payload.sub).select('email role organization_id').lean().exec();
    if (!user) return false;
    return {
      userId: String(user._id),
      email: user.email,
      role: user.role,
      organization_id: user.organization_id ? String(user.organization_id) : undefined,
    };
  }
}