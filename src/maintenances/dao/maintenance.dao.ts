import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {  Maintenance,  MaintenanceStatus,} from '../entities/maintenances.entity.js';

@Injectable()
export class MaintenancesDao {
  constructor(
    @InjectRepository(Maintenance)
    private readonly repository: Repository<Maintenance>,
  ) {}

  // Retrieve all maintenance records.
  findAll(): Promise<Maintenance[]> {
    return this.repository.find({
      relations: {
        vehicle: true,
        mechanic: true,
        workshop: true,
      },
      order: { id: 'DESC' },
    });
  }

  findById(id: number): Promise<Maintenance | null> {
    return this.repository.findOne({
      where: { id },
      relations: {
        vehicle: true,
        mechanic: true,
        workshop: true,
      },
    });
  }

  // Retrieve maintenance history for a vehicle.
  findByVehicleId(vehicleId: number): Promise<Maintenance[]> {
    return this.repository.find({
      where: { vehicleId },
      order: { id: 'DESC' },
    });
  }

  // Retrieve maintenance assigned to a mechanic.
  findByMechanicId(mechanicId: number): Promise<Maintenance[]> {
    return this.repository.find({
      where: { mechanicId },
      order: { id: 'DESC' },
    });
  }

  // A vehicle cannot have another active maintenance record.
  findActiveByVehicle(
    vehicleId: number,
  ): Promise<Maintenance | null> {
    return this.repository.findOne({
      where: [
        { vehicleId, status: MaintenanceStatus.SCHEDULED },
        { vehicleId, status: MaintenanceStatus.IN_PROGRESS },
      ],
    });
  }

  // Detect overlapping maintenance intervals for a mechanic.
  findMechanicConflict(
    mechanicId: number,
    scheduledAt: Date,
    scheduledEnd: Date,
  ): Promise<Maintenance | null> {
    return this.repository
      .createQueryBuilder('maintenance')
      .where('maintenance.mechanicId = :mechanicId', {
        mechanicId,
      })
      .andWhere('maintenance.status IN (:...statuses)', {
        statuses: [
          MaintenanceStatus.SCHEDULED,
          MaintenanceStatus.IN_PROGRESS,
        ],
      })
      .andWhere('maintenance.scheduledAt < :scheduledEnd', {
        scheduledEnd,
      })
      .andWhere('maintenance.scheduledEnd > :scheduledAt', {
        scheduledAt,
      })
      .getOne();
  }

  create(data: Partial<Maintenance>): Promise<Maintenance> {
    const maintenance = this.repository.create(data);
    return this.repository.save(maintenance);
  }

  save(maintenance: Maintenance): Promise<Maintenance> {
    return this.repository.save(maintenance);
  }
}
