# Bitácora — Examen Final

---

## 0. Identificación

| | |
|---|---|
| **Nombre** | Gabriel Vivanco |
| **Usuario GitHub** | @GabrielNicoasVivancoRaza |
| **Grupo / Proyecto** | Grupo 5 — Biblioteca (`ldmoran/PROYECTO-P3-DISTRIBUIDAS`) |
| **Actividad asignada** | B — Nuevo salto síncrono con contrato (gRPC), según `docs/examen/GabrielVivanco/ASIGNACION.md` |
| **Rama** | `exam/GabrielNicoasVivancoRaza` |
| **Tag** | `examen-GabrielNicoasVivancoRaza` *(pendiente de crear al cierre, sobre el último commit)* |
| **Pull Request** | *(pendiente — completar con el enlace al abrir el PR)* |
| **Tarjeta Kanban** | `TABLERO_KANBAN.md`, sección "Examen final — Gabriel Vivanco (Actividad B)" (tablero Markdown, ver §5 sobre por qué no se usó GitHub Projects) |
| **¿Hiciste el Paso 0?** | No — el repo ya tenía login JWT y guard funcionando desde el Avance 3 (`apps/gateway/src/auth/jwt-auth.guard.ts`, `apps/gateway/src/auth/auth.service.ts`, documentado en `README.md:33`)|

---

## 1. Qué construí

Extendí el contrato gRPC (`proto/libros.proto`) del sistema de Biblioteca con un método nuevo, `VerificarDisponibilidad`, que hoy el Gateway no podía consultar por ningún transporte (ni TCP ni gRPC — solo lo usaba internamente el microservicio Préstamos por TCP). Implementé el handler en el microservicio Libros reutilizando la lógica de negocio que ya existía, y lo consumí desde el Gateway con el cliente gRPC que ya estaba registrado, exponiéndolo como `GET /api/libros/grpc/:id/disponibilidad`. El Gateway traduce los errores tipados del contrato (`NOT_FOUND`, `INVALID_ARGUMENT`) a los códigos HTTP correctos (404, 400) en vez de un 502 genérico, y si el microservicio Libros cae, el Gateway responde controlado en vez de colgarse. Antes de este cambio, la única forma de saber si un libro estaba disponible por gRPC era pedir el objeto completo con `ObtenerLibro`.

---

## 2. Anclaje con el repositorio de mi grupo — **obligatorio (C2)**

| Código preexistente | Archivo:línea | Cómo me conecto con él |
|---|---|---|
| Contrato gRPC con `ObtenerLibro` | `proto/libros.proto:5-7` | Añadí `VerificarDisponibilidad` dentro del mismo `service LibrosService`, no un contrato paralelo |
| Lógica de disponibilidad ya usada por Préstamos vía TCP | `apps/libros/src/libros/libros.service.ts:46-49` (`verificarDisponibilidad`) | La reutilicé tal cual desde el nuevo método `verificarDisponibilidadGrpc` — no repetí la consulta a la BD |
| Patrón de traducción de error de dominio a error gRPC tipado | `apps/libros/src/libros/libros.service.ts:51-68` (`obtenerLibroGrpc`, `RpcException` + `GrpcStatus`) | Copié el mismo patrón (`NotFoundException` → `RpcException NOT_FOUND`) y le sumé `INVALID_ARGUMENT` para id vacío |
| Cliente gRPC ya registrado en el Gateway | `apps/gateway/src/gateway/gateway.module.ts:37-49` (`LIBROS_GRPC_SERVICE`) | Lo reutilicé sin crear un cliente nuevo; solo extendí la interfaz `LibroGrpcService` |
| Patrón de consumo + mapeo de error a `HttpException` en el Gateway | `apps/gateway/src/gateway/gateway.service.ts:58-66` (`obtenerLibroGrpc`) | Mismo `try/catch` y mismo mapeo por `error.code`, sumando el caso `code===3` → 400 |
| Guard ya aplicado a nivel de controller | `apps/gateway/src/gateway/gateway.controller.ts:13-14` (`@UseGuards(JwtAuthGuard, RolesGuard)`) | La ruta nueva hereda el guard de la clase; no le puse un guard propio |

**¿Qué convención del repositorio seguí para que mi código no desentone?**
Nombrar el método del Gateway igual que el del microservicio (`verificarDisponibilidadGrpc` en ambos lados, como ya pasa con `obtenerLibroGrpc`), usar `RpcException` con códigos numéricos de `@grpc/grpc-js` en vez de excepciones HTTP dentro de Libros, mantener el bloque de comentario "por qué" (no "qué") como el que ya existe en `obtenerLibroGrpc` explicando la diferencia entre `code` gRPC y `statusCode` HTTP, y ubicar la ruta nueva dentro del mismo bloque `// ---- Libros ----` del controller.

