# Catálogo de Actividades — Examen Final

> Busca en [`ASIGNACION.md`](ASIGNACION.md) cuál te toca y **trabaja solo esa**.
> Las seis están calibradas al mismo esfuerzo (~70 min de código) y cubren un tema distinto del curso.

| | Actividad | Tema del curso | Requiere del repo |
|:--:|---|---|---|
| **A** | Revocación de sesión JWT (logout real) | JWT + Guard (T3) | login JWT · *Paso 0 si no existe* |
| **B** | Nuevo salto síncrono con contrato | gRPC / TCP tipado (T2) | un transporte síncrono con contrato |
| **C** | Consumidor asíncrono idempotente | Mensajería, PUB/SUB (T1–T2) | un publisher de eventos |
| **D** | Observabilidad con contexto en un microservicio | Sentry (T3) | Sentry en algún punto · *Paso 0 si no existe* |
| **E** | Filtro de excepciones y mapeo de códigos | Excepciones (T1–T2) | cualquier flujo con errores |
| **F** | Resiliencia y medición: timeout + reintento | Latencia y acoplamiento (T1) | una llamada síncrona entre servicios |

**Formato común de cada actividad:** *Qué construir* → *Mínimo viable* → *Casos borde* → *Evidencia* → *Prueba* → *Anclaje obligatorio* → *3 preguntas de bitácora*.

**"Anclaje obligatorio"** es el requisito del criterio C2: en tu bitácora debes citar **archivo y línea del código que YA existía en tu repositorio** y con el que tu cambio se conecta. No vale crear una pieza paralela.

---

## Actividad A — Revocación de sesión JWT (logout real)

**El problema:** hoy, en el sistema de tu grupo, un token robado sigue siendo válido hasta que expire. Cerrar sesión en el cliente no invalida nada del lado del servidor. Vas a arreglarlo.

### Qué construir
1. Asegura que el token emitido en el login lleve un identificador único **`jti`** (si ya lo lleva, úsalo; si no, añádelo).
2. **`POST /auth/logout`** — ruta **protegida** (exige token válido). Al invocarse, registra el `jti` del token presentado en una **lista de revocados**, con **TTL igual al tiempo que le quedaba de vida al token**.
3. **El Guard existente** consulta esa lista antes de dejar pasar la petición. Token revocado → **401**, con un mensaje distinguible del de "token inválido o expirado".

> Usa **Redis**, que ya está levantado en el `docker-compose` de tu grupo. Si tu repo no lo tiene disponible, un almacén en memoria es aceptable **si explicas en la bitácora qué se rompe con más de una instancia del Gateway**.

### Mínimo viable
Logout responde 200 y la misma ruta protegida, con el mismo token, pasa de 200 a 401.

### Casos borde (para nivel 5 en C1)
- Logout **sin token** → 401 (no debe permitir revocar a un anónimo).
- Logout **dos veces** con el mismo token → no revienta.
- Un token **distinto y vigente** de otro usuario **sigue funcionando** tras el logout del primero.

### Evidencia (`docs/examen/<usuario>/`)
- `antes-ruta-protegida-200.png` — ruta protegida con el token, antes de revocar.
- `despues-logout-200.png` — respuesta del logout.
- `despues-ruta-protegida-401.png` — **la misma petición con el mismo token** → 401.

### Prueba automatizada
El guard rechaza un token cuyo `jti` está en la lista de revocados, y acepta uno que no lo está.

### Anclaje obligatorio
Cita el **guard** y el **servicio de autenticación** que ya existían en tu repo. Está prohibido crear un guard nuevo: extiendes el que hay.

### Paso 0 *(solo si tu repo no tiene login JWT)*
Login mínimo en el Gateway con un usuario fijo que emita un JWT firmado con `JWT_SECRET`, y un guard que valide el token en al menos una ruta. ~20 min. No suma puntos.

### Preguntas de bitácora
1. ¿Por qué el TTL de la entrada de revocación debe coincidir con la expiración del token, en vez de guardarla para siempre?
2. Si el almacén de revocados (Redis) está caído cuando llega una petición: ¿tu guard **falla abierto** (deja pasar) o **falla cerrado** (rechaza)? ¿Cuál elegiste y qué riesgo aceptas con esa decisión?
3. ¿En qué se diferencia esto de simplemente borrar el token en el navegador del cliente?

---

## Actividad B — Nuevo salto síncrono con contrato

**El problema:** hay una consulta entre servicios que hoy no existe y obligaría a duplicar datos. Vas a resolverla con el transporte síncrono con contrato que ya usa tu grupo (**gRPC** en la mayoría; **TCP con patrón de mensaje tipado** si tu grupo trabaja así).

