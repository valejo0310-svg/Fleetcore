import { Injectable,  ConflictException,  NotFoundException,  BadRequestException,} from '@nestjs/common';

import { MechanicsDao } from './dao/mechanics.dao.js';
import {
  Mechanic,
  MechanicStatus,
} from './entities/mechanic.entity.js';

import { CreateMechanicDto } from './dto/create-mechanic.dto.js';
import { UpdateMechanicDto } from './dto/update-mechanic.dto.js';
import { UsersService } from '../users/users.service.js';
import { UserRole } from '../users/entities/user.entity.js';

@Injectable()
export class MechanicsService {
  constructor(
    private readonly mechanicsDao: MechanicsDao,
    private readonly usersService: UsersService,
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

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
        'Mechanic email or technician assignment already exists',
      );
    }

    throw error;
  }

  // Only technician accounts may be linked to mechanics.
  private async validateUser(
    userId: number,
    mechanicId?: number,
  ): Promise<void> {
    const user = await this.usersService.findById(userId);

    if (user.role !== UserRole.TECHNICIAN) {
      throw new BadRequestException(
        'Only TECHNICIAN users can be assigned to mechanics',
      );
    }

    const assigned = await this.mechanicsDao.findByUserId(userId);

    if (assigned && assigned.id !== mechanicId) {
      throw new ConflictException(
        'This user is already assigned to a mechanic',
      );
    }
  }

  async create(dto: CreateMechanicDto): Promise<Mechanic> {
    const email = this.normalizeEmail(dto.email);

    if (await this.mechanicsDao.findByEmail(email)) {
      throw new ConflictException('Mechanic email already exists');
    }

    if (dto.userId !== undefined) {
      await this.validateUser(dto.userId);
    }

    try {
      return await this.mechanicsDao.create({
        name: dto.name,
        email,
        specialty: dto.specialty,
        userId: dto.userId ?? null,
        status: MechanicStatus.ACTIVE,
      });
    } catch (error: unknown) {
      this.handleDatabaseError(error);
    }
  }

  findAll(): Promise<Mechanic[]> {
    return this.mechanicsDao.findAll();
  }

  async findOne(id: number): Promise<Mechanic> {
    const mechanic = await this.mechanicsDao.findById(id);

    if (!mechanic) {
      throw new NotFoundException('Mechanic not found');
    }

    return mechanic;
  }

  async findMine(userId: number): Promise<Mechanic> {
    const mechanic =
      await this.mechanicsDao.findByUserId(userId);

    if (!mechanic) {
      throw new NotFoundException(
        'No mechanic profile linked to this user',
      );
    }

    return mechanic;
  }

  async update(
    id: number,
    dto: UpdateMechanicDto,
  ): Promise<Mechanic> {
    const mechanic = await this.findOne(id);

    if (dto.email !== undefined) {
      const email = this.normalizeEmail(dto.email);
      const existing = await this.mechanicsDao.findByEmail(email);

      if (existing && existing.id !== id) {
        throw new ConflictException('Mechanic email already exists');
      }

      mechanic.email = email;
    }

    if (dto.userId !== undefined) {
      await this.validateUser(dto.userId, id);
      mechanic.userId = dto.userId;
    }

    if (dto.name !== undefined) {
      mechanic.name = dto.name;
    }

    if (dto.specialty !== undefined) {
      mechanic.specialty = dto.specialty;
    }

    try {
      return await this.mechanicsDao.save(mechanic);
    } catch (error: unknown) {
      this.handleDatabaseError(error);
    }
  }

  async updateStatus(
    id: number,
    status: MechanicStatus,
  ): Promise<Mechanic> {
    const mechanic = await this.findOne(id);
    mechanic.status = status;

    return this.mechanicsDao.save(mechanic);
  }
}
