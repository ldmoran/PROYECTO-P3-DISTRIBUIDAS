import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('libros')
export class Libro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column()
  autor: string;

  @Column({ unique: true })
  isbn: string;

  @Column({ default: true })
  disponible: boolean;
}
