import {  IsNotEmpty,  IsString,  MaxLength,} from 'class-validator';

export class CreateWorkshopDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address: string;
}