### Qué construir
1. **Extiende el contrato** existente (`.proto` o el DTO/interfaz compartida) con **un método nuevo** que resuelva una consulta real de tu dominio y que hoy no se pueda responder. Ejemplos según dominio: *disponibilidad de un producto en una fecha*, *saldo disponible de una cuenta*, *estado de bloqueo de un usuario*, *cupo restante de una reserva*.
2. **Implementa el handler** en el servicio propietario del dato, con **validación de entrada** y **error tipado** cuando el recurso no existe o el argumento es inválido.
3. **Consúmelo desde otro servicio**, con `try/catch`, y **traduce el error al código HTTP correcto** en el Gateway (no 500).

### Mínimo viable
El servicio consumidor obtiene la respuesta del nuevo método a través del contrato, y el caso "no encontrado" devuelve un código HTTP correcto en vez de tumbar el servicio.

### Casos borde (para nivel 5 en C1)
- Recurso inexistente → error tipado (`NOT_FOUND` / equivalente) → **404** en el Gateway.
- Argumento inválido (id vacío, formato incorrecto) → `INVALID_ARGUMENT` → **400**.
- Servicio destino caído → el consumidor responde controlado, **no cuelga**.

### Evidencia
- `antes-sin-metodo.txt` — prueba de que la consulta no existía (grep del contrato previo o respuesta 404/501).
- `despues-caso-ok.png` — llamada exitosa de extremo a extremo.
- `despues-caso-error.png` — caso de error con el código HTTP correcto.

### Prueba automatizada
El consumidor traduce el error del contrato al código esperado **sin propagar una excepción no controlada**.

### Anclaje obligatorio
Cita el **contrato existente** (`.proto` o `libs/contracts`) y el **cliente ya registrado** en el módulo del consumidor. El método nuevo va en el contrato que ya existe, no en uno paralelo.

### Preguntas de bitácora
1. ¿Por qué el contrato debe vivir en un lugar compartido y no duplicado dentro de cada servicio?
2. ¿Qué código de error del transporte elegiste para "no encontrado" y a qué código HTTP lo mapeas? ¿Por qué **no** es correcto devolver 500?
3. Si mañana añades un campo nuevo al contrato, ¿siguen funcionando los clientes que no lo conocen? ¿Por qué?

---

## Actividad C — Consumidor asíncrono idempotente

**El problema:** los brokers de mensajería garantizan entrega **"al menos una vez"**. Si el mismo evento llega dos veces —porque hubo un reintento, un `nack` o una reconexión—, el efecto se duplica: dos descuentos de stock, dos registros de auditoría, dos notificaciones. Vas a impedirlo.

### Qué construir
1. **Toma un evento que tu grupo ya publica** (RabbitMQ o Redis) y trabaja sobre su consumidor. Si el consumidor **no existe** (varios grupos publican sin consumir), implementarlo es parte de tu actividad.
2. Añade una **clave de idempotencia**: el evento viaja con un identificador único y el consumidor **persiste** las claves ya procesadas.
3. Antes de aplicar el efecto, verifica la clave: **ya procesada → descarta y registra un log; nueva → procesa y guarda la clave**.
4. Envuelve el procesamiento en `try/catch` con log del error. Un fallo del consumidor **no puede tumbar el servicio**.

### Mínimo viable
Publicar el mismo evento **dos veces** produce **un solo** efecto en la base de datos.

### Casos borde (para nivel 5 en C1)
- Dos eventos **distintos** sí producen dos efectos (no rompiste el camino normal).
- Un evento con carga inválida se descarta con log, sin caída del consumidor.

### Evidencia
- `antes-evento-duplicado.png` — el mismo evento dos veces produciendo **dos** efectos (estado del sistema antes de tu cambio).
- `despues-evento-duplicado.png` — el mismo evento dos veces produciendo **uno**, con el log de descarte.
- Consulta a la BD o log del consumidor que respalde ambos casos.

### Prueba automatizada
Procesar dos veces el mismo evento deja **un solo** registro; dos eventos distintos dejan dos.

### Anclaje obligatorio
Cita el **publisher existente** (`emit(...)` / `publish(...)`) y el módulo del servicio consumidor. El evento que endureces debe ser uno que tu grupo ya publica.

### Preguntas de bitácora
1. ¿Por qué la garantía "al menos una vez" obliga a que la idempotencia viva en el **consumidor** y no en el publisher?
2. ¿Dónde guardas la clave procesada, y qué ocurre si el proceso muere **entre** aplicar el efecto y guardar la clave? ¿Qué harías para cerrar esa ventana?
3. ¿Qué diferencia hay entre **reintentar** un mensaje y mandarlo a una **cola de mensajes muertos (DLQ)**? ¿Cuándo conviene cada uno?

---

## Actividad D — Observabilidad con contexto en un microservicio

**El problema:** cuando hay observabilidad, suele estar solo en el Gateway. Pero los errores nacen **dentro** de los microservicios, y ahí es donde se pierde el contexto. Vas a instrumentar uno.

