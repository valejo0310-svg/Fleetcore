import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { Vehicle } from './entities/vehicle.entity.js';
import { VehiclesDao } from './dao/vehicles.dao.js';
import { VehiclesService } from './vehicles.service.js';
import { VehiclesController } from './vehicles.controller.js';

/**
 * Registers vehicle dependencies and database access.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle]),
    AuthModule,],
  controllers: [VehiclesController],
  providers: [VehiclesService, VehiclesDao],
  exports: [VehiclesService, VehiclesDao],
})
export class VehiclesModule {}