**¿Qué NO dupliqué, pudiendo hacerlo?**
No creé un segundo cliente gRPC en `gateway.module.ts` (reutilicé `LIBROS_GRPC_SERVICE`, ya registrado en la línea 37-49). No reescribí la consulta a la base de datos (reutilicé `verificarDisponibilidad` de `libros.service.ts:46-49` en vez de otro `findOneBy`). No creé un guard ni un filtro de excepciones nuevos: la ruta hereda `JwtAuthGuard`/`RolesGuard` del controller, y los errores de Libros los sigue traduciendo `AllExceptionsToRpcFilter` (`apps/libros/src/common/filters/rpc-exception.filter.ts`) que ya estaba registrado como filtro global en `apps/libros/src/main.ts:14`.

---

## 3. Decisiones técnicas

### Decisión 1
- **Qué decidí:** crear un método envoltorio `verificarDisponibilidadGrpc` en `LibrosService` que valida el id y traduce errores, en vez de exponer `verificarDisponibilidad` directamente como `@GrpcMethod`.
- **Alternativa que descarté:** anotar `verificarDisponibilidad` mismo con `@GrpcMethod` y hacer que lance `RpcException` directamente.
- **Por qué:** ese método ya lo consume Préstamos por TCP (`apps/prestamos/src/prestamos/prestamos.service.ts:31`), donde el error se traduce distinto (`AllExceptionsToRpcFilter` espera `NotFoundException`/`HttpException` normales, no un `code` numérico gRPC). Mezclar los dos formatos de error en un solo método habría acoplado dos transportes con reglas de traducción distintas. Separar el envoltorio es exactamente el patrón que el propio repo ya usa para `ObtenerLibro` vs `findOne`.

### Decisión 2
- **Qué decidí:** probar `verificarDisponibilidadGrpc` del Gateway instanciando `GatewayService` directamente con mocks simples por constructor, sin `TestingModule` de Nest ni TypeORM.
- **Alternativa que descarté:** levantar un `TestingModule` completo con el `ClientsModule` y una base de datos de prueba (o mockeando el `Repository` de TypeORM).
- **Por qué:** el repo no tenía ninguna prueba antes de este examen (cero `jest` en cualquier `package.json`) y el riesgo real que hay que cubrir —la traducción de `error.code` a `HttpException`— vive completo dentro del `catch` de `gateway.service.ts`, sin tocar la base de datos. Montar TypeORM solo para esta prueba habría sido tiempo de infraestructura sin cubrir más riesgo real, algo que no cabía en el bloque de 70 minutos de código.

### Decisión 3
- **Qué decidí:** mapear explícitamente `code===3` (`INVALID_ARGUMENT`, id vacío) a 400, en vez de dejar que un id vacío cayera en `findOne` y saliera como 404.
- **Alternativa que descarté:** no validar el id y dejar que la ausencia de coincidencia en la BD generara el mismo `NotFoundException` → 404 que un id inexistente.
- **Por qué:** un id vacío es un error del cliente en la forma de la petición (400, "no me diste lo que necesito"), no la ausencia de un recurso válido (404, "busqué y no está"). Confundir ambos le quita al cliente HTTP la posibilidad de distinguir "corrige tu request" de "prueba con otro id" — es el mismo problema que describe la Actividad E sobre códigos que no distinguen casos.

---

## 4. Las 3 preguntas de mi actividad

**Pregunta 1:** ¿Por qué el contrato debe vivir en un lugar compartido y no duplicado dentro de cada servicio?

> En mi repo, `proto/libros.proto` vive en la raíz y **tanto** Libros como el Gateway apuntan al mismo archivo físico: `apps/libros/src/main.ts:28` y `apps/gateway/src/gateway/gateway.module.ts:45` usan el mismo `join(process.cwd(), 'proto', 'libros.proto')` (ajustado por el `context: .` del build de Docker). Si cada servicio tuviera su propia copia, alguien podría cambiar el número de campo o el tipo en un lado y olvidarlo en el otro; en Protocol Buffers eso no falla al compilar, porque el mensaje se serializa por número de campo, no por nombre — el otro lado simplemente leería los bytes equivocados como si fueran el campo correcto. Un archivo compartido hace que esa inconsistencia sea imposible por construcción, no por disciplina del equipo.

**Pregunta 2:** ¿Qué código de error del transporte elegiste para "no encontrado" y a qué código HTTP lo mapeas? ¿Por qué **no** es correcto devolver 500?