### Qué construir
1. **Inicializa Sentry en UN microservicio** (**no** en el Gateway; elige uno que hoy no lo tenga). La inicialización debe ser **condicional al DSN**: sin `SENTRY_DSN`, el servicio arranca igual y Sentry queda en modo no-op.
2. Registra un **filtro/handler de excepciones** en ese servicio que capture los errores hacia Sentry.
3. Cada evento capturado debe llevar **tags** —como mínimo `service` y `transport` (`tcp`/`redis`/`rabbitmq`/`grpc`/`http`)— y **contexto útil**: la operación que se estaba ejecutando y un identificador de correlación.
4. Añade **al menos un breadcrumb** que ayude a reconstruir qué pasó antes del error.
5. Asegúrate de que **no viajen datos sensibles** (contraseñas, tokens, datos personales).

### Mínimo viable
Un error provocado dentro de ese microservicio aparece en el panel de Sentry, con el tag `service` correcto.

### Casos borde (para nivel 5 en C1)
- **Sin `SENTRY_DSN` el servicio arranca igual** (verificado con la prueba automatizada).
- El evento capturado muestra tags **y** contexto en el panel, no solo el stack trace.

### Evidencia
- `antes-error-sin-captura.png` — el mismo error antes de tu cambio: visible en la consola, ausente del panel.
- `despues-panel-sentry.png` — **captura del panel de Sentry** con el evento del microservicio.
- `despues-tags-contexto.png` — vista de Tags y Contexts del evento.

### Prueba automatizada
La inicialización es **no-op sin DSN**: el servicio arranca y el módulo no lanza. (Si tu stack lo permite, verifica además que la función de captura se invoca al producirse el error.)

### Anclaje obligatorio
Cita el **`main.ts`/`main.py`** del microservicio elegido y el **filtro o manejador de excepciones ya existente** en tu repo (o el del Gateway, si lo tomas como referencia de convención).

### Paso 0 *(solo si en tu repo no hay ninguna integración de Sentry)*
Crear la cuenta/proyecto en Sentry y obtener el DSN, e inyectarlo por variable de entorno en el `docker-compose`. ~20 min. No suma puntos.

### Variante *(si tu repositorio YA tiene Sentry en todos sus servicios)*
Si al abrir tu repo compruebas que **todos** los servicios ya inicializan Sentry, no repitas trabajo hecho: tu actividad cambia de "instrumentar" a **"hacer cierto lo que el README afirma"**, con el mismo esfuerzo y la misma rúbrica:

1. **Verifica la afirmación.** Provoca un error que **no** pase por el punto de captura manual (uno que caiga al middleware/filtro global) y comprueba en el panel qué tags llegan realmente. Casi siempre llegan menos de los documentados.
2. **Cierra la brecha:** haz que **todos** los caminos de error —el manual y el global— apliquen la misma convención de tags (`service`, `transport`, `failure_mode`, `request_id` o la que use tu repo).
3. **Propaga el identificador de correlación** entre al menos dos servicios, de modo que un error en el servicio B pueda relacionarse con la petición que lo originó en el servicio A.
4. **Corrige el README** si la afirmación era más amplia que la realidad.

La evidencia entonces es: `antes-tags-incompletos.png` (panel mostrando los tags que faltaban) y `despues-tags-completos.png` (mismo tipo de error, ya con la convención completa). Las tres preguntas de bitácora son las mismas.

### Preguntas de bitácora
1. ¿Por qué la inicialización debe ser **no-op cuando no hay DSN** en vez de fallar al arrancar?
2. ¿Qué información **nunca** debe llegar a Sentry desde un sistema con datos de usuarios, y qué hiciste concretamente para impedirlo?
3. ¿Qué diferencia hay entre un **tag** y un **contexto** en Sentry, y por qué elegiste precisamente esos tags?

---

## Actividad E — Filtro de excepciones y mapeo de códigos

**El problema:** en la mayoría de estos sistemas, un error de negocio termina como **500**, o peor: como **201 con un cuerpo que dice `"FAILED"`**. Un cliente HTTP no puede programar contra eso. Vas a poner orden.

### Qué construir
1. **Audita** los flujos de error de tu repositorio y arma una **tabla del estado actual**: caso de error → código que devuelve hoy.
2. **Implementa un filtro global de excepciones** (HTTP en el Gateway o RPC en un microservicio, según dónde esté el problema en tu repo) que traduzca los errores de dominio al código correcto:

   | Situación | Código |
   |---|:--:|
   | Recurso no encontrado | **404** |
   | Conflicto de estado (duplicado, ya existe) | **409** |
   | Regla de negocio incumplida (saldo insuficiente, sin stock) | **422** |
   | Sin autenticar / sin permiso | **401 / 403** |
   | Error inesperado | **500** *(y solo este)* |

