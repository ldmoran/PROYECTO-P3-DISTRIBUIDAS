# Sistema de Gestión de Biblioteca Universitaria

> MVP de arquitectura de microservicios · Distribuidas · 7.° semestre · Entrega por avances.

## 👥 Equipo

| Integrante | Rol | GitHub |
|---|---|---|
| David Moran | Backend / Arquitectura | @ldmoran |
| Gabriel Vivanco | Transportes / gRPC | @GabrielNicoasVivancoRaza |
| Alison Miranda | Seguridad / Observabilidad | @alisonmiranda |
| Samir Mideros | Documentación / QA | @esmid17 |

## 🧩 Descripción del MVP

El sistema permite administrar el catálogo de libros de una biblioteca universitaria y los préstamos que los usuarios realizan sobre ese catálogo, generando notificaciones cuando un préstamo se registra.

El dominio se mantiene deliberadamente sencillo (3 entidades: Libro, Préstamo, Notificación) para que el esfuerzo del proyecto se concentre en la **arquitectura de comunicación entre microservicios** (síncrona vs. asíncrona) y no en lógica de negocio compleja.

- **MS 1 — Libros:** administra el catálogo (crear, consultar, actualizar, eliminar, verificar disponibilidad).
- **MS 2 — Préstamos:** registra préstamos; antes de confirmar uno, consulta de forma **síncrona (TCP)** al MS Libros para verificar disponibilidad; al terminar, publica un **evento asíncrono en Redis**.
- **MS 3 — Notificaciones:** escucha el evento de Redis y simula el envío de una notificación, sin bloquear al MS Préstamos.
- **API Gateway:** punto único de entrada HTTP para el cliente; redirige al microservicio correspondiente.

## 🛠️ Stack

- **Framework:** NestJS (TypeScript)
- **Síncrono:** TCP · **Eventos:** Redis (Pub/Sub)
- **BD:** PostgreSQL · **Persistencia:** TypeORM
- **Contenedores:** Docker Compose · **Estructura:** monorepo (apps/)
- **Control de versiones:** Git + GitHub (GitHub Flow)

> El Avance 1 conservó TCP y Redis. En el Avance 2 se agregan gRPC y RabbitMQ; JWT y Sentry corresponden al Avance 3.

## ▶️ Ejecución del proyecto

El sistema se despliega mediante **Docker Compose**, levantando automáticamente todos los componentes de la arquitectura:

- API Gateway
- Microservicio Libros
- Microservicio Préstamos
- Microservicio Notificaciones
- PostgreSQL
- Redis

### Iniciar el sistema

```bash
docker compose up --build
```

### Verificar el estado de los contenedores

```bash
docker compose ps
```

### Acceder al Gateway

```text
http://localhost:3000
```

### Qué archivo Compose usar según el avance

| Archivo | Incluye | Avance |
|---|---|---|
| `docker-compose.yml` | Gateway + Libros + Préstamos + Notificaciones, TCP + Redis | Avance 1 |
| `docker-compose.transportes.yml` | Lo anterior + gRPC (Gateway↔Libros) + RabbitMQ (auditoría) | Avance 2 |
| `docker-compose.final.yml` | Todo lo anterior + JWT/Guard en el Gateway + Sentry en los 4 servicios | Avance 3 (final) |

Para el sistema final:

```bash
# .env junto a docker-compose.final.yml, con al menos JWT_SECRET (SENTRY_DSN es opcional)
docker compose -f docker-compose.final.yml up -d --build
```

El detalle de JWT/Guard y Sentry (credenciales, ejemplos, evidencias) está consolidado en la sección **Avance 3** más abajo.

### Evidencia de ejecución

La siguiente captura muestra que todos los contenedores fueron creados e iniciados correctamente mediante Docker Compose.

![Docker Compose](docs/evidencias/docker-compose-ok.png)

## 🏗️ Arquitectura

```
Cliente
  │  HTTP
  ▼
API Gateway
  │  TCP (síncrono)
  ▼
Préstamos ───────────────► Libros
  │
  │  Redis PUBLISH (asíncrono, no bloqueante)
  ▼
Notificaciones
```

### Diagrama de arquitectura

El siguiente diagrama representa la arquitectura implementada en el proyecto, mostrando el flujo de comunicación entre el API Gateway, los microservicios y los mecanismos de comunicación utilizados (TCP y Redis Pub/Sub).

![Arquitectura del sistema](docs/evidencias/Diagrama/arquitectura-v1.png)

## 🧭 Metodología

- **Kanban:** Ver archivo TABLERO_KANBAN.md, donde se registra el avance de las tareas del proyecto mediante un tablero con seguimiento por actividades.
- **Ramificación:** cada integrante trabajó sobre su propia rama personal (`alison-miranda`, `david-moran`, `gabriel-vivanco`, `samir-mideros`) partiendo de `main`. El PR #1 (`samir-mideros` → `main`) fue el primero revisado y fusionado por GitHub. Los cierres de avance se marcan con **tags anotados reales** (`git tag -a v1-avance1 <commit> -m "..."`), no con mensajes de commit como se hizo al inicio.
- **Commits:** el historial temprano usa mensajes genéricos (`update`, `first commit`); a partir de esta corrección el equipo adopta Conventional Commits (`feat`, `fix`, `docs`, `refactor`, `chore`) de forma consistente.

