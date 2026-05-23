import { IsString, IsNumber, IsArray, IsOptional, Min, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

export class CreateProductDto {
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => sanitizeHtml(value, { allowedTags: [] }))
  name: string;

  @IsString()
  @MaxLength(10000)
  @Transform(({ value }) => sanitizeHtml(value, { allowedTags: ['b', 'i', 'p', 'br'] }))
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  category: string;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  stock?: number;
}
