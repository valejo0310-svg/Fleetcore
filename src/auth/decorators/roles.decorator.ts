import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity.js';

// Defines which roles can access an endpoint.
export const Roles = (...roles: UserRole[]) =>
  SetMetadata('roles', roles);
