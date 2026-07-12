import { IsUUID } from 'class-validator';

export class TestSyncDto {
  @IsUUID()
  libroId: string;
}
