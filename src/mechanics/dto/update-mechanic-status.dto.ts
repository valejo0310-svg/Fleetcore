import { IsEnum } from 'class-validator';
import { MechanicStatus } from '../entities/mechanic.entity.js';

export class UpdateMechanicStatusDto {
  @IsEnum(MechanicStatus)
  status: MechanicStatus;
}
