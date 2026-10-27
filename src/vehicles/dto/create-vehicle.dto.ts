import { IsString, IsNotEmpty, IsInt, Min, Max, MaxLength,} from 'class-validator';

/**
 * Validates the information required to register a vehicle.
 */
export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  plate: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  brand: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  model: string;

  @IsInt()
  @Min(1900)
  @Max(2100)
  year: number;

  @IsInt()
  @Min(0)
  mileage: number;
}