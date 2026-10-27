import {  Controller,  Post,  Get,  Patch,  Body,  Param,  ParseIntPipe,  Req,  UseGuards,} from '@nestjs/common';

import {  ApiBearerAuth,  ApiOperation,  ApiTags,} from '@nestjs/swagger';

import { MechanicsService } from './mechanics.service.js';
import { CreateMechanicDto } from './dto/create-mechanic.dto.js';
import { UpdateMechanicDto } from './dto/update-mechanic.dto.js';
import { UpdateMechanicStatusDto } from './dto/update-mechanic-status.dto.js';

import { JwtAuthGuard, AuthenticatedUser } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';

@ApiTags('Mechanics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mechanics')
export class MechanicsController {
  constructor(
    private readonly mechanicsService: MechanicsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Register mechanic' })
  create(@Body() dto: CreateMechanicDto) {
    return this.mechanicsService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List mechanics' })
  findAll() {
    return this.mechanicsService.findAll();
  }

  // A technician may view only their linked mechanic profile.
  @Get('me')
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get my mechanic profile' })
  findMine(@Req() request: { user: AuthenticatedUser }) {
    return this.mechanicsService.findMine(request.user.id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get mechanic by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mechanicsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update mechanic' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMechanicDto,
  ) {
    return this.mechanicsService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate or deactivate mechanic' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMechanicStatusDto,
  ) {
    return this.mechanicsService.updateStatus(id, dto.status);
  }
}
