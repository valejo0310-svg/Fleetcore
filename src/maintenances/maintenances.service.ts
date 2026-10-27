import {  BadRequestException,  ConflictException,  Injectable,  NotFoundException,} from '@nestjs/common';

import { MaintenancesDao } from './dao/maintenance.dao.js';
import {  Maintenance,  MaintenanceStatus,} from './entities/maintenances.entity.js';

import { CreateMaintenanceDto } from './dto/create-maintenances.js';
import { CompleteMaintenanceDto } from './dto/complete-maintenances.js';

import { VehiclesService } from '../vehicles/vehicles.service.js';
import { VehiclesDao } from '../vehicles/dao/vehicles.dao.js';
import { VehicleStatus } from '../vehicles/entities/vehicle.entity.js';

import { MechanicsService } from '../mechanics/mechanics.service.js';
import { MechanicStatus } from '../mechanics/entities/mechanic.entity.js';

import { WorkshopsService } from '../workshops/workshops.service.js';
import { WorkshopStatus } from '../workshops/entities/workshop.entity.js';

@Injectable()
export class MaintenancesService {
  constructor(
    private readonly maintenancesDao: MaintenancesDao,
    private readonly vehiclesService: VehiclesService,
    private readonly vehiclesDao: VehiclesDao,
    private readonly mechanicsService: MechanicsService,
    private readonly workshopsService: WorkshopsService,
  ) {}

  // Schedule maintenance after checking availability and mileage.
  async create(dto: CreateMaintenanceDto): Promise<Maintenance> {
    const vehicle = await this.vehiclesService.findOne(dto.vehicleId);
    const mechanic = await this.mechanicsService.findOne(dto.mechanicId);
    const workshop = await this.workshopsService.findOne(dto.workshopId);

    if (vehicle.status === VehicleStatus.INACTIVE) {
      throw new ConflictException('Inactive vehicle cannot be scheduled');
    }

    if (vehicle.status === VehicleStatus.IN_MAINTENANCE) {
      throw new ConflictException('Vehicle is under maintenance');
    }

    if (mechanic.status !== MechanicStatus.ACTIVE) {
      throw new ConflictException('Mechanic is inactive');
    }

    if (workshop.status !== WorkshopStatus.ACTIVE) {
      throw new ConflictException('Workshop is inactive');
    }

    if (dto.mileage < vehicle.mileage) {
      throw new BadRequestException(
        'Maintenance mileage cannot be less than vehicle mileage',
      );
    }

    const scheduledAt = new Date(dto.scheduledAt);
    const scheduledEnd = new Date(dto.scheduledEnd);

    if (scheduledEnd <= scheduledAt) {
      throw new BadRequestException(
        'Scheduled end must be after scheduled start',
      );
    }

    const vehicleConflict =
      await this.maintenancesDao.findActiveByVehicle(vehicle.id);

    if (vehicleConflict) {
      throw new ConflictException(
        'Vehicle already has an active maintenance',
      );
    }

    const mechanicConflict =
      await this.maintenancesDao.findMechanicConflict(
        mechanic.id,
        scheduledAt,
        scheduledEnd,
      );

    if (mechanicConflict) {
      throw new ConflictException(
        'Mechanic has an overlapping maintenance',
      );
    }

    return this.maintenancesDao.create({
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
    await this.vehiclesService.findOne(vehicleId);
    return this.maintenancesDao.findByVehicleId(vehicleId);
  }

  // Technicians can consult maintenance assigned to their profile.
  async findMine(userId: number): Promise<Maintenance[]> {
    const mechanic = await this.mechanicsService.findMine(userId);
    return this.maintenancesDao.findByMechanicId(mechanic.id);
  }

  // Start scheduled maintenance and update the vehicle status.
  async start(id: number): Promise<Maintenance> {
    const maintenance = await this.findOne(id);

    if (maintenance.status !== MaintenanceStatus.SCHEDULED) {
      throw new ConflictException(
        'Only scheduled maintenance can be started',
      );
    }

    const vehicle =
      await this.vehiclesService.findOne(maintenance.vehicleId);

    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      throw new ConflictException('Vehicle is not available');
    }

    maintenance.status = MaintenanceStatus.IN_PROGRESS;
    await this.maintenancesDao.save(maintenance);

    vehicle.status = VehicleStatus.IN_MAINTENANCE;
    await this.vehiclesDao.save(vehicle);

    return maintenance;
  }

  // Complete maintenance and update the vehicle mileage.
  async complete(
    id: number,
    dto: CompleteMaintenanceDto,
  ): Promise<Maintenance> {
    const maintenance = await this.findOne(id);

    if (maintenance.status !== MaintenanceStatus.IN_PROGRESS) {
      throw new ConflictException(
        'Only maintenance in progress can be completed',
      );
    }

    const vehicle =
      await this.vehiclesService.findOne(maintenance.vehicleId);

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

    await this.maintenancesDao.save(maintenance);

    vehicle.mileage = dto.finalMileage;
    vehicle.status = VehicleStatus.AVAILABLE;
    await this.vehiclesDao.save(vehicle);

    return maintenance;
  }

  // Cancel maintenance without deleting its history.
  async cancel(id: number): Promise<Maintenance> {
    const maintenance = await this.findOne(id);

    if (
      maintenance.status === MaintenanceStatus.COMPLETED ||
      maintenance.status === MaintenanceStatus.CANCELLED
    ) {
      throw new ConflictException(
        'Completed or cancelled maintenance cannot be cancelled again',
      );
    }

    const wasInProgress =
      maintenance.status === MaintenanceStatus.IN_PROGRESS;

    maintenance.status = MaintenanceStatus.CANCELLED;
    await this.maintenancesDao.save(maintenance);

    if (wasInProgress) {
      const vehicle =
        await this.vehiclesService.findOne(maintenance.vehicleId);

      vehicle.status = VehicleStatus.AVAILABLE;
      await this.vehiclesDao.save(vehicle);
    }

    return maintenance;
  }
}
