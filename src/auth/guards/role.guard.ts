import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/enums/users.enum.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Optional() private readonly reflector?: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.reflector) {
      return true;
    }

    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('You do not have permission');
    }

    return true;
  }
}
