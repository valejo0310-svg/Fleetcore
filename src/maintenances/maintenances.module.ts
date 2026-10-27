import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Maintenance } from './entities/maintenances.entity.js';
import { MaintenancesDao } from './dao/maintenance.dao.js';
import { MaintenancesService } from './maintenances.service.js';
import { MaintenancesController } from './maintenances.controller.js';

import { AuthModule } from '../auth/auth.module.js';
import { VehiclesModule } from '../vehicles/vehicles.module.js';
import { MechanicsModule } from '../mechanics/mechanics.module.js';
import { WorkshopsModule } from '../workshops/workshops.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Maintenance]),
    AuthModule,
    VehiclesModule,
    MechanicsModule,
    WorkshopsModule,
  ],
  controllers: [MaintenancesController],
  providers: [
    MaintenancesDao,
    MaintenancesService,
  ],
  exports: [MaintenancesService],
})
export class MaintenancesModule {}
