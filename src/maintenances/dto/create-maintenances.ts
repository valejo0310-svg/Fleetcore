import {  IsEnum,  IsInt,  IsNotEmpty,  IsString,  IsDateString,  Min,} from 'class-validator';

import { MaintenanceType } from '../entities/maintenances.entity.js';

export class CreateMaintenanceDto {
  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  @Min(0)
  mileage: number;

  @IsDateString()
  scheduledAt: string;

  @IsDateString()
  scheduledEnd: string;

  @IsInt()
  @Min(1)
  vehicleId: number;

  @IsInt()
  @Min(1)
  mechanicId: number;

  @IsInt()
  @Min(1)
  workshopId: number;
}
