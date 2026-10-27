import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe,} from '@nestjs/common';

import { ApiTags, ApiOperation,} from '@nestjs/swagger';

import { VehiclesService } from './vehicles.service.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';

/**
 * Handles HTTP requests related to vehicle management.
 */
@ApiTags('Vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
  ) {}

  /**
   * Creates a new vehicle.
   */
  @Post()
  @ApiOperation({ summary: 'Create a vehicle' })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  /**
   * Retrieves all registered vehicles.
   */
  @Get()
  @ApiOperation({ summary: 'Get all vehicles' })
  findAll() {
    return this.vehiclesService.findAll();
  }

  /**
   * Retrieves a vehicle using its license plate.
   */
  @Get('plate/:plate')
  @ApiOperation({ summary: 'Get vehicle by plate' })
  findByPlate(@Param('plate') plate: string) {
    return this.vehiclesService.findByPlate(plate);
  }

  /**
   * Retrieves a vehicle using its ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.findOne(id);
  }

  /**
   * Updates vehicle information.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update vehicle information' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(id, dto);
  }

  /**
   * Performs a logical deletion by deactivating a vehicle.
   */
  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a vehicle' })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.deactivate(id);
  }
}