import {  IsInt,  IsNotEmpty,  IsNumber,  IsString,  Min,} from 'class-validator';

export class CompleteMaintenanceDto {
  @IsString()
  @IsNotEmpty()
  workPerformed: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  finalCost: number;

  @IsInt()
  @Min(0)
  finalMileage: number;
}
