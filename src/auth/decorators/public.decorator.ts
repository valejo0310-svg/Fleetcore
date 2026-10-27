import { SetMetadata } from '@nestjs/common';

// Marks an endpoint as publicly accessible.
export const Public = () => SetMetadata('isPublic', true);