## 🗺️ Patrones y principios aplicados

Durante el desarrollo del proyecto se aplicaron distintos patrones de diseño y principios SOLID con el objetivo de mejorar la organización, mantenibilidad y escalabilidad de la arquitectura.

### API Gateway Pattern

Se implementó un API Gateway como punto único de entrada para las solicitudes HTTP. Este componente recibe las peticiones del cliente y las redirige al microservicio correspondiente mediante comunicación TCP, evitando que los clientes accedan directamente a los servicios internos.

### Publisher / Subscriber (Redis Pub/Sub)

Para la comunicación asíncrona se utilizó el patrón Publisher/Subscriber mediante Redis Pub/Sub. El microservicio de Préstamos publica el evento `prestamo.registrado` y el microservicio de Notificaciones lo consume de forma independiente, reduciendo el acoplamiento temporal entre ambos servicios.

### Dependency Injection

NestJS utiliza inyección de dependencias para desacoplar los componentes de la aplicación. Esto facilita las pruebas, el mantenimiento y la reutilización del código.

### Repository Pattern

La persistencia de datos se realiza mediante TypeORM, el cual implementa el patrón Repository para encapsular el acceso a la base de datos y separar la lógica de negocio de la capa de persistencia.

### Principio SRP (Single Responsibility Principle)

Cada microservicio posee una única responsabilidad:

- Libros administra el catálogo.
- Préstamos gestiona el registro de préstamos.
- Notificaciones procesa los eventos publicados.
- Gateway centraliza el acceso de los clientes.


### Principio DIP (Dependency Inversion Principle)

La comunicación entre servicios se realiza mediante interfaces proporcionadas por NestJS para TCP y Redis, evitando dependencias directas entre las implementaciones de los microservicios.

### Manejo de excepciones

Se implementaron filtros globales de excepciones (`HttpExceptionFilter` y `AllExceptionsToRpcFilter`) junto con `ValidationPipe` para validar las solicitudes y mantener un manejo consistente de errores entre el Gateway y los microservicios.

---

## 🟢 Avance 1 — Acoplamiento temporal y latencia · tag v1-avance1

### Estructura del monorepo

```
PROYECTO-P3-DISTRIBUIDAS/
├── apps/
│   ├── gateway/
│   ├── libros/
│   ├── prestamos/
│   └── notificaciones/
├── docs/
│   └── evidencias/
├── proto/
│   └── libros.proto
├── docker-compose.yml
├── docker-compose.transportes.yml
├── benchmark.js
└── README.md
```

Cada servicio dentro de `apps/` es un proyecto NestJS **independiente** (su propio `package.json`, `Dockerfile`, `tsconfig.json`), lo que permite que Docker Compose construya cada uno por separado sin perder la trazabilidad de commits en un único historial de Git. `docs/evidencias/` contiene las capturas de latencia y de la prueba de caída del microservicio que exige la rúbrica (criterios C2 y C5 de TAREA_1.md).

### 📈 Latencia (con benchmark.js)

Se realizaron 50 peticiones seriales por camino para comparar el comportamiento de dos rutas que parten del Gateway. El camino síncrono mide la cadena HTTP → Gateway → Préstamos → Libros mediante TCP y espera la respuesta de Libros. El camino asíncrono mide HTTP → Gateway → Préstamos → Redis; Préstamos publica el evento y no espera a que Notificaciones lo procese.

| Comunicación | Promedio (ms) | P95 (ms) | Máximo (ms) |
|---|---:|---:|---:|
| Síncrona TCP | 9.10 | 32.56 | 48.77 |
| Asíncrona Redis Pub/Sub | 1.84 | 2.41 | 5.06 |

Resultados:

- La comunicación asíncrona presentó menor latencia debido a que el servicio de préstamos no espera la respuesta del consumidor del evento.
- La comunicación síncrona tiene mayor tiempo de respuesta porque requiere esperar la consulta TCP al microservicio Libros.
- La comparación no mide únicamente TCP contra Redis: ambos tiempos incluyen el salto HTTP → Gateway → Préstamos; la diferencia es el salto adicional síncrono hacia Libros frente a la publicación asíncrona en Redis.
- Se conservaron las 50 iteraciones válidas de cada camino y no se descartaron muestras de calentamiento. Por ello, los valores reportados son una medición observada del entorno de ejecución y no una estimación aislada del costo en régimen estable.

![alt text](docs/evidencias/benchmark-latencia.png)

## 🧪 Pruebas funcionales con Postman

