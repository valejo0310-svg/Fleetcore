import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Mechanic } from './entities/mechanic.entity.js';
import { MechanicsDao } from './dao/mechanics.dao.js';
import { MechanicsService } from './mechanics.service.js';
import { MechanicsController } from './mechanics.controller.js';

import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mechanic]),
    AuthModule,
    UsersModule,
  ],
  controllers: [MechanicsController],
  providers: [MechanicsDao, MechanicsService],
  exports: [MechanicsService, MechanicsDao],
})
export class MechanicsModule {}
