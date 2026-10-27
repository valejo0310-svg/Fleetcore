import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { VehiclesDao } from './dao/vehicles.dao.js';
import {
  Vehicle,
  VehicleStatus,
} from './entities/vehicle.entity.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';

/**
 * Implements vehicle business rules.
 */
@Injectable()
export class VehiclesService {
  constructor(
    private readonly vehiclesDao: VehiclesDao,
  ) {}

  private normalizePlate(plate: string): string {
    return plate.trim().toUpperCase();
  }

  /**
   * Converts PostgreSQL unique constraint violations into HTTP 409.
   */
  private handleDatabaseError(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'driverError' in error &&
      typeof error.driverError === 'object' &&
      error.driverError !== null &&
      'code' in error.driverError &&
      error.driverError.code === '23505'
    ) {
      throw new ConflictException(
        'Vehicle plate already exists',
      );
    }

    throw error;
  }

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    const plate = this.normalizePlate(dto.plate);

    const existing = await this.vehiclesDao.findByPlate(plate);

    if (existing) {
      throw new ConflictException(
        `Vehicle with plate ${plate} already exists`,
      );
    }

    try {
      return await this.vehiclesDao.create({
        ...dto,
        plate,
        status: VehicleStatus.AVAILABLE,
      });
    } catch (error: unknown) {
      this.handleDatabaseError(error);
    }
  }

  findAll(): Promise<Vehicle[]> {
    return this.vehiclesDao.findAll();
  }

  async findOne(id: number): Promise<Vehicle> {
    const vehicle = await this.vehiclesDao.findById(id);

    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle with ID ${id} not found`,
      );
    }

    return vehicle;
  }

  async findByPlate(plate: string): Promise<Vehicle> {
    const normalizedPlate = this.normalizePlate(plate);

    const vehicle =
      await this.vehiclesDao.findByPlate(normalizedPlate);

    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle with plate ${normalizedPlate} not found`,
      );
    }

    return vehicle;
  }

  async update(
    id: number,
    dto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    if (dto.plate !== undefined) {
      const plate = this.normalizePlate(dto.plate);

      const existing =
        await this.vehiclesDao.findByPlate(plate);

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Vehicle with plate ${plate} already exists`,
        );
      }

      vehicle.plate = plate;
    }

    if (dto.brand !== undefined) vehicle.brand = dto.brand;
    if (dto.model !== undefined) vehicle.model = dto.model;
    if (dto.year !== undefined) vehicle.year = dto.year;
    if (dto.mileage !== undefined) vehicle.mileage = dto.mileage;

    try {
      return await this.vehiclesDao.save(vehicle);
    } catch (error: unknown) {
      this.handleDatabaseError(error);
    }
  }

  /**
   * Performs a logical deletion by changing the vehicle status.
   */
  async deactivate(id: number): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    if (vehicle.status === VehicleStatus.IN_MAINTENANCE) {
      throw new ConflictException(
        'A vehicle under maintenance cannot be deactivated',
      );
    }

    vehicle.status = VehicleStatus.INACTIVE;

    return this.vehiclesDao.save(vehicle);
  }
}