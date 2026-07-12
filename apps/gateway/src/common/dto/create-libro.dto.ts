import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLibroDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  autor: string;

  @IsString()
  @IsNotEmpty()
  isbn: string;

  @IsBoolean()
  @IsOptional()
  disponible?: boolean;
}
