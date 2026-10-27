import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Workshop, WorkshopStatus,} from '../entities/workshop.entity.js';

@Injectable()
export class WorkshopsDao {
  constructor(
    @InjectRepository(Workshop)
    private readonly repository: Repository<Workshop>,
  ) {}

  // Return only workshops available for operations.
  findActive(): Promise<Workshop[]> {
    return this.repository.find({
      where: { status: WorkshopStatus.ACTIVE },
    });
  }

  findById(id: number): Promise<Workshop | null> {
    return this.repository.findOneBy({ id });
  }

  create(data: Partial<Workshop>): Promise<Workshop> {
    const workshop = this.repository.create(data);
    return this.repository.save(workshop);
  }

  save(workshop: Workshop): Promise<Workshop> {
    return this.repository.save(workshop);
  }
}
