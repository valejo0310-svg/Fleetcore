
import { IsEnum } from 'class-validator';
import { MaintenanceStatus } from '../entities/maintenances.entity.js';

export class UpdateMaintenanceStatusDto {
  @IsEnum(MaintenanceStatus)
  status: MaintenanceStatus;
}
