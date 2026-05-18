import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum UserRole {
  BUYER = 'BUYER',
  DESIGNER = 'DESIGNER',
  SUPPLIER = 'SUPPLIER',
}

export class SignupDto {
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
