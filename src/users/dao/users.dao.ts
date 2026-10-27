import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserRole } from '../entities/user.entity.js';

@Injectable()
export class UsersDao {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  // Include the password hash only when looking up login credentials.
  findByEmail(email: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  findById(id: number): Promise<User | null> {
    return this.repository.findOneBy({ id });
  }

  async create(
    email: string,
    passwordHash: string,
    role: UserRole,
  ): Promise<User> {
    const user = this.repository.create({
      email,
      passwordHash,
      role,
    });

    return this.repository.save(user);
  }
}
