# Bitácora — Examen Final

> **Cópiame a `docs/examen/<tu-usuario-github>/BITACORA.md` y rellena todas las secciones.**
> Es obligatoria. Sin ella, C5 = nivel 1. Sin la sección 5 (uso de IA), **C5 = 0**.
> Escribe en primera persona y sé concreto: los "archivo:línea" se verifican.

---

## 0. Identificación

| | |
|---|---|
| **Nombre** | Alison Miranda|
| **Usuario GitHub** | @alisonmiranda |
| **Grupo / Proyecto** | Grupo 5 — Biblioteca (P3-Distribuidas)|
| **Actividad asignada** | F - Resiliencia: timeout + reintento |
| **Rama** | `exam/alisonmiranda` |
| **Tag** | `examen-` |
| **Pull Request** | *(enlace)* |
| **Tarjeta Kanban** | *(enlace)* |
| **¿Hiciste el Paso 0?** | Sí / No — *si no, indica el archivo donde la base ya existía* |

---

## 1. Qué construí

Antes, cuando el microservicio de Libros no respondía a la llamada gRPC `obtenerLibro`, el Gateway se quedaba esperando indefinidamente esa respuesta, colgando la petición del cliente sin ningún límite de tiempo. Ahora esa misma llamada, en `gateway.service.ts` (método `obtenerLibroGrpc`), tiene un timeout explícito y dos reintentos con espera creciente (100ms y 300ms) antes de darse por vencida. Si el servicio de Libros sigue sin responder después de esos reintentos, el Gateway ya no se cuelga: responde de inmediato con un 503 controlado, distinguible de los errores de "no encontrado" (404) o "error de comunicación" (502) que el sistema ya manejaba. Medí la latencia de esa ruta antes y después del cambio, con el servicio destino caído, para comprobar que el tiempo de espera ahora es acotado y que el camino feliz (servicio sano) no se ve afectado de forma apreciable.

---

## 2. Anclaje con el repositorio de mi grupo — **obligatorio (C2)**

*Código que YA existía y con el que mi cambio se conecta. Cita archivo y línea reales, verificables en el repo. Si dejas esta tabla vacía o con referencias inventadas, C2 no pasa de nivel 1.*

| Código preexistente | Archivo:línea | Cómo me conecto con él |
|---|---|---|
| Método que invoca la llamada gRPC a Libros | `gateway.service.ts:58-64` (método `obtenerLibroGrpc`, llamada `firstValueFrom(this.librosGrpcService.obtenerLibro({ id }))`)  | Envuelvo esta misma llamada con timeout y reintento con backoff, sin crear un método ni un servicio paralelo |
| Manejo de errores gRPC ya existente | `gateway.service.ts:60-63` (bloque `catch`: `error?.code === 5` → `HttpStatus.NOT_FOUND`, cualquier otro → `HttpStatus.BAD_GATEWAY`)  | Cuando se agoten mis reintentos, agrego un caso dentro de este mismo `catch` que traduce a `HttpStatus.SERVICE_UNAVAILABLE` (503) — no duplico la lógica, la extiendo |
| Endpoint HTTP público que expone esa llamada | `gateway.controller.ts:38-40` (`@Get('libros/grpc/:id')`)  | Es la ruta que mido con el benchmark antes y después; no modifico el controller |
| Registro del cliente gRPC | `gateway.module.ts:31-42` (`ClientsModule.registerAsync`, provider `LIBROS_GRPC_SERVICE`, `Transport.GRPC`)  | Confirma que hay un único cliente gRPC hacia Libros; el timeout/retry usa este mismo cliente ya inyectado |
| Tabla de latencia del Avance 1 | `README.md:155-194`  | Comparo mis mediciones de p50/p95/máximo/errores contra esa tabla para justificar el valor de timeout, aclarando que esa tabla mide una ruta distinta (síncrona TCP Préstamos→Libros), y que yo agrego una fila nueva para mi ruta (gRPC) |
| Script de medición del Avance 1 | `benchmark.js:1-105`, en particular `medirCaminoSincrono` (líneas 61-68) y la función `post` (líneas 20-49)  | Adapto la función `post`/`stats` para apuntar a `GET /api/libros/grpc/:id` en vez de `POST /api/prestamos/test-sync`, ya que el script original mide una ruta distinta a la que voy a modificar. Reutilizo el mismo mecanismo de medición (hrtime, cálculo de avg/p95/max), no escribo uno desde cero

