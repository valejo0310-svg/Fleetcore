import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Mechanic } from '../entities/mechanic.entity.js';

@Injectable()
export class MechanicsDao {
  constructor(
    @InjectRepository(Mechanic)
    private readonly repository: Repository<Mechanic>,
  ) {}

  findAll(): Promise<Mechanic[]> {
    return this.repository.find();
  }

  findById(id: number): Promise<Mechanic | null> {
    return this.repository.findOneBy({ id });
  }

  findByEmail(email: string): Promise<Mechanic | null> {
    return this.repository.findOneBy({ email });
  }

  findByUserId(userId: number): Promise<Mechanic | null> {
    return this.repository.findOneBy({ userId });
  }

  create(data: Partial<Mechanic>): Promise<Mechanic> {
    const mechanic = this.repository.create(data);
    return this.repository.save(mechanic);
  }

  save(mechanic: Mechanic): Promise<Mechanic> {
    return this.repository.save(mechanic);
  }
}
