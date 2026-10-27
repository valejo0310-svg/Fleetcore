import {  BadRequestException,  ConflictException,  Injectable,  NotFoundException,} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { MaintenancesDao } from './dao/maintenance.dao.js';
import {  Maintenance,  MaintenanceStatus,} from './entities/maintenances.entity.js';

import { CreateMaintenanceDto } from './dto/create-maintenances.js';
import { CompleteMaintenanceDto } from './dto/complete-maintenances.js';

import {  Vehicle,  VehicleStatus,} from '../vehicles/entities/vehicle.entity.js';

import {  Mechanic,  MechanicStatus,} from '../mechanics/entities/mechanic.entity.js';

import {  Workshop,  WorkshopStatus,} from '../workshops/entities/workshop.entity.js';

import { MechanicsService } from '../mechanics/mechanics.service.js';

@Injectable()
export class MaintenancesService {
  constructor(
    private readonly maintenancesDao: MaintenancesDao,
    private readonly dataSource: DataSource,
    private readonly mechanicsService: MechanicsService,
  ) {}

  // Lock the vehicle before modifying its maintenance state.
  private async lockVehicle(
    manager: EntityManager,
    id: number,
  ): Promise<Vehicle> {
    const vehicle = await manager.getRepository(Vehicle).findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  // Lock an existing maintenance record inside the transaction.
  private async lockMaintenance(
    manager: EntityManager,
    id: number,
  ): Promise<Maintenance> {
    const maintenance = await manager
      .getRepository(Maintenance)
      .findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

    if (!maintenance) {
      throw new NotFoundException('Maintenance not found');
    }

    return maintenance;
  }

  // Resolve the vehicle before locking rows in a consistent order.
  private async transactionForMaintenance(
    id: number,
    action: (
      manager: EntityManager,
      maintenance: Maintenance,
      vehicle: Vehicle,
    ) => Promise<Maintenance>,
  ): Promise<Maintenance> {
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager
        .getRepository(Maintenance)
        .findOneBy({ id });

      if (!existing) {
        throw new NotFoundException('Maintenance not found');
      }

      const vehicle = await this.lockVehicle(
        manager,
        existing.vehicleId,
      );

      const maintenance = await this.lockMaintenance(manager, id);

      return action(manager, maintenance, vehicle);
    });
  }

  // Schedule maintenance with resource locks and conflict checks.
  async create(dto: CreateMaintenanceDto): Promise<Maintenance> {
    const scheduledAt = new Date(dto.scheduledAt);
    const scheduledEnd = new Date(dto.scheduledEnd);

    if (
      Number.isNaN(scheduledAt.getTime()) ||
      Number.isNaN(scheduledEnd.getTime()) ||
      scheduledEnd <= scheduledAt
    ) {
      throw new BadRequestException('Invalid maintenance schedule');
    }

    return this.dataSource.transaction(async (manager) => {
      const vehicle = await this.lockVehicle(manager, dto.vehicleId);

      const mechanic = await manager
        .getRepository(Mechanic)
        .findOne({
          where: { id: dto.mechanicId },
          lock: { mode: 'pessimistic_write' },
        });

      if (!mechanic) {
        throw new NotFoundException('Mechanic not found');
      }

      const workshop = await manager
        .getRepository(Workshop)
        .findOneBy({ id: dto.workshopId });

      if (!workshop) {
        throw new NotFoundException('Workshop not found');
      }

      if (vehicle.status !== VehicleStatus.AVAILABLE) {
        throw new ConflictException('Vehicle is not available');
      }

      if (mechanic.status !== MechanicStatus.ACTIVE) {
        throw new ConflictException('Mechanic is inactive');
      }

      if (workshop.status !== WorkshopStatus.ACTIVE) {
        throw new ConflictException('Workshop is inactive');
      }

      if (dto.mileage < vehicle.mileage) {
        throw new BadRequestException(
          'Maintenance mileage cannot be lower than vehicle mileage',
        );
      }

      const repository = manager.getRepository(Maintenance);

      const activeStatuses = [
        MaintenanceStatus.SCHEDULED,
        MaintenanceStatus.IN_PROGRESS,
      ];

      const vehicleConflict = await repository
        .createQueryBuilder('maintenance')
        .where('maintenance.vehicleId = :vehicleId', {
          vehicleId: vehicle.id,
        })
        .andWhere('maintenance.status IN (:...statuses)', {
          statuses: activeStatuses,
        })
        .getOne();

      if (vehicleConflict) {
        throw new ConflictException(
          'Vehicle already has an active maintenance',
        );
      }

      // Allow adjacent intervals but reject overlapping intervals.
      const mechanicConflict = await repository
        .createQueryBuilder('maintenance')
        .where('maintenance.mechanicId = :mechanicId', {
          mechanicId: mechanic.id,
        })
        .andWhere('maintenance.status IN (:...statuses)', {
          statuses: activeStatuses,
        })
        .andWhere('maintenance.scheduledAt < :scheduledEnd', {
          scheduledEnd,
        })
        .andWhere('maintenance.scheduledEnd > :scheduledAt', {
          scheduledAt,
        })
        .getOne();

      if (mechanicConflict) {
        throw new ConflictException(
          'Mechanic has an overlapping maintenance',
        );
      }

      const maintenance = repository.create({
        type: dto.type,
        description: dto.description,
        mileage: dto.mileage,
        scheduledAt,
        scheduledEnd,
        vehicleId: vehicle.id,
        mechanicId: mechanic.id,
        workshopId: workshop.id,
        status: MaintenanceStatus.SCHEDULED,
      });

      return repository.save(maintenance);
    });
  }

  findAll(): Promise<Maintenance[]> {
    return this.maintenancesDao.findAll();
  }

  async findOne(id: number): Promise<Maintenance> {
    const maintenance = await this.maintenancesDao.findById(id);

    if (!maintenance) {
      throw new NotFoundException('Maintenance not found');
    }

    return maintenance;
  }

  async findByVehicleId(vehicleId: number): Promise<Maintenance[]> {
    const vehicle = await this.dataSource
      .getRepository(Vehicle)
      .findOneBy({ id: vehicleId });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return this.maintenancesDao.findByVehicleId(vehicleId);
  }

  async findMine(userId: number): Promise<Maintenance[]> {
    const mechanic = await this.mechanicsService.findMine(userId);

    return this.maintenancesDao.findByMechanicId(mechanic.id);
  }

  // Start maintenance and update the vehicle atomically.
  async start(id: number): Promise<Maintenance> {
    return this.transactionForMaintenance(
      id,
      async (manager, maintenance, vehicle) => {
        if (maintenance.status !== MaintenanceStatus.SCHEDULED) {
          throw new ConflictException(
            'Only scheduled maintenance can be started',
          );
        }

        if (vehicle.status !== VehicleStatus.AVAILABLE) {
          throw new ConflictException('Vehicle is not available');
        }

        maintenance.status = MaintenanceStatus.IN_PROGRESS;
        vehicle.status = VehicleStatus.IN_MAINTENANCE;

        await manager.save(Vehicle, vehicle);
        return manager.save(Maintenance, maintenance);
      },
    );
  }

  // Complete maintenance and update mileage atomically.
  async complete(
    id: number,
    dto: CompleteMaintenanceDto,
  ): Promise<Maintenance> {
    return this.transactionForMaintenance(
      id,
      async (manager, maintenance, vehicle) => {
        if (maintenance.status !== MaintenanceStatus.IN_PROGRESS) {
          throw new ConflictException(
            'Only maintenance in progress can be completed',
          );
        }

        if (vehicle.status !== VehicleStatus.IN_MAINTENANCE) {
          throw new ConflictException(
            'Vehicle maintenance status is inconsistent',
          );
        }

        if (
          dto.finalMileage < maintenance.mileage ||
          dto.finalMileage < vehicle.mileage
        ) {
          throw new BadRequestException(
            'Final mileage cannot be lower than recorded mileage',
          );
        }

        maintenance.workPerformed = dto.workPerformed;
        maintenance.finalCost = dto.finalCost.toFixed(2);
        maintenance.finalMileage = dto.finalMileage;
        maintenance.finishedAt = new Date();
        maintenance.status = MaintenanceStatus.COMPLETED;

        vehicle.mileage = dto.finalMileage;
        vehicle.status = VehicleStatus.AVAILABLE;

        await manager.save(Vehicle, vehicle);
        return manager.save(Maintenance, maintenance);
      },
    );
  }

  // Cancel maintenance without deleting its history.
  async cancel(id: number): Promise<Maintenance> {
    return this.transactionForMaintenance(
      id,
      async (manager, maintenance, vehicle) => {
        if (
          maintenance.status === MaintenanceStatus.COMPLETED ||
          maintenance.status === MaintenanceStatus.CANCELLED
        ) {
          throw new ConflictException(
            'Completed or cancelled maintenance cannot be cancelled',
          );
        }

        if (maintenance.status === MaintenanceStatus.IN_PROGRESS) {
          if (vehicle.status !== VehicleStatus.IN_MAINTENANCE) {
            throw new ConflictException(
              'Vehicle maintenance status is inconsistent',
            );
          }

          vehicle.status = VehicleStatus.AVAILABLE;
          await manager.save(Vehicle, vehicle);
        }

        maintenance.status = MaintenanceStatus.CANCELLED;

        return manager.save(Maintenance, maintenance);
      },
    );
  }
}
