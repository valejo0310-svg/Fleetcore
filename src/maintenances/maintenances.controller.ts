import {  Body,  Controller,  Get,  Param,  ParseIntPipe,  Patch,  Post,  Req,  UseGuards,  ForbiddenException,} from '@nestjs/common';

import {  ApiBearerAuth,  ApiOperation,  ApiTags,} from '@nestjs/swagger';

import { MaintenancesService } from './maintenances.service.js';
import { CreateMaintenanceDto } from './dto/create-maintenances.js';
import { CompleteMaintenanceDto } from './dto/complete-maintenances.js';

import { JwtAuthGuard,  AuthenticatedUser,} from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';
import { MechanicsService } from '../mechanics/mechanics.service.js';

@ApiTags('Maintenances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('maintenances')
export class MaintenancesController {
  constructor(
    private readonly maintenancesService: MaintenancesService,
    private readonly mechanicsService: MechanicsService,
  ) {}

  // Only administrators can schedule maintenance.
  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Schedule maintenance' })
  create(@Body() dto: CreateMaintenanceDto) {
    return this.maintenancesService.create(dto);
  }

  // Administrators can view all maintenance records.
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all maintenance records' })
  findAll() {
    return this.maintenancesService.findAll();
  }

  // Technicians can view their assigned maintenance records.
  @Get('me')
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'List my maintenance records' })
  findMine(@Req() request: { user: AuthenticatedUser }) {
    return this.maintenancesService.findMine(request.user.id);
  }

  // Administrators can view the maintenance history of a vehicle.
  @Get('vehicle/:vehicleId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get vehicle maintenance history' })
  findByVehicle(
    @Param('vehicleId', ParseIntPipe) vehicleId: number,
  ) {
    return this.maintenancesService.findByVehicleId(vehicleId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get maintenance by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.maintenancesService.findOne(id);
  }

  // Administrators or the assigned technician can start maintenance.
  @Patch(':id/start')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Start maintenance' })
  async start(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: { user: AuthenticatedUser },
  ) {
    await this.verifyAssignment(id, request.user);
    return this.maintenancesService.start(id);
  }

  // Administrators or the assigned technician can complete maintenance.
  @Patch(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Complete maintenance' })
  async complete(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompleteMaintenanceDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    await this.verifyAssignment(id, request.user);
    return this.maintenancesService.complete(id, dto);
  }

  // Only administrators can cancel maintenance.
  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancel maintenance' })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.maintenancesService.cancel(id);
  }

  // Verify that a technician owns the assigned mechanic profile.
  private async verifyAssignment(
    maintenanceId: number,
    user: AuthenticatedUser,
  ): Promise<void> {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    const mechanic = await this.mechanicsService.findMine(user.id);
    const maintenance =
      await this.maintenancesService.findOne(maintenanceId);

    if (maintenance.mechanicId !== mechanic.id) {
      throw new ForbiddenException(
        'Maintenance is not assigned to this technician',
      );
    }
  }
}
