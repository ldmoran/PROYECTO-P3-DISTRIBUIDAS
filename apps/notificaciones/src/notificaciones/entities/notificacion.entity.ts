import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  prestamoId: string;

  @Column()
  mensaje: string;

  @CreateDateColumn()
  fechaEnvio: Date;
}