3. **Corrige al menos un caso real de tu repositorio** que hoy devuelva un código incorrecto.
4. El cuerpo del error debe ser **consistente** y **no filtrar detalles internos** (stack trace, SQL, rutas del servidor).

### Mínimo viable
Al menos **tres** situaciones distintas devuelven el código correcto gracias a tu filtro, y una de ellas es un caso que antes estaba mal.

### Casos borde (para nivel 5 en C1)
- Un error **inesperado** (no de dominio) sigue devolviendo 500 con cuerpo genérico, **sin filtrar el mensaje interno**.
- El filtro **no rompe** las respuestas correctas existentes.

### Evidencia
- `antes-codigos.md` — tabla del comportamiento previo, con capturas o `curl -i` que la respalden.
- `despues-codigos.md` — la misma tabla después, con las capturas equivalentes.
- Al menos **dos capturas** con el código HTTP visible.

### Prueba automatizada
Cada situación mapeada devuelve el código esperado; el error inesperado devuelve 500 **sin exponer el mensaje interno**.

### Anclaje obligatorio
Cita el **filtro o manejador de excepciones existente** en tu repo (si lo hay) y el **servicio de dominio** cuyos errores estás traduciendo. Si tu grupo ya registra un filtro, lo extiendes: no registras un segundo filtro en paralelo.

### Preguntas de bitácora
1. ¿Por qué devolver **201 con un cuerpo `{status:'FAILED'}`** es un problema para quien consume tu API? Da un ejemplo concreto de qué se rompe.
2. ¿Cuál es la diferencia entre **409** y **422**, y cuál usaste en tu caso? Justifica.
3. ¿Por qué el filtro **no debe** devolver al cliente el mensaje original de la excepción? ¿Qué se arriesga?

---

## Actividad F — Resiliencia y medición: timeout + reintento

**El problema:** en el Avance 1 midieron latencia y comprobaron que si un servicio cae, el llamador se cuelga. Nunca se arregló. Vas a hacerlo y a **demostrarlo con números**.

### Qué construir
1. **Elige una llamada síncrona entre servicios** de tu sistema (TCP, gRPC o HTTP interno).
2. Añade un **timeout explícito** a esa llamada. El valor debe estar **justificado con un dato** (tu propia medición), no elegido al azar.
3. Añade **reintento acotado con espera creciente (backoff)** — por ejemplo 2 reintentos con 100 ms y 300 ms.
4. Al agotarse los reintentos, **falla de forma controlada**: código de estado correcto (**503** o degradación documentada), nunca una espera indefinida ni una excepción sin capturar.
5. **Mide antes y después**, con el servicio destino ralentizado o caído, y reporta **p50 / p95 / máximo y número de errores**. Puedes reutilizar el `benchmark.js` del Avance 1.

### Mínimo viable
Con el servicio destino caído, el llamador responde un error controlado en un tiempo acotado, en vez de colgarse — y tienes la medición que lo prueba.

### Casos borde (para nivel 5 en C1)
- Con el servicio destino **sano**, la latencia **no empeora** de forma apreciable (tu cambio no penaliza el camino feliz).
- El reintento **no se aplica** a operaciones no idempotentes, o explicas por qué en tu caso es seguro.

### Evidencia
- `antes-benchmark.txt` — medición con el destino degradado **sin** tu cambio (p50/p95/máx + errores).
- `despues-benchmark.txt` — la misma medición **con** tu cambio.
- `despues-fallo-controlado.png` — respuesta del sistema con el destino caído.
- Tabla comparativa en la bitácora.

### Prueba automatizada
Al agotarse los reintentos, el llamador devuelve el código controlado y **no propaga** una excepción sin capturar.

### Anclaje obligatorio
Cita la **llamada existente** en tu repo (archivo:línea del `send()`/`lastValueFrom()`/cliente HTTP) que estás endureciendo, y la tabla de latencia del **Avance 1** de tu README con la que comparas.

### Preguntas de bitácora
1. ¿Por qué un reintento **sin backoff** puede empeorar una caída en vez de ayudar?
2. ¿Qué tipo de operaciones **no** se deben reintentar nunca, y por qué? ¿La tuya es de ese tipo?
3. ¿Qué valor de timeout elegiste y **con qué dato concreto** lo justificas? (Si es un número redondo sin medición detrás, dilo y explica cómo lo calibrarías.)

---

## Nota común a las seis actividades

Si al terminar el bloque tu implementación está incompleta, **dilo con precisión en la bitácora**: qué funciona, qué no, hasta dónde llegaste y cuál era el siguiente paso. Una entrega parcial descrita con honestidad conserva **C2, C3, C4 y C5** —16 de los 20 puntos—; una entrega presentada como completa que no funciona pierde también la credibilidad del resto, tal como se penalizó en las revisiones de los avances.