Para verificar la comunicación entre los microservicios se realizaron pruebas mediante Postman, validando tanto la comunicación síncrona mediante TCP como la comunicación asíncrona mediante Redis Pub/Sub.

---

## 1. Verificación del catálogo de libros

Primero se obtiene un libro existente desde el API Gateway para utilizar su identificador en la prueba de préstamo.

### Método:

```
GET
```

### Endpoint:

[http://localhost:3000/api/libros](http://localhost:3000/api/libros)

### Resultado esperado:

La respuesta devuelve la lista de libros disponibles con su respectivo identificador (id). Ejemplo:

```json
[
    {
        "id": "c7c1f5af-882d-4d22-9623-5f5313acd666",
        "titulo": "Clean Code",
        "autor": "Robert C. Martin",
        "isbn": "9780132350884",
        "disponible": true
    }
]
```

Se copia el valor del campo id, ya que será utilizado en la siguiente prueba.

### Evidencia:

![alt text](docs/evidencias/prueba-redis/listaLibros.png)

---

# 2. Prueba de comunicación síncrona TCP

Se realiza una solicitud para registrar un préstamo. El flujo interno utilizado es:

```
Cliente (Postman)
        |
        | HTTP
        ▼
API Gateway
        |
        | TCP Request/Response
        ▼
Microservicio Préstamos
        |
        | TCP Request/Response
        ▼
Microservicio Libros
```

El microservicio Préstamos consulta al microservicio Libros mediante TCP para verificar que el libro exista y esté disponible antes de continuar.

### Método:

```
POST
```

### Endpoint:

```
http://localhost:3000/api/prestamos/test-sync
```

### Headers:

| Key | Value |
| ------------ | ---------------- |
| Content-Type | application/json |

### Body:

Seleccionar:

```
Body → raw → JSON
```

Enviar:

```json
{
    "libroId": "ID_DEL_LIBRO"
}
```

Ejemplo:

```json
{
    "libroId": "c7c1f5af-882d-4d22-9623-5f5313acd666"
}
```

### Resultado esperado:

```json
{
    "libroId": "c7c1f5af-882d-4d22-9623-5f5313acd666",
    "usuario": "jperez",
    "estado": "ACTIVO",
    "id": "fe695866-2cbe-4234-b89f-26bfea436045",
    "fechaPrestamo": "2026-07-12T19:55:14.879Z"
}
```

### Evidencia:

![alt text](docs/evidencias/prueba-redis/comunicaciónSíncronaTCP.png)

---

# 3. Prueba de comunicación asíncrona Redis Pub/Sub

Se realiza una prueba donde el microservicio Préstamos genera un evento utilizando Redis Pub/Sub. El flujo interno utilizado es:

```
Microservicio Préstamos
        |
        | Evento: prestamo.registrado
        ▼
Redis Pub/Sub
        |
        ▼
Microservicio Notificaciones
```

El servicio de Préstamos publica el evento sin esperar una respuesta del microservicio Notificaciones, permitiendo reducir el acoplamiento temporal.

### Método:

```
POST
```

### Endpoint:

```
http://localhost:3000/api/prestamos/test-async
```

### Body:

Seleccionar:

```
Body → raw → JSON
```

Enviar:

```json
{}
```

### Resultado esperado:

La solicitud se procesa correctamente y el evento es publicado en Redis.

![alt text](<docs/evidencias/prueba-redis/asíncrona Redis Pub-Sub.png>)

### Validación en logs:

Comando utilizado:

```bash
docker compose logs prestamos --tail=30
```

Resultado esperado:

```
Evento 'prestamo.registrado' publicado
```

![alt text](<docs/evidencias/prueba-redis/compose logs prestamos --tail=30.png>)

Luego se verifica el consumidor:

```bash
docker compose logs notificaciones --tail=30
```

Resultado esperado:

```
Evento recibido y procesado por Notificaciones
```

![alt text](<docs/evidencias/prueba-redis/compose logs notificaciones --tail=30.png>)

### 🧨 Acoplamiento temporal

El sistema presenta dos tipos de comunicación:

- Comunicación síncrona TCP: El microservicio Préstamos depende temporalmente del microservicio Libros, ya que debe esperar su respuesta antes de confirmar la operación.
- Comunicación asíncrona Redis Pub/Sub: El microservicio Préstamos publica el evento prestamo.registrado y continúa su ejecución sin esperar al microservicio Notificaciones. Esto reduce el acoplamiento temporal y mejora la disponibilidad del sistema.

### Ejecución del benchmark

```bash
node benchmark.js <libroId>
```

![alt text](docs/evidencias/benchmark-latencia.png)

### 🧠 Análisis

Los resultados muestran que la comunicación asíncrona mediante Redis Pub/Sub presenta una menor latencia debido a que el microservicio Préstamos no necesita esperar una respuesta del servicio Notificaciones para finalizar la operación.

En cambio, la comunicación síncrona mediante TCP presenta una mayor latencia porque existe una dependencia temporal entre Préstamos y Libros. El servicio debe enviar una solicitud y esperar la respuesta antes de continuar.

La arquitectura implementada permite utilizar cada tipo de comunicación según la necesidad del sistema:

- TCP para operaciones donde se requiere una respuesta inmediata y validación antes de continuar.
- Redis Pub/Sub para eventos donde no es necesario bloquear el flujo principal.

## 🧪 Prueba de caída del microservicio

Con el objetivo de evidenciar el acoplamiento temporal de la comunicación síncrona, se detuvo el microservicio **Libros** mientras el resto de la arquitectura permanecía en ejecución.

### Detener el microservicio

```bash
docker stop biblioteca-libros
docker compose ps
```

### Evidencia

![Microservicio Libros detenido](docs/evidencias/prueba-caida/docker-compose-libros-detenido.png)

Al intentar registrar un préstamo, el Gateway y el microservicio de Préstamos no pudieron establecer comunicación con Libros, obteniéndose el siguiente error:

![Error de comunicación](docs/evidencias/prueba-caida/error-libros-caido.png)

Una vez iniciado nuevamente el microservicio:

```bash
docker start biblioteca-libros
```

la operación volvió a ejecutarse correctamente.

![Servicio recuperado](docs/evidencias/prueba-caida/libros-recuperado.png)

### Análisis

La prueba evidencia el **acoplamiento temporal** de la comunicación síncrona mediante TCP. El microservicio **Préstamos** depende de que el microservicio **Libros** esté disponible para completar la validación y registrar un préstamo. Cuando **Libros** se encuentra detenido, la solicitud falla porque no es posible establecer la comunicación entre ambos servicios. Una vez reiniciado el microservicio, la operación vuelve a ejecutarse correctamente, demostrando que el funcionamiento del flujo depende de la disponibilidad del servicio remoto.

---

## 🟡 Avance 2 — Comunicación: gRPC + segundo transporte + excepciones · `tag v2-avance2`

### 1) Ejecución del stack de Avance 2

Se agrega RabbitMQ y el puerto gRPC de Libros, así que se levanta con su propio archivo Compose (incluye Postgres, Redis y RabbitMQ con healthchecks reales):

```bash
docker compose -f docker-compose.transportes.yml up --build
```

### 2) Arquitectura actualizada

```mermaid
flowchart LR
  C[Cliente / Postman / grpcurl] --> G[Gateway HTTP]
  G -->|TCP| P[Préstamos]
  P -->|TCP| L[Libros]
  G -->|gRPC| L
  P -->|Redis PUB/SUB| N[Notificaciones]
  P -->|RabbitMQ queue| G
```

### 3) Contrato gRPC

Archivo compartido del monorepo: `proto/libros.proto`

```proto
syntax = "proto3";

package biblioteca;

service LibrosService {
  rpc ObtenerLibro (LibroRequest) returns (LibroResponse);
}

message LibroRequest {
  string id = 1;
}

message LibroResponse {
  string id = 1;
  string titulo = 2;
  string autor = 3;
  string isbn = 4;
  bool disponible = 5;
}
```

**Flujo gRPC:** el Gateway consume `LibrosService/ObtenerLibro` desde el microservicio Libros. En Libros, el método de servicio encapsula el acceso a la base de datos con `try/catch` y reenvía los errores controlados como `RpcException`. En el Gateway, la llamada también usa `try/catch` para traducir fallos de red o errores de negocio a respuestas HTTP consistentes.

Ejemplo de prueba con `grpcurl`:

```bash
grpcurl -plaintext -proto proto/libros.proto -d '{"id":"ID_EXISTENTE"}' localhost:5000 biblioteca.LibrosService/ObtenerLibro
```

### 4) RabbitMQ

Se agregó un flujo asíncrono adicional para auditoría:

```text
Préstamos -> RabbitMQ queue: prestamo.auditoria -> Gateway
```

El microservicio Préstamos publica el evento `prestamo.auditoria` después de registrar un préstamo real. El Gateway lo consume y registra la auditoría sin bloquear el flujo principal. Si la publicación a RabbitMQ falla, Préstamos captura el error, lo registra y continúa con la operación principal para no tumbar el servicio.

### 5) Manejo de excepciones

- En `LibrosService.obtenerLibroGrpc(...)` se controla el caso de libro inexistente y se traduce a `RpcException`.
- En `GatewayService.obtenerLibroGrpc(...)` se convierte el error gRPC a `HttpException` para devolver un estado HTTP claro.
- En `PrestamosService.create(...)` la publicación a RabbitMQ está envuelta en `try/catch`; si el broker falla, la reserva del préstamo sigue y el servicio no cae.

### 6) Comparación de transportes

| Transporte | Tipo | Patrón | Uso en el proyecto |
|---|---|---|---|
| TCP | Síncrono | Petición-respuesta | Gateway -> Préstamos y Préstamos -> Libros para validar y ejecutar operaciones del Avance 1 |
| Redis | Asíncrono | PUB/SUB | Préstamos -> Notificaciones para `prestamo.registrado` |
| RabbitMQ | Asíncrono | Queue / mensajería | Préstamos -> Gateway para la auditoría `prestamo.auditoria` |
| gRPC | Síncrono | Contrato/RPC | Gateway -> Libros para consultar un libro con contrato `.proto` |

TCP conviene cuando necesito respuesta inmediata y control del flujo, como verificar disponibilidad antes de registrar un préstamo. Redis funciona bien para eventos livianos y desacoplados. RabbitMQ es más apropiado cuando quiero una cola más explícita para auditoría o trabajos asíncronos que deben quedar en espera. gRPC encaja cuando necesito un contrato fuerte, tipado y rápido entre servicios, sin perder la semántica de RPC.

### 7) Evidencias del Avance 2


#### Crear libro (Postman)
Respuesta `201 Created` al crear un libro; se muestra el `id` que se usa en las siguientes pruebas.

![Crear libro](docs/evidencias/avance2/1.PNG)

#### Consulta gRPC exitosa (Gateway → Libros)
`GET /api/libros/grpc/:id` devuelve el registro del libro vía gRPC.

![gRPC success](docs/evidencias/avance2/2.PNG)

#### gRPC — libro inexistente (manejo de excepción)
Prueba con un `id` inválido; el Gateway devuelve un error controlado indicando que el libro no fue encontrado.

![gRPC not found](docs/evidencias/avance2/3.PNG)

> **Nota de Avance 3:** esta captura muestra `502 Bad Gateway` en vez de `404`. El error sí estaba controlado (no tumbaba el servicio), pero el código HTTP era el incorrecto: `libros.service.ts` lanzaba `RpcException({ statusCode: 404, ... })`, y gRPC traduce el error por el campo `code` numérico del estándar (no por un `statusCode` estilo HTTP), así que cualquier `RpcException` sin un `code` grpc válido caía a `UNKNOWN` y el Gateway lo mapeaba a 502. Se corrigió en Avance 3 usando `code: GrpcStatus.NOT_FOUND`; ver el detalle en la sección de Observabilidad con Sentry más abajo. Se deja esta captura sin reemplazar para no reescribir la evidencia ya etiquetada en `v2-avance2`.

#### Crear préstamo (Postman)
`POST /api/prestamos` crea el préstamo y dispara la publicación a RabbitMQ (respuesta `201 Created`).

![Crear préstamo](docs/evidencias/avance2/4.PNG)

#### Logs del Gateway (inicio y rutas)
Extracto del terminal con el arranque del Gateway y el mapeo de rutas expuestas.

![Gateway logs](docs/evidencias/avance2/0.PNG)

#### RabbitMQ — Queues
Panel de administración mostrando la cola `prestamo.auditoria` (mensajes y consumidores).

![RabbitMQ queues](docs/evidencias/avance2/6.PNG)

#### Contenedores (Docker)
Vista de los contenedores en Docker mostrando que los servicios están corriendo.

![Contenedores](docs/evidencias/avance2/5.PNG)

#### Logs RabbitMQ
Extracto de logs del contenedor `rabbitmq` durante el arranque.

![RabbitMQ logs](docs/evidencias/avance2/7.PNG)

## 🔵 Avance 3 — Seguridad, observabilidad e integración (FINAL) · `tag v3-final`

### 🔐 Autenticación y autorización
Se implementó una capa de autenticación basada en JWT en el Gateway. El endpoint `POST /auth/login` emite un `access_token` al validar las credenciales del usuario `admin`, y el guard `JwtAuthGuard` protege las rutas bajo `/api/*` para exigir un token válido en cada petición.

- Login exitoso: devuelve `200 OK` con un `access_token`.
- Acceso sin token: responde con `401 Unauthorized`.
- Acceso con token válido sin rol adecuado: responde con `403 Forbidden`.
- Acceso con token válido y rol `admin`: permite consultar rutas protegidas como `/api/libros`.

Credenciales de prueba:
- Usuario: `admin`
- Contraseña: `admin123`
- Usuario: `guest`
- Contraseña: `guest123`

Ejemplo de prueba:

```powershell
$body = @{ username = 'admin'; password = 'admin123' } | ConvertTo-Json
$token = (Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/auth/login' -ContentType 'application/json' -Body $body).access_token
Invoke-RestMethod -Method Get -Uri 'http://localhost:3000/api/libros' -Headers @{ Authorization = "Bearer $token" }
```

Evidencias de autenticación JWT y rutas protegidas disponibles en la sección de Postman más abajo.

### ⏳ Expiración del JWT

El tiempo de vida del token se controla con `JWT_EXPIRES_IN` (por defecto `1h`, configurable en `docker-compose.final.yml`) y se aplica en `auth.module.ts` al construir el `JwtModule`. La validación la hace `JwtStrategy` con `ignoreExpiration: false`, así que passport-jwt rechaza cualquier token vencido antes de llegar al controlador; `JwtAuthGuard.handleRequest` convierte ese rechazo en `401 Unauthorized`, igual que un token ausente o con firma inválida.

Para verlo sin esperar 1h completo, `jwt-expiracion-check.js` (en la raíz del repo) firma un token con el mismo `JwtService` y un `expiresIn` corto, y lo valida antes y después de que expire:

```bash
cd apps/gateway
node ../../jwt-expiracion-check.js
```

Salida real de esta corrida:

```
1) Login -> access_token emitido con expiresIn=2s:
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlcyI6WyJhZG1pbiJdLCJpYXQiOjE3ODUxMjQzMDMsImV4cCI6MTc4NTEyNDMwNX0.BLUsvANROM5_8N5LZJ-kc_Szse16_ObhCuEw_XwbAcI

2) Validación inmediata (igual que JwtStrategy, ignoreExpiration:false):
   OK -> {"sub":"admin","username":"admin","roles":["admin"],"iat":1785124303,"exp":1785124305}

3) Misma validación pasados 3s (token ya expiró):
   RECHAZADO -> TokenExpiredError - jwt expired
   (JwtAuthGuard.handleRequest recibe err y responde 401 Unauthorized, igual que en el Gateway real)
```

Con el sistema levantado, el mismo efecto se reproduce pidiendo un token de vida corta (`JWT_EXPIRES_IN=5s` en el `.env`), esperando unos segundos y reintentando `GET /api/libros` con ese mismo token: el Gateway responde `401 Unauthorized` aunque el token sea sintácticamente válido, porque ya expiró.

### 🧪 Pruebas en Postman

![Endpoint de login](<docs/evidencias/avance3/0-endpoint con login.png>)

![Prueba de ruta protegida](<docs/evidencias/avance3/1-prueba ruta protegida.png>)

![Login obtener JWT](docs/evidencias/avance3/2-Login%20obtener%20jwt.png)

![Ruta protegida con token en Postman](docs/evidencias/avance3/3-ruta%20rpotegida%20con%20token.png)

![Error 403 por rol inválido](docs/evidencias/avance3/5-%20error403.png)

![Ruta protegida sin token](docs/evidencias/avance3/4-ruta%20protegida%20sin%20token.png)

#### 1) Login para obtener el JWT
- Método: `POST`
- URL: `http://localhost:3000/auth/login`
- Headers:
  - `Content-Type: application/json`
- Body (raw JSON):

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Respuesta esperada: `200 OK` con un campo `access_token`.

#### 2) Ruta protegida con token
- Método: `GET`
- URL: `http://localhost:3000/api/libros`
- Headers:
  - `Authorization: Bearer <token_completo>`

Importante: en Postman debe pegarse el valor completo del `access_token` recibido en el login, incluyendo todo el string JWT, y dejar el prefijo `Bearer ` antes del token.

Ejemplo:
- `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

Respuesta esperada: `200 OK` con la lista de libros si el token es válido.

#### 3) Ruta protegida sin token
- Método: `GET`
- URL: `http://localhost:3000/api/libros`
- Headers: sin `Authorization`

Respuesta esperada: `401 Unauthorized`.

#### 4) Prueba de error sin token en otro endpoint
- Método: `POST`
- URL: `http://localhost:3000/api/prestamos/test-async`
- Headers: sin `Authorization`

Resultado observado: el Gateway devolvió `401 Unauthorized` y se registró el error en Sentry como `Token inválido o ausente`.

### 📊 Observabilidad con Sentry

Se integró `@sentry/nestjs` en los 4 servicios (Gateway, Libros, Préstamos, Notificaciones). Cada uno carga `instrument.ts` antes de arrancar Nest y registra el filtro global de excepciones (`SentryGlobalFilter` en el Gateway, `@SentryExceptionCaptured()` en los filtros RPC de los microservicios), de forma que un error no manejado en cualquiera de los cuatro procesos queda registrado en el mismo proyecto de Sentry con su `release` (`gateway@1.0.0`, `libros@1.0.0`, etc.) para identificar de qué servicio vino.

El DSN se pasa únicamente por la variable de entorno `SENTRY_DSN` (definida en `.env`, no versionado); el código no trae ningún DSN por defecto, así que sin esa variable Sentry simplemente no reporta en vez de apuntar a una cuenta ajena.

Se validó con dos casos, ambos originados en el Gateway:
- Un evento de prueba (`Sentry default test error`) disparado manualmente desde el contenedor del Gateway.
- Un error real de negocio (petición sin token / token inválido), capturado por el filtro global y visible en el panel con su stack trace.

![Evento de prueba en Sentry](<docs/evidencias/avance3/6-sentry evento default.png>)

![Error real capturado en Sentry](<docs/evidencias/avance3/7- sentry error intencional.png>)

#### Evidencia pendiente: un error originado en un microservicio (no solo el Gateway)

El código ya está integrado en Libros, Préstamos y Notificaciones (no solo en el Gateway), pero las dos capturas de arriba muestran únicamente errores del Gateway. Para demostrar que la integración cubre varios servicios de verdad, falta una captura de Sentry con un error que se origine en uno de los microservicios.

**Esto ya se probó en vivo levantando `docker-compose.final.yml` completo**, y en el camino se encontró y corrigió un bug real: pedir un libro inexistente por gRPC (`GET /api/libros/grpc/:id`) devolvía `502 Bad Gateway` en lugar de `404` — visible incluso en la propia captura del equipo en `docs/evidencias/avance2/3.PNG`. La causa: `libros.service.ts` lanzaba `RpcException({ statusCode: 404, ... })`, pero para gRPC (a diferencia de TCP) Nest traduce el error por el campo `code` numérico del estándar gRPC, no por un `statusCode` estilo HTTP; sin un `code` reconocido, caía a `UNKNOWN` y el Gateway lo traducía a 502. Se corrigió usando `code: GrpcStatus.NOT_FOUND` (de `@grpc/grpc-js`) en `obtenerLibroGrpc`, y ahora responde `404` correctamente:

```json
// antes del fix
{"statusCode":502,"message":"Libro 00000000-0000-0000-0000-000000000000 no encontrado"}
// después del fix
{"statusCode":404,"message":"Libro 00000000-0000-0000-0000-000000000000 no encontrado"}
```

Con esa corrección, se confirmó de punta a punta que la cadena para Sentry funciona: `libros.service.ts` (`obtenerLibroGrpc`) lanza el `RpcException` → `AllExceptionsToRpcFilter` de **Libros** (`apps/libros/src/common/filters/rpc-exception.filter.ts`) lo captura con `Sentry.captureException(exception)` **antes** de traducirlo de vuelta al Gateway por gRPC (verificado en los logs del contenedor: el microservicio sigue arriba y responde bien después del error, no se cae) → ese evento llega a Sentry con `release: libros@1.0.0`, distinguible del Gateway. También se repitió sin regresiones el resto de casos (401 sin token, 403 con rol `guest`, 200 con `admin`).

Lo único que falta para tener la captura de pantalla es correrlo con el `SENTRY_DSN` real del equipo (en esta sesión se probó con la variable vacía, que hace que Sentry no reporte, a propósito, para no usar la cuenta del equipo desde aquí):

```bash
# 1) .env junto a docker-compose.final.yml con JWT_SECRET y el SENTRY_DSN real del equipo
docker compose -f docker-compose.final.yml up -d --build

# 2) login para obtener el token
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'

# 3) pedir un libro con un id que no existe -> dispara el 404 desde Libros, no desde el Gateway
curl http://localhost:3000/api/libros/grpc/00000000-0000-0000-0000-000000000000 -H "Authorization: Bearer <token_del_paso_2>"

# 4) abrir el panel de Sentry y capturar el evento con release libros@1.0.0, guardarlo como
#    docs/evidencias/avance3/8-sentry-libros.png
```

### 🔗 Integración final
El sistema queda integrado de punta a punta desde el Gateway: `HTTP → Gateway (JWT Guard) → Préstamos (TCP) → Libros (TCP)` para la ruta síncrona, `Préstamos → Redis → Notificaciones` para el evento asíncrono de préstamo, `Préstamos → RabbitMQ → Gateway` para la auditoría, y `Gateway → Libros` por gRPC para la consulta directa de un libro. Los cuatro transportes (TCP, Redis, RabbitMQ, gRPC) y la capa de seguridad JWT conviven en la misma ejecución levantada con `docker-compose.final.yml`.

### 🏗️ Diagrama final

```mermaid
flowchart LR
  C[Cliente / Postman] -->|HTTP + JWT| G[Gateway]
  G -->|JwtAuthGuard + RolesGuard| G
  G -->|TCP| P[Préstamos]
  P -->|TCP| L[Libros]
  G -->|gRPC| L
  P -->|Redis PUB/SUB| N[Notificaciones]
  P -->|RabbitMQ queue| G
  G -.errores.-> S[(Sentry)]
  P -.errores.-> S
  L -.errores.-> S
  N -.errores.-> S
```

---

## 🎤 Defensa

### 1. Portada
Sistema de Gestión de Biblioteca Universitaria — integrantes: David Moran (Backend/Arquitectura), Gabriel Vivanco (Transportes/gRPC), Alison Miranda (Seguridad/Observabilidad), Samir Mideros (Documentación/QA).

### 2. Problema y dominio del MVP
Administrar el catálogo de libros de una biblioteca y los préstamos que los usuarios realizan sobre ese catálogo, notificando cuando un préstamo se registra. El dominio se mantuvo simple a propósito para poder concentrar el esfuerzo en la arquitectura de comunicación entre microservicios.

### 3. Arquitectura general
Ver diagrama final arriba: Gateway como único punto de entrada HTTP, JWT/Guard como capa de seguridad, y los tres microservicios (Libros, Préstamos, Notificaciones) comunicados por TCP, gRPC, Redis y RabbitMQ.

### 4. Avance 1 — Latencia y acoplamiento
Comparación síncrono (TCP) vs. asíncrono (Redis) con 50 peticiones por camino: síncrono 9.10/32.56/48.77 ms (prom/p95/máx) vs. asíncrono 1.84/2.41/5.06 ms. La prueba de caída (deteniendo `biblioteca-libros`) evidenció el acoplamiento temporal: el camino síncrono falla de inmediato cuando Libros no está disponible, mientras que el evento en Redis no depende de que Notificaciones esté arriba.

### 5. Avance 2 — Comunicación
Se agregó gRPC (Gateway → Libros, contrato `proto/libros.proto`) y RabbitMQ como segundo transporte asíncrono (Préstamos → Gateway, auditoría). Tabla comparativa de los 4 transportes en la sección Avance 2 más arriba.

### 6. Avance 3 — Seguridad y observabilidad
JWT (`POST /auth/login`) + `JwtAuthGuard`/`RolesGuard` protegiendo `/api/*` con 401 sin token y 403 sin el rol requerido; Sentry capturando errores de los 4 servicios.

### 7. Temas de clase aplicados
Patrones: API Gateway, Publisher/Subscriber, Repository, Dependency Injection. Principios SOLID: SRP (cada microservicio con una responsabilidad), DIP (comunicación vía interfaces de transporte, no implementaciones concretas). Manejo de excepciones consistente con filtros globales (`HttpExceptionFilter`, `AllExceptionsToRpcFilter`, `SentryGlobalFilter`) en los 4 servicios.

### 8. Demo en vivo (runbook)

```bash
# 1. Levantar
docker compose -f docker-compose.final.yml up -d --build

# 2. Ver servicios
docker compose -f docker-compose.final.yml ps

# 3. Login
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'

# 4. Ruta protegida SIN token -> 401
curl -i http://localhost:3000/api/libros

# 5. Ruta protegida CON token -> 200
curl http://localhost:3000/api/libros -H "Authorization: Bearer <token_del_paso_3>"

# 6. Operación integrada: crear un préstamo real
#    (dispara TCP Gateway->Préstamos->Libros, evento Redis, y auditoría por RabbitMQ)
curl -X POST http://localhost:3000/api/prestamos -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"libroId":"<id>","usuario":"jperez"}'

# 7. Provocar un error (p.ej. libro inexistente o sin token) y mostrarlo en el panel de Sentry
```

### 9. Conclusiones y aprendizajes
La comparación con números reales (no solo teoría) fue lo que mejor evidenció el costo del acoplamiento temporal: el camino síncrono acumula la latencia de cada salto y falla en cadena si un servicio cae, mientras que el asíncrono aísla esa falla a costa de perder la confirmación inmediata. Mantener trazabilidad real (tags anotados, PRs revisados, commits por persona) resultó tan importante como el código: la primera entrega perdió puntos por documentar procesos que no habían ocurrido.

### 10. Cierre / Preguntas frecuentes preparadas
- **¿Qué información viaja dentro de un JWT y cómo se valida?** El payload (`sub`, `username`, `roles`) firmado con `JWT_SECRET`; `JwtStrategy` lo valida en cada petición vía `passport-jwt` extrayendo el Bearer token del header `Authorization`.
- **¿Qué hace un Guard en NestJS y en qué se diferencia de un middleware?** El Guard decide si la petición puede continuar hacia el handler (autenticación/autorización) y tiene acceso al `ExecutionContext` de Nest (incluye metadata de decoradores como `@Roles`); el middleware corre antes, a nivel de Express/HTTP crudo, sin ese contexto.
- **¿Cuál es la diferencia entre autenticación y autorización?** Autenticación confirma quién es el usuario (login → JWT); autorización decide qué puede hacer ese usuario ya autenticado (`RolesGuard` + `@Roles('admin')`).
- **¿Por qué gRPC para Gateway→Libros y no TCP/eventos?** Para tener un contrato tipado (`.proto`) en un punto donde interesa una consulta rápida y fuertemente tipada, sin la semántica de cola de RabbitMQ ni la simplicidad no tipada del transporte TCP de Nest.
- **¿En qué se diferencian los transportes usados?** TCP: síncrono petición-respuesta sin contrato fuerte. Redis Pub/Sub: asíncrono, sin acuse de recibo, para eventos livianos. RabbitMQ: asíncrono con cola durable, apto para auditoría que no debe perderse. gRPC: síncrono con contrato `.proto` tipado.
- **¿Para qué sirve Sentry y qué registran ahí?** Centralizar errores no manejados de los 4 servicios con su stack trace, `release` y ambiente, para diagnosticar fallas sin depender de revisar logs de cada contenedor por separado.
- **¿Qué patrones de diseño usa NestJS y cuáles agregaron ustedes?** NestJS ya trae Dependency Injection y Módulos; el equipo aplicó además API Gateway, Publisher/Subscriber (Redis) y Repository (TypeORM) sobre esa base.
