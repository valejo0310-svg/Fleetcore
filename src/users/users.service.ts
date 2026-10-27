import { Injectable, ConflictException, NotFoundException,} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UsersDao } from './dao/users.dao.js';
import { User, UserRole } from './entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(private readonly usersDao: UsersDao) {}

  async create(
    email: string,
    password: string,
    role: UserRole = UserRole.TECHNICIAN,
  ): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await this.usersDao.findByEmail(
      normalizedEmail,
    );

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Hash the password before saving the user.
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const user = await this.usersDao.create(
        normalizedEmail,
        passwordHash,
        role,
      );

      delete (user as Partial<User>).passwordHash;

      return user;
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'driverError' in error &&
        typeof error.driverError === 'object' &&
        error.driverError !== null &&
        'code' in error.driverError &&
        error.driverError.code === '23505'
      ) {
        throw new ConflictException('Email already registered');
      }

      throw error;
    }
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersDao.findByEmail(
      email.trim().toLowerCase(),
    );
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersDao.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Compare the submitted password against the stored hash.
  verifyPassword(
    passwordHash: string,
    password: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}