> Uso el código gRPC `NOT_FOUND` (5), lanzado como `RpcException({ code: GrpcStatus.NOT_FOUND })` en `apps/libros/src/libros/libros.service.ts` (método `verificarDisponibilidadGrpc`), y en el Gateway (`apps/gateway/src/gateway/gateway.service.ts`) lo mapeo a `HttpStatus.NOT_FOUND` (404) cuando `error.code === 5`. Devolver 500 sería incorrecto porque un libro inexistente es un resultado válido y esperable de una consulta bien formada — el cliente hizo todo bien, el recurso simplemente no está. Un 5xx le dice al cliente (y a cualquier sistema de monitoreo/alertas) "algo se rompió del lado del servidor, reintenta o escala", cuando en realidad no hay nada que reintentar: pedir el mismo id inexistente nunca va a funcionar. De hecho el propio historial del repo ya corrigió exactamente esta confusión para `ObtenerLibro` en el commit `a936e37` ("mapear el 404 de gRPC con el código correcto (no más 502)"); mi código sigue ese mismo criterio para el método nuevo.

**Pregunta 3:** Si mañana añades un campo nuevo al contrato, ¿siguen funcionando los clientes que no lo conocen? ¿Por qué?

> Sí. `DisponibilidadResponse` hoy declara `id = 1` y `disponible = 2`. Si mañana agrego, por ejemplo, `fechaConsulta = 3`, un cliente compilado contra la versión vieja simplemente ignora el campo 3 al leer los bytes (Protobuf no falla ante campos desconocidos, los descarta). Y si es al revés —un cliente nuevo habla con un servidor viejo que nunca envía el campo 3— ese cliente recibe el valor por defecto del tipo (cadena vacía, 0, etc.), no un error. Esta compatibilidad hacia adelante y hacia atrás depende de una regla que hay que respetar a mano: nunca reutilizar ni cambiar el número de un campo existente; si eso se rompe, sí se rompe la compatibilidad.

---

## 5. Uso de Inteligencia Artificial — **obligatorio**

**¿Usaste IA en este examen?**  ☒ Sí  ☐ No

| # | Qué le pedí | Qué me devolvió | Qué corregí, adapté o descarté — y por qué |
|:--:|---|---|---|
| 1 | El prompt de "feat(libros)": extender `proto/libros.proto` + `libros.service.ts` + `libros.controller.ts` reutilizando `verificarDisponibilidad` existente | Generó el rpc nuevo, el mensaje `DisponibilidadResponse`, el método `verificarDisponibilidadGrpc` y el handler `@GrpcMethod` | No corregí el código; sí noté que no pudo correr `tsc --noEmit` porque `apps/libros/node_modules` no estaba instalado en el entorno, así que la primera verificación real fue el build de Docker más adelante |
| 2 | El prompt de "feat(gateway)": consumir el método nuevo reusando el cliente gRPC ya registrado y mapear errores a 404/400 | Generó el método `verificarDisponibilidadGrpc` en `GatewayService` y la ruta en el controller, siguiendo el patrón de `obtenerLibroGrpc` | Sin correcciones de código; validé el resultado más tarde contra Postman/curl reales (ver §6) y coincidió con lo esperado |
| 3 | El prompt de "test(gateway)": añadir jest desde cero (el repo no tenía ninguna prueba) y una prueba unitaria que falle sin el cambio | Instaló jest/ts-jest, generó `gateway.service.spec.ts` con mocks manuales (sin `TestingModule`), y además comprobó empíricamente —revirtiendo `gateway.service.ts` a un commit anterior y corriendo `jest`— que la prueba falla con `TS2339: Property 'verificarDisponibilidadGrpc' does not exist` | Le pedí explícitamente la prueba de que "falla sin mi cambio" en vez de solo confiar en su afirmación; el resultado quedó guardado como evidencia real, no como texto generado |


**¿En qué se equivocó respecto a mi repositorio?**
Al pedirle el commit de "test(gateway)", intentó `git stash push -- apps/gateway/src/gateway/gateway.service.ts` asumiendo que yo todavía tenía ese archivo modificado sin comitear — pero yo ya había corrido los commits de `feat(libros)` y `feat(gateway)` por mi cuenta entre un prompt y el siguiente, así que el comando devolvió "No local changes to save". Lo detecté porque el propio asistente revisó `git log --oneline main..HEAD` al toparse con el resultado inesperado y ajustó el enfoque (usó `git checkout HEAD~1 -- archivo` en su lugar). Es un buen ejemplo de por qué el criterio C2 exige verificar contra el repo real: la IA no sabe el estado de mi rama si no lo consulta, y aquí sí lo consultó y se corrigió sola en vez de asumir.

---

## 6. Evidencia

