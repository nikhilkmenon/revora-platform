import { IsString, IsNumber, IsArray, IsOptional, Min, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateFabricDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @MaxLength(2000)
  description: string;

  @IsNumber()
  @Min(0)
  pricePerYard: number;

  @IsNumber()
  @Min(1)
  moq: number;

  @IsNumber()
  @Min(1)
  stock: number;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsString()
  category: string;
}
