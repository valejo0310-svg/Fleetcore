import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Vehicle } from '../entities/vehicle.entity.js';

/**
 * Encapsulates database operations for vehicles.
 */
@Injectable()
export class VehiclesDao {
  constructor(
    @InjectRepository(Vehicle)
    private readonly repository: Repository<Vehicle>,
  ) {}

  findAll(): Promise<Vehicle[]> {
    return this.repository.find();
  }

  findById(id: number): Promise<Vehicle | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  findByPlate(plate: string): Promise<Vehicle | null> {
    return this.repository.findOne({
      where: { plate },
    });
  }

  create(data: Partial<Vehicle>): Promise<Vehicle> {
    const vehicle = this.repository.create(data);
    return this.repository.save(vehicle);
  }

  /**
   * Persists updates without physically deleting the vehicle.
   */
  save(vehicle: Vehicle): Promise<Vehicle> {
    return this.repository.save(vehicle);
  }
}