import {  Controller,  Get,  UseGuards,} from '@nestjs/common';
import {  ApiHeader,  ApiOperation,  ApiTags,} from '@nestjs/swagger';

import { ApiKeyGuard } from '../auth/guards/api-key.guard.js';

@ApiTags('External')
@Controller('external')
export class ExternalController {
  @Get('status')
  @UseGuards(ApiKeyGuard)
  @ApiHeader({
    name: 'x-api-key',
    required: true,
  })
  @ApiOperation({ summary: 'Check external API access' })
  status() {
    return {
      service: 'FleetCore',
      status: 'OK',
    };
  }
}
