import {  createParamDecorator,  ExecutionContext,} from '@nestjs/common';

import { AuthenticatedUser } from '../guards/jwt-auth.guard.js';

// Retrieves the user validated by the JWT guard.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<{
      user: AuthenticatedUser;
    }>();

    return request.user;
  },
);