| Archivo | Qué demuestra |
|---|---|
| `antes-sin-metodo.txt` | El rpc `VerificarDisponibilidad` no existía en `proto/libros.proto` antes de esta actividad (estado del commit `b425816`), y la prueba nueva falla por error de compilación contra el código de `HEAD~1` |
| `despues-caso-ok.md` (+ `image.png`) | `GET /api/libros/grpc/:id/disponibilidad` con un libro real → 200, `{ id, disponible: true }` — respuesta cruda (curl) y captura de Postman |
| `despues-caso-error.md` (+ `image-1.png`) | Mismo endpoint con un id inexistente → **404** (no 502), sin filtrar detalles internos — respuesta cruda y captura de Postman |
| `despues-caso-sin-token.md` (+ `image-2.png`) | Caso borde: sin token → 401 (no se puede consultar disponibilidad anónimamente) — respuesta cruda y captura de Postman |
| `despues-no-rompe-existente.md` (+ `image-3.png`) | La ruta gRPC preexistente (`GET /api/libros/grpc/:id`, `ObtenerLibro`) sigue funcionando igual, sin regresión — respuesta cruda y captura de Postman |
| `despues-jest-ok.txt` | Los 3 tests de `gateway.service.spec.ts` pasando contra el código actual |

**Cómo reproducir mi cambio desde cero:**

```bash
# 1) Levantar el stack completo (incluye gRPC, JWT y Sentry opcional)
docker compose -f docker-compose.final.yml up -d --build

# 2) Autenticarse
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"guest","password":"guest123"}'
# guardar el access_token de la respuesta

# 3) (si no hay libros) crear uno como admin
curl -s -X POST http://localhost:3000/api/libros \
  -H "Authorization: Bearer <TOKEN_ADMIN>" -H "Content-Type: application/json" \
  -d '{"titulo":"Cien años de soledad","autor":"Gabriel García Márquez","isbn":"978-0307474728","disponible":true}'

# 4) Caso OK
curl -s -i http://localhost:3000/api/libros/grpc/<ID_REAL>/disponibilidad \
  -H "Authorization: Bearer <TOKEN>"

# 5) Caso error (404)
curl -s -i http://localhost:3000/api/libros/grpc/00000000-0000-0000-0000-000000000000/disponibilidad \
  -H "Authorization: Bearer <TOKEN>"

# 6) Prueba automatizada
cd apps/gateway && npx jest
```

---

## 7. Prueba automatizada

| | |
|---|---|
| **Archivo de la prueba** | `apps/gateway/src/gateway/gateway.service.spec.ts` |
| **Comando para ejecutarla** | `cd apps/gateway && npx jest` (o `npm run test`) |
| **Qué verifica** | Que `GatewayService.verificarDisponibilidadGrpc` traduce `error.code===5` (gRPC NOT_FOUND) a `HttpException` 404, `error.code===3` (INVALID_ARGUMENT) a 400, y que el caso feliz resuelve `{ id, disponible }` — sin propagar una excepción no controlada |
| **¿Falla sin mi cambio?** | Sí — lo comprobé revirtiendo `apps/gateway/src/gateway/gateway.service.ts` a `HEAD~1` (`git checkout HEAD~1 -- apps/gateway/src/gateway/gateway.service.ts`) y corriendo `npx jest`: falla con `TS2339: Property 'verificarDisponibilidadGrpc' does not exist on type 'GatewayService'` en las 3 pruebas. Después restauré el archivo (`git checkout HEAD -- ...`) y las 3 pruebas volvieron a pasar. |

```
PASS src/gateway/gateway.service.spec.ts
  GatewayService.verificarDisponibilidadGrpc
    √ traduce NOT_FOUND (gRPC code 5) a HttpException 404 (4 ms)
    √ traduce INVALID_ARGUMENT (gRPC code 3) a HttpException 400 (1 ms)
    √ resuelve la disponibilidad cuando el libro existe (2 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

---

## 8. Estado final — honesto

**Funciona:** el rpc `VerificarDisponibilidad` end-to-end (Gateway → gRPC → Libros → Postgres), el mapeo 404/400/401, la ruta vieja `ObtenerLibro` sin regresión, y la prueba automatizada verificada fallando antes y pasando después.

**No funciona / incompleto:** no usé GitHub Projects (sin permiso; fallback en `TABLERO_KANBAN.md`); no capturé en vivo el 502 con Libros caído (el `catch` sigue el patrón ya probado de `obtenerLibroGrpc`, pero no tomé esa evidencia puntual).

**Siguiente paso:** tumbar `libros` (`docker compose ... stop libros`) y capturar el 502 controlado del nuevo endpoint.

---

## 9. Declaración

> Declaro que este trabajo es individual, que corresponde a la actividad que me fue asignada, y que la sección 5 refleja de forma completa y veraz el uso que hice de herramientas de Inteligencia Artificial durante el examen.

**Nombre:** Gabriel Vivanco
**Fecha:** 2026-07-27
