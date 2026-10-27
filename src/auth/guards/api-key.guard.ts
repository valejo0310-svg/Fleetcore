import {  CanActivate,  ExecutionContext,  Injectable,  UnauthorizedException,} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();

    const expectedKey = this.configService.get<string>('API_KEY');
    const receivedKey = request.headers['x-api-key'];

    if (
      !expectedKey ||
      typeof receivedKey !== 'string' ||
      receivedKey !== expectedKey
    ) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
