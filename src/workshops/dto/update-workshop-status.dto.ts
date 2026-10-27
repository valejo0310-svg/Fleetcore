import { IsEnum } from 'class-validator';
import { WorkshopStatus } from '../entities/workshop.entity.js';

export class UpdateWorkshopStatusDto {
  @IsEnum(WorkshopStatus)
  status: WorkshopStatus;
}
