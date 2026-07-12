import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum EstadoPrestamo {
  ACTIVO = 'ACTIVO',
  DEVUELTO = 'DEVUELTO',
}

@Entity('prestamos')
export class Prestamo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  libroId: string;

  @Column()
  usuario: string;

  @CreateDateColumn()
  fechaPrestamo: Date;

  @Column({ type: 'varchar', default: EstadoPrestamo.ACTIVO })
  estado: EstadoPrestamo;
}