**¿Qué convención del repositorio seguí para que mi código no desentone?**
Mantuve el cambio dentro del mismo método existente, `obtenerLibroGrpc` en `gateway.service.ts:58-64`, en vez de crear un servicio, helper o wrapper aparte para "llamadas resilientes". Seguí el mismo estilo de manejo de errores que ya usa el Gateway: capturar la excepción y traducirla explícitamente con `throw new HttpException(message, status)`, usando los enums de `HttpStatus` (como ya hacía con `NOT_FOUND` y `BAD_GATEWAY`), en vez de inventar un formato de error propio o devolver códigos numéricos sueltos. También seguí la convención de que el Gateway es la única capa que traduce errores de transporte (gRPC/TCP) a códigos HTTP — no dupliqué esa responsabilidad en otro lugar del flujo.

**¿Qué NO dupliqué, pudiendo hacerlo?**
No creé un segundo cliente gRPC ni un módulo de configuración paralelo: reutilicé el único provider `LIBROS_GRPC_SERVICE` ya registrado en `gateway.module.ts:31-42`. Tampoco creé un manejador de errores nuevo — extendí el `catch` que ya existía en `gateway.service.ts:60-63` (el que distingue `error?.code === 5` → 404 de otros errores → 502), añadiendo ahí mismo el caso de agotamiento de reintentos → 503, en vez de escribir un segundo bloque de traducción de errores en paralelo. Y para la medición, no escribí un script de benchmark desde cero: adapté las funciones `post`/`stats` que ya existían en `benchmark.js:20-59`, solo cambiando la ruta y el método HTTP que ejercitan.


---

## 3. Decisiones técnicas

*Al menos dos decisiones reales, con la alternativa que descartaste y por qué. Una decisión sin alternativa descartada no es una decisión.*

### Decisión 1
- **Qué decidí:**
- **Alternativa que descarté:**
- **Por qué:**

### Decisión 2
- **Qué decidí:**
- **Alternativa que descarté:**
- **Por qué:**

---

## 4. Las 3 preguntas de mi actividad

*Están al final de tu actividad en `ACTIVIDADES.md`. Cópialas y respóndelas. Se evalúa que las respuestas hablen de **tu** implementación y de **tu** sistema, no en general.*

**Pregunta 1:**

> *(respuesta)*

**Pregunta 2:**

> *(respuesta)*

**Pregunta 3:**

> *(respuesta)*

---

## 5. Uso de Inteligencia Artificial — **obligatorio**

**¿Usaste IA en este examen?**  ☐ Sí  ☐ No

> Usarla no penaliza. **No declararla anula este criterio completo (C5 = 0).**
> Si marcaste "No", firma igualmente la declaración del final.

| # | Qué le pedí | Qué me devolvió | Qué corregí, adapté o descarté — y por qué |
|:--:|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

**¿En qué se equivocó respecto a mi repositorio?**
*(Casi siempre se equivoca en algo: inventa rutas, propone una librería que el proyecto no usa, ignora el guard/filtro que ya existe, asume otra versión del framework. Describe al menos un caso concreto y cómo lo detectaste.)*



---

## 6. Evidencia

| Archivo | Qué demuestra |
|---|---|
| `antes-….png` | |
| `despues-….png` | |
| | |

**Cómo reproducir mi cambio desde cero:**

```bash
# comandos exactos: levantar, autenticarse, ejecutar el caso
```

---

## 7. Prueba automatizada

| | |
|---|---|
| **Archivo de la prueba** | |
| **Comando para ejecutarla** | `` |
| **Qué verifica** | |
| **¿Falla sin mi cambio?** | Sí / No — *explica cómo lo comprobaste* |

*Pega la salida de la prueba pasando:*

```
```

---

## 8. Estado final — honesto

**Funciona:**
-

**No funciona / quedó incompleto:**
-

**Cuál era mi siguiente paso:**


> Declarar con precisión lo que no terminaste **conserva** los puntos de C2, C3, C4 y C5. Presentar como terminado algo que no funciona los pone en riesgo todos.

---

## 9. Declaración

> Declaro que este trabajo es individual, que corresponde a la actividad que me fue asignada, y que la sección 5 refleja de forma completa y veraz el uso que hice de herramientas de Inteligencia Artificial durante el examen.

**Nombre:**
**Fecha:**
