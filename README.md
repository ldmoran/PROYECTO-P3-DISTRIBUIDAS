# PROYECTO-P3-DISTRIBUIDAS
Integrantes: David Moran, Gabriel Vivanco, Alison Miranda, Samir Mideros

# Sistema de Gestión de Biblioteca Universitaria

## Descripción del proyecto

El proyecto consiste en desarrollar un **Sistema de Gestión de Biblioteca Universitaria** basado en una arquitectura de microservicios. El objetivo es permitir la administración de libros y préstamos, además de generar notificaciones relacionadas con las operaciones realizadas por los usuarios.

El sistema se desarrollará siguiendo una arquitectura distribuida compuesta por un **API Gateway** y **tres microservicios independientes**, los cuales se comunicarán mediante mecanismos síncronos y asíncronos. Esto permitirá analizar el comportamiento de ambos modelos de comunicación y demostrar conceptos como el **acoplamiento temporal** y la **acumulación de latencia**, objetivos principales del primer avance del proyecto.

El dominio del sistema se mantiene sencillo para enfocar el desarrollo en la arquitectura de microservicios, los mecanismos de comunicación y las buenas prácticas de diseño, en lugar de la complejidad de la lógica de negocio.

## Arquitectura del sistema

El sistema estará conformado por los siguientes componentes:

* API Gateway
* Microservicio de Libros
* Microservicio de Préstamos
* Microservicio de Notificaciones

## Microservicio 1: Gestión de Libros

Este microservicio será responsable de administrar el catálogo de libros disponibles en la biblioteca.

Sus principales funciones serán:

* Registrar nuevos libros.
* Consultar el catálogo de libros.
* Actualizar la información de un libro.
* Eliminar libros del catálogo.
* Verificar si un libro se encuentra disponible para préstamo.

Este microservicio proporcionará la información necesaria para que otros servicios puedan consultar la disponibilidad de un libro antes de realizar un préstamo.

## Microservicio 2: Gestión de Préstamos

Este microservicio será el núcleo del sistema y administrará los préstamos realizados por los usuarios.

Entre sus responsabilidades estarán:

* Registrar un préstamo.
* Consultar los préstamos existentes.
* Cambiar el estado de un préstamo.
* Consultar al microservicio de Libros para verificar la disponibilidad del ejemplar antes de confirmar el préstamo.

Este servicio se comunicará de forma síncrona con el microservicio de Libros mediante TCP.

Una vez registrado correctamente un préstamo, publicará un evento para informar que se ha realizado una nueva operación.

## Microservicio 3: Notificaciones

Este microservicio será responsable de procesar los eventos generados por el sistema.

Cuando el microservicio de Préstamos publique el evento "Préstamo Registrado", este servicio recibirá el mensaje mediante Redis y realizará el procesamiento correspondiente, por ejemplo:

* Registrar una notificación.
* Simular el envío de un correo electrónico.
* Registrar un mensaje en los logs del sistema.

Al utilizar eventos, este microservicio trabajará de forma asíncrona y no bloqueará la operación principal del préstamo.

## API Gateway

El API Gateway actuará como punto único de entrada para todas las solicitudes del sistema.

Sus responsabilidades serán:

* Recibir las peticiones HTTP del cliente.
* Redireccionar las solicitudes al microservicio correspondiente.
* Centralizar el acceso a los servicios.
* Facilitar futuras implementaciones de autenticación y autorización.

## Comunicación entre microservicios

### Comunicación síncrona (TCP)

El flujo será el siguiente:

Cliente → API Gateway → Microservicio de Préstamos → Microservicio de Libros

El microservicio de Préstamos esperará la respuesta del microservicio de Libros antes de completar la operación.

Este flujo permitirá demostrar:

* Acumulación de latencia.
* Acoplamiento temporal.

### Comunicación asíncrona (Redis)

Después de registrar correctamente un préstamo:

Microservicio de Préstamos → Redis → Microservicio de Notificaciones

En este caso, el microservicio de Préstamos publicará un evento sin esperar que el microservicio de Notificaciones termine de procesarlo.

Este flujo permitirá demostrar el desacoplamiento temporal mediante eventos.

## Tecnologías propuestas

* Frontend de pruebas: Postman o Thunder Client.
* API Gateway: NestJS.
* Microservicios: NestJS.
* Lenguaje: TypeScript.
* Base de datos: PostgreSQL.
* Persistencia: TypeORM.
* Comunicación síncrona: TCP.
* Comunicación asíncrona: Redis (Publish/Subscribe).
* Contenedores: Docker Compose.
* Control de versiones: Git y GitHub.

## Objetivo del primer avance

Implementar el MVP compuesto por un API Gateway y tres microservicios, demostrando experimentalmente la diferencia entre la comunicación síncrona y la comunicación basada en eventos, mediante la medición de latencias y la evidencia del acoplamiento temporal cuando uno de los servicios deja de estar disponible.
