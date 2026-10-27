import {  IsEmail,  IsInt,  IsNotEmpty,  IsOptional,  IsString,  MaxLength,  Min,} from 'class-validator';

export class CreateMechanicDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  specialty: string;

  // An account link is optional when creating a mechanic.
  @IsOptional()
  @IsInt()
  @Min(1)
  userId?: number;
}
