import { PartialType } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto.js';

/**
 * Allows partial updates to vehicle information.
 */
export class UpdateVehicleDto extends PartialType(
  CreateVehicleDto,
) {}