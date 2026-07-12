# Sistema de Gestión de Biblioteca Universitaria
> MVP de arquitectura de microservicios · Distribuidas · 7.° semestre · Entrega por avances.

## 👥 Equipo
| Integrante | Rol | GitHub |
|---|---|---|
| David Moran | Backend / Arquitectura | @usuario |
| Gabriel Vivanco | Transportes / gRPC | @usuario |
| Alison Miranda | Seguridad / Observabilidad | @usuario |
| Samir Mideros | Documentación / QA | @usuario |

## 🧩 Descripción del MVP
El sistema permite administrar el catálogo de libros de una biblioteca universitaria y los préstamos que los usuarios realizan sobre ese catálogo, generando notificaciones cuando un préstamo se registra. El dominio se mantiene deliberadamente sencillo (3 entidades: Libro, Préstamo, Notificación) para que el esfuerzo del proyecto se concentre en la **arquitectura de comunicación entre microservicios** (síncrona vs. asíncrona) y no en lógica de negocio compleja.

- **MS 1 — Libros:** administra el catálogo (crear, consultar, actualizar, eliminar, verificar disponibilidad).
- **MS 2 — Préstamos:** registra préstamos; antes de confirmar uno, consulta de forma **síncrona (TCP)** al MS Libros para verificar disponibilidad; al terminar, publica un **evento asíncrono en Redis**.
- **MS 3 — Notificaciones:** escucha el evento de Redis y simula el envío de una notificación, sin bloquear al MS Préstamos.
- **API Gateway:** punto único de entrada HTTP para el cliente; redirige al microservicio correspondiente.

## 🛠️ Stack
- **Framework:** NestJS (TypeScript)
- **Síncrono:** TCP · **Eventos:** Redis (Pub/Sub)
- **BD:** PostgreSQL · **Persistencia:** TypeORM
- **Contenedores:** Docker Compose · **Estructura:** monorepo (`apps/`)
- **Control de versiones:** Git + GitHub (GitHub Flow)

> Este avance **no incluye** gRPC, JWT, RabbitMQ/MQTT/NATS ni Sentry — esos temas corresponden a los Avances 2 y 3.

## ▶️ Cómo ejecutar
```bash
docker compose up -d --build
docker compose ps
curl http://localhost:3000/api/libros
```
*(Este bloque se completará y verificará en los pasos de Docker Compose y CRUD.)*

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
*(Diagrama de imagen para `/docs` se agregará más adelante.)*

## 🧭 Metodología
- **Kanban:** *(pendiente — se enlaza en un paso posterior)*.
- **Ramificación:** GitHub Flow — `main` protegida, ramas `feat/…`, `fix/…`, `docs/…`, PRs revisados, tag `v1-avance1` al cierre del avance.
- **Commits semánticos:** Conventional Commits (`feat`, `fix`, `docs`, `refactor`, `chore`, `ci`).

## 🗺️ Patrones y principios aplicados
*(Se documentan a medida que se implementan: API Gateway, Publisher/Subscriber, DTO+Pipes (SRP), Exception Filters, Inyección de Dependencias (DIP), etc.)*

---

## 🟢 Avance 1 — Acoplamiento temporal y latencia · `tag v1-avance1`

### Paso 1 — Estructura de carpetas del monorepo

**Qué hicimos:** creamos el esqueleto de carpetas del repositorio, sin generar aún ningún proyecto NestJS dentro:

```
PROYECTO-P3-DISTRIBUIDAS/
├── apps/
│   ├── gateway/
│   ├── libros/
│   ├── prestamos/
│   └── notificaciones/
├── docs/
│   └── evidencias/
├── docker-compose.yml
├── benchmark.js
├── README.md
├── README.plantilla.md
├── GUIA_GENERAL.md
├── TABLERO_KANBAN.md
├── TAREA_1.md
└── .gitignore
```

**Por qué lo hacemos así:**
- **Monorepo (`apps/`):** los 4 servicios (Gateway + 3 microservicios) viven en un solo repositorio pero cada uno es un proyecto NestJS **independiente** (su propio `package.json`, `Dockerfile`, `tsconfig.json`). Esto es justo lo que pide la guía del profesor y facilita que Docker Compose construya cada servicio por separado sin perder la trazabilidad de commits en un único historial de Git.
- **Carpetas vacías todavía:** en este paso solo preparamos el contenedor de carpetas. Cada carpeta dentro de `apps/` se llenará en el **Paso 2**, cuando ejecutemos `nest new` dentro de cada una — así evitamos mezclar la generación de código con la organización del repo, y si algo sale mal en un `nest new` es fácil de aislar.
- **`docs/evidencias/`:** aquí van las capturas de latencia y de la prueba de caída del microservicio, que la rúbrica exige como evidencia obligatoria (criterio C2 y C5 de `TAREA_1.md`).
- **Archivos raíz vacíos (`docker-compose.yml`, `benchmark.js`, etc.):** los dejamos creados como *placeholders* para que la estructura del repo coincida con la que espera el profesor desde el día 1, aunque su contenido real se agrega en pasos posteriores (Docker Compose en el Paso 4, benchmark en el Paso 16).

**Comandos exactos ejecutados** (puedes correrlos tal cual en tu terminal, dentro de la carpeta donde quieras crear el proyecto):
```bash
mkdir -p PROYECTO-P3-DISTRIBUIDAS/apps/gateway
mkdir -p PROYECTO-P3-DISTRIBUIDAS/apps/libros
mkdir -p PROYECTO-P3-DISTRIBUIDAS/apps/prestamos
mkdir -p PROYECTO-P3-DISTRIBUIDAS/apps/notificaciones
mkdir -p PROYECTO-P3-DISTRIBUIDAS/docs/evidencias

cd PROYECTO-P3-DISTRIBUIDAS
touch docker-compose.yml benchmark.js GUIA_GENERAL.md TABLERO_KANBAN.md TAREA_1.md README.plantilla.md .gitignore

git init
git add .
git commit -m "chore: estructura inicial del monorepo (apps/, docs/)"
```

### 📈 Latencia (con `benchmark.js`)
*(pendiente — Paso 16)*

### 🧨 Acoplamiento temporal
*(pendiente — Paso 17)*

### 🧠 Análisis
*(pendiente)*

---

## 🟡 Avance 2 — Comunicación: gRPC + 2.º transporte + excepciones · `tag v2-avance2`
### gRPC (contrato + monorepo)
✍️ <<Contrato `.proto` y comunicación gRPC entre <<A>> y <<B>>. Control de errores con try/catch.>>

### Segundo transporte
✍️ <<Transporte elegido (<<RabbitMQ/MQTT/NATS>>) y flujo PUB/SUB o queue implementado.>>

### 🔁 Comparación de transportes
| Transporte | Tipo | Patrón | Uso en el proyecto |
|---|---|---|---|
| TCP | Síncrono | Petición-respuesta | << >> |
| Redis | Asíncrono | PUB/SUB | << >> |
| <<RabbitMQ/MQTT/NATS>> | Asíncrono | <<PUB/SUB o queue>> | << >> |
| gRPC | Síncrono | Contrato/RPC | << >> |

✍️ <<1 párrafo: cuándo conviene cada uno.>>

### 🧯 Manejo de excepciones
✍️ <<Qué errores se controlan y cómo (evidencia de un error que no tumba el servicio).>>

---

## 🔵 Avance 3 — Seguridad, observabilidad e integración (FINAL) · `tag v3-final`
### 🔐 Autenticación y autorización
✍️ <<Login que emite JWT; Guard que protege rutas. Evidencia: 200 con token, 401 sin token (y 403 por rol si aplica).>>

### 📊 Observabilidad (Sentry)
✍️ <<Qué se registra; captura del error en el panel de Sentry.>>

### 🔗 Integración final
✍️ <<Operación que atraviesa varios microservicios/transportes desde el Gateway.>>

### 🏗️ Diagrama final
✍️ <<Sistema integrado>>

---

## 🎤 Defensa
✍️ <<Enlace a diapositivas + guion. Runbook de la demo (levantar → login → ruta protegida → operación integrada → error en Sentry). Preguntas frecuentes preparadas.>>

## 🏷️ Tags de entrega
- `v1-avance1` — <<fecha>> · `v2-avance2` — <<fecha>> · `v3-final` — <<fecha>>
