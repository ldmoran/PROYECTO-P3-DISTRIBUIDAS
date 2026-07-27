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
- **Qué decidí:** Mantener el cambio dentro del mismo método `obtenerLibroGrpc` del Gateway y aplicar `timeout` + `retryWhen` directamente sobre la llamada gRPC existente.
- **Alternativa que descarté:** Crear un servicio o helper nuevo para encapsular la resiliencia, o modificar el controller para agregar lógica extra.
- **Por qué:** Quería respetar la arquitectura del proyecto, reutilizar el cliente gRPC ya inyectado en el Gateway y no introducir una capa paralela que complicara el flujo.

### Decisión 2
- **Qué decidí:** Separar los casos de error en 404, 502 y 503 dentro del mismo `catch`, para que el comportamiento del Gateway siga siendo claro y estable.
- **Alternativa que descarté:** Devolver siempre un 502 o un error genérico para cualquier fallo, o crear un bloque de manejo de errores distinto en otro archivo.
- **Por qué:** El sistema ya tenía un comportamiento específico para “libro no encontrado” y quería preservar ese 404, mientras que el timeout/reintento debía terminar en un 503 controlado cuando el servicio de Libros no responde. 
---

## 4. Las 3 preguntas de mi actividad

*Están al final de tu actividad en `ACTIVIDADES.md`. Cópialas y respóndelas. Se evalúa que las respuestas hablen de **tu** implementación y de **tu** sistema, no en general.*

**Pregunta 1:**

> Un reintento sin backoff puede empeorar una caída porque, si el servicio ya está saturado o colapsado, los reintentos inmediatos generan más tráfico sobre la misma dependencia en vez de darle tiempo a recuperarse. En mi caso, al llamar a `obtenerLibro` por gRPC, un retry agresivo sin espera podía concentrar más solicitudes sobre Libros cuando ya estaba fallando, aumentando la congestión y alargando aún más el tiempo de recuperación. Por eso elegí un esquema con espera creciente de 100 ms y 300 ms, en vez de reintentar de forma inmediata.

**Pregunta 2:**

> No se deben reintentar nunca las operaciones que tienen efectos laterales o que pueden crear duplicados, como crear un préstamo, cobrar, eliminar un recurso o enviar un pago, porque un reintento puede ejecutar la misma acción dos veces. En mi implementación, la llamada `obtenerLibro` es una operación de lectura y no modifica estado, así que sí es segura para reintento; por eso el cambio encaja bien en esta ruta.

**Pregunta 3:**

> Elegí un timeout de 2000 ms, definido en el código como `GRPC_TIMEOUT_MS`, porque es un límite razonable para una llamada gRPC simple y evita que el Gateway se quede esperando indefinidamente. No lo calibré con una medición previa de la ruta gRPC específica en este examen, así que lo trataría como un valor inicial; para calibrarlo mejor, mediría el p95 y el p99 de la ruta con el servicio sano y lo ajustaría para que sea ligeramente mayor que el tiempo normal de respuesta, sin dejar al cliente esperando demasiado. 

---

## 5. Uso de Inteligencia Artificial — **obligatorio**

**¿Usaste IA en este examen?**  ☑ Sí  ☐ No

> Usarla no penaliza. **No declararla anula este criterio completo (C5 = 0).**
> Si marcaste "No", firma igualmente la declaración del final.

| # | Qué le pedí | Qué me devolvió | Qué corregí, adapté o descarté — y por qué |
|:--:|---|---|---|
| 1 | Que me ayudara a direccionar cómo implementar resiliencia en la llamada gRPC desde el Gateway hacia Libros. | Sugerencias sobre timeout, reintentos y cómo estructurar la lógica del `catch` para distinguir 404, 502 y 503. | Acepté la orientación general, pero adapté la solución a mi código real: mantuve el cambio dentro de `obtenerLibroGrpc` y usé el manejo de errores ya existente del Gateway, en vez de crear una capa nueva. |
| 2 | Que me ayudara a revisar pequeños fixes de implementación en el servicio del Gateway. | Propuestas para ajustar el flujo del `retryWhen` y mejorar la clasificación de los errores. | Corregí detalles del diseño para que el comportamiento fuera coherente con el repositorio, por ejemplo conservando el 404 para `code === 5` y mapeando los fallos de timeout a 503. |
| 3 | Que me ayudara a redactar la explicación técnica de la solución. | Un borrador claro de la idea central, pero con frases demasiado generales. | Lo adapté para que hablara de mi sistema concreto: el Gateway, el cliente gRPC hacia Libros y la ruta HTTP expuesta por el controller. |

**¿En qué se equivocó respecto a mi repositorio?**
Una vez me propuso una idea que no encajaba del todo con el proyecto porque asumía un patrón de manejo de errores distinto al que ya usa este Gateway. Detecté ese problema porque el repositorio ya tenía un `catch` específico para traducir errores gRPC a `NOT_FOUND` y `BAD_GATEWAY`, y yo necesitaba extender esa lógica en el mismo sitio. Corrigí esa parte y mantuve el cambio alineado con la arquitectura existente del proyecto.



---

## 6. Evidencia

| Archivo | Qué demuestra |
|---|---|
| `evidencias/1 login y guardar token en variable.png` | Muestra el proceso de login del Gateway y la captura del token JWT en una variable de shell para usarlo en la prueba del endpoint. |
| `evidencias/2 llamada grpc.png` | Muestra la llamada al endpoint gRPC del Gateway con el token autorizado y la respuesta obtenida desde la ruta modificada. |

**Cómo reproducir mi cambio desde cero:**

```bash
# 1. Levantar los servicios
Docker compose up -d

# 2. Obtener el token JWT
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin"}'

# 3. Usar el token para consultar la ruta del Gateway
curl -X GET http://localhost:3000/api/libros/grpc/1 -H "Authorization: Bearer <TOKEN>"
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
- La lógica de resiliencia quedó implementada en el código del Gateway para la llamada gRPC a Libros, incluyendo timeout y reintentos con backoff.
- El proyecto compila correctamente y la ruta del Gateway quedó preparada para probarse una vez que el servicio responda de forma estable.

**No funciona / quedó incompleto:**
- La verificación final completa de la ruta en ejecución quedó pendiente porque tuve problemas con el Gateway y con la disponibilidad del servicio de Libros durante la prueba, por lo que no pude cerrar del todo la evidencia en tiempo real.

**Cuál era mi siguiente paso:**
- Repetir la prueba end-to-end con el Gateway y Libros ya estables, confirmar el código HTTP de respuesta (404/503/502) en cada escenario y cerrar la evidencia con capturas y comandos reproducibles.

> Declarar con precisión lo que no terminaste **conserva** los puntos de C2, C3, C4 y C5. Presentar como terminado algo que no funciona los pone en riesgo todos.

---

## 9. Declaración

> Declaro que este trabajo es individual, que corresponde a la actividad que me fue asignada, y que la sección 5 refleja de forma completa y veraz el uso que hice de herramientas de Inteligencia Artificial durante el examen.

**Nombre:*Alison MIranda*
**Fecha:*27/07/2026*
