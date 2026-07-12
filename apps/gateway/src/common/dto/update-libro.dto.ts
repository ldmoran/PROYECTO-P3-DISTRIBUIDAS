import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateLibroDto {
  @IsString()
  @IsOptional()
  titulo?: string;

  @IsString()
  @IsOptional()
  autor?: string;

  @IsString()
  @IsOptional()
  isbn?: string;

  @IsBoolean()
  @IsOptional()
  disponible?: boolean;
}
