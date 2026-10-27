import {  Injectable,  NotFoundException,} from '@nestjs/common';

import { WorkshopsDao } from './dao/workshop.dao.js';
import {
  Workshop,
  WorkshopStatus,
} from './entities/workshop.entity.js';

import { CreateWorkshopDto } from './dto/create-workshop.dto.js';
import { UpdateWorkshopDto } from './dto/update-workshop.dto.js';

@Injectable()
export class WorkshopsService {
  constructor(
    private readonly workshopsDao: WorkshopsDao,
  ) {}

  // New workshops are active by default.
  create(dto: CreateWorkshopDto): Promise<Workshop> {
    return this.workshopsDao.create({
      ...dto,
      status: WorkshopStatus.ACTIVE,
    });
  }

  findActive(): Promise<Workshop[]> {
    return this.workshopsDao.findActive();
  }

  async findOne(id: number): Promise<Workshop> {
    const workshop = await this.workshopsDao.findById(id);

    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }

    return workshop;
  }

  async update(
    id: number,
    dto: UpdateWorkshopDto,
  ): Promise<Workshop> {
    const workshop = await this.findOne(id);

    if (dto.name !== undefined) {
      workshop.name = dto.name;
    }

    if (dto.address !== undefined) {
      workshop.address = dto.address;
    }

    return this.workshopsDao.save(workshop);
  }

  // Activate or deactivate a workshop.
  async updateStatus(
    id: number,
    status: WorkshopStatus,
  ): Promise<Workshop> {
    const workshop = await this.findOne(id);
    workshop.status = status;

    return this.workshopsDao.save(workshop);
  }
}
