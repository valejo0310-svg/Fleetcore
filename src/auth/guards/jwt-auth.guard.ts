import {  CanActivate,  ExecutionContext,  Injectable,  UnauthorizedException,} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

import { UsersService } from '../../users/users.service.js';
import { UserRole } from '../../users/entities/user.entity.js';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
}

interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
}

interface AuthenticatedRequest {
  headers: {
    authorization?: string;
  };
  user?: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
  'isPublic',
  [context.getHandler(), context.getClass()],
);

if (isPublic) {
  return true;
}
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    // Require a Bearer token.
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token required');
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      throw new UnauthorizedException('Token required');
    }

    try {
      // Verify the token signature and expiration.
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      if (!Number.isInteger(payload.sub) || payload.sub <= 0) {
        throw new UnauthorizedException('Invalid token');
      }

      // Confirm that the user still exists.
      const user = await this.usersService.findById(payload.sub);

      request.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
