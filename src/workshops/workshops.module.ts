import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Workshop } from './entities/workshop.entity.js';
import { WorkshopsDao } from './dao/workshop.dao.js';
import { WorkshopsService } from './workshops.service.js';
import { WorkshopsController } from './workshops.controller.js';

import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workshop]),
    AuthModule,
  ],
  controllers: [WorkshopsController],
  providers: [WorkshopsDao, WorkshopsService],
  exports: [WorkshopsService, WorkshopsDao],
})
export class WorkshopsModule {}
