import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreatePrestamoDto {
  @IsUUID()
  libroId: string;

  @IsString()
  @IsNotEmpty()
  usuario: string;
}
