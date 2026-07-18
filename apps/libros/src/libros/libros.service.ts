import { Injectable, NotFoundException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Libro } from './entities/libro.entity';
import { CreateLibroDto } from './dto/create-libro.dto';
import { UpdateLibroDto } from './dto/update-libro.dto';

@Injectable()
export class LibrosService {
  constructor(
    @InjectRepository(Libro)
    private readonly libroRepository: Repository<Libro>,
  ) {}

  create(dto: CreateLibroDto) {
    const libro = this.libroRepository.create(dto);
    return this.libroRepository.save(libro);
  }

  findAll() {
    return this.libroRepository.find();
  }

  async findOne(id: string): Promise<Libro> {
    const libro = await this.libroRepository.findOneBy({ id });
    if (!libro) {
      throw new NotFoundException(`Libro ${id} no encontrado`);
    }
    return libro;
  }

  async update(id: string, dto: UpdateLibroDto) {
    const libro = await this.findOne(id);
    Object.assign(libro, dto);
    return this.libroRepository.save(libro);
  }

  async remove(id: string) {
    const libro = await this.findOne(id);
    await this.libroRepository.remove(libro);
    return { eliminado: true, id };
  }

  async verificarDisponibilidad(id: string) {
    const libro = await this.findOne(id);
    return { id: libro.id, disponible: libro.disponible };
  }

  async obtenerLibroGrpc(id: string) {
    try {
      return await this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new RpcException({ statusCode: 404, message: error.message });
      }
      throw new RpcException({
        statusCode: 500,
        message: (error as Error)?.message ?? 'Error obteniendo libro por gRPC',
      });
    }
  }

  async marcarComoPrestado(id: string) {
    const libro = await this.findOne(id);
    libro.disponible = false;
    return this.libroRepository.save(libro);
  }

  async marcarComoDisponible(id: string) {
    const libro = await this.findOne(id);
    libro.disponible = true;
    return this.libroRepository.save(libro);
  }
}
