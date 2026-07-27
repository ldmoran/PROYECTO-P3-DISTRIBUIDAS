# Asignación de actividades — Examen Final

> Busca tu nombre. Esa es tu actividad, y solo esa. El detalle está en [`ACTIVIDADES.md`](ACTIVIDADES.md).

---

## Regla de asignación

La asignación es **determinista y verificable**, no arbitraria:

```
posición P = orden alfabético por APELLIDO dentro del grupo (1, 2, 3, 4)
índice     = ((número de grupo + P − 2) mod 6) + 1
actividad  = 1→A · 2→B · 3→C · 4→D · 5→E · 6→F
```

La rotación por número de grupo garantiza dos cosas: **dentro de un grupo nadie repite actividad**, y **grupos distintos reciben mezclas distintas**, de modo que la solución de un compañero de otro grupo no sirve — cada actividad se resuelve sobre un repositorio y un dominio diferentes.

---

## Tabla de asignación

### Grupo 1 — Fijazo · `Saint-Roche-Microsystems/Fijazo-Horrrocruxes-SRMC`

| P | Integrante | GitHub | Actividad | Sobre qué trabajará |
|:--:|---|---|:--:|---|
| 1 | Carlos Hernández | @gomiiDev | **A** | Revocación de sesión JWT |
| 2 | Olivier Paspuel | @vieerr | **B** | Nuevo salto síncrono con contrato |
| 3 | Antonio Revilla | @RevillaA | **C** | Consumidor asíncrono idempotente |
| 4 | Frederick Tipán | @devdiagon | **D** | Observabilidad con contexto *(ver variante, §D)* |

> **Nota para Frederick (D):** su repositorio **ya tiene Sentry en los 5 servicios**, así que aplica la **variante** descrita en la actividad D: el trabajo es enriquecer el contexto y **hacer cierta la afirmación del README** de que todos los eventos llevan los mismos tags (hoy solo los llevan los que pasan por `capture_error`, no los que caen al middleware global).

### Grupo 2 — Barber-Flow · `AlexDaniel593/barber-flow`

| P | Integrante | GitHub | Actividad | Sobre qué trabajará |
|:--:|---|---|:--:|---|
| 1 | Kerly Chiroboga | @k0c0h | **B** | Nuevo salto síncrono con contrato |
| 2 | Daniel Guaman | @AlexDaniel593 | **C** | Consumidor asíncrono idempotente |
| 3 | Javier Jaguaco | @JonathanJQ03 | **D** | Observabilidad con contexto · **Paso 0** |
| 4 | Reishel Tipan | @Reishel-Tipan | **E** | Filtro de excepciones y códigos |

### Grupo 3 — CafeCampus · `Steft91/30732_ProyectoCafeCampus`

| P | Integrante | GitHub | Actividad | Sobre qué trabajará |
|:--:|---|---|:--:|---|
| 1 | Stefany Díaz | @Steft91 | **C** | Consumidor asíncrono idempotente |
| 2 | Marcos Escobar | @IMarcusDev | **D** | Observabilidad con contexto |
| 3 | Mateo Sosa | @MatSosa1 | **E** | Filtro de excepciones y códigos |

### Grupo 4 — Ecommerce · `davidcepeda1/Ecommerce_Distribuidas`

| P | Integrante | GitHub | Actividad | Sobre qué trabajará |
|:--:|---|---|:--:|---|
| 1 | David Cepeda Salguero | @davidcepeda1 | **D** | Observabilidad con contexto · **Paso 0** |
| 2 | Juan Granda Arcos | @Juangranda3424 | **E** | Filtro de excepciones y códigos |
| 3 | Brayan Jácome Noroña | @BrayanJac | **F** | Resiliencia: timeout + reintento |
| 4 | Zaith Manangón Vinueza | @zmanangon09 | **A** | Revocación de sesión JWT · **Paso 0** |

### Grupo 5 — Biblioteca (P3-Distribuidas) · `ldmoran/PROYECTO-P3-DISTRIBUIDAS`

| P | Integrante | GitHub | Actividad | Sobre qué trabajará |
|:--:|---|---|:--:|---|
| 1 | Samir Mideros | @esmid17 | **E** | Filtro de excepciones y códigos |
| 2 | Alison Miranda | *(por confirmar)* | **F** | Resiliencia: timeout + reintento |
| 3 | David Moran | @ldmoran | **A** | Revocación de sesión JWT · **Paso 0** |
| 4 | Gabriel Vivanco | *(por confirmar)* | **B** | Nuevo salto síncrono con contrato |

### Grupo 6 — Tienda-microservicios · `DanielaLTM2206/tienda-microservicios`

| P | Integrante | GitHub | Actividad | Sobre qué trabajará |
|:--:|---|---|:--:|---|
| 1 | Jeffrey Manobanda | @jeffrey2206 | **F** | Resiliencia: timeout + reintento |
| 2 | Stiven Molina | @gsMolina02 | **A** | Revocación de sesión JWT · **Paso 0** |
| 3 | Daniela Tituaña | @DanielaLTM2206 | **B** | Nuevo salto síncrono con contrato |

### Grupo 7 — Sistema Bancario EMM · `MateoMedranda/sistema_bancario`

| P | Integrante | GitHub | Actividad | Sobre qué trabajará |
|:--:|---|---|:--:|---|
| 1 | Moisés Benalcázar | *(por confirmar)* | **A** | Revocación de sesión JWT |
| 2 | Mateo Medranda | @MateoMedranda | **B** | Nuevo salto síncrono con contrato |
| 3 | Erick Obando | @ErickObando *(por confirmar)* | **C** | Consumidor asíncrono idempotente |

---

## Resumen: quién hace qué

| Actividad | Estudiantes |
|:--:|---|
| **A** — Revocación JWT | Hernández (G1) · Manangón (G4) · Moran (G5) · Molina (G6) · Benalcázar (G7) |
| **B** — Salto síncrono con contrato | Paspuel (G1) · Chiroboga (G2) · Vivanco (G5) · Tituaña (G6) · Medranda (G7) |
| **C** — Consumidor idempotente | Revilla (G1) · Guaman (G2) · Díaz (G3) · Obando (G7) |
| **D** — Observabilidad con contexto | Tipán (G1) · Jaguaco (G2) · Escobar (G3) · Cepeda (G4) |
| **E** — Excepciones y códigos | Tipan (G2) · Sosa (G3) · Granda (G4) · Mideros (G5) |
| **F** — Resiliencia y medición | Jácome (G4) · Miranda (G5) · Manobanda (G6) |

---

## Quiénes hacen **Paso 0**

Los grupos **2, 4, 5 y 6** no publicaron el Avance 3, así que sus repositorios pueden carecer de la base de JWT o de Sentry. Si tu actividad es **A** o **D** y estás en uno de esos grupos, empiezas por el **Paso 0** de tu actividad (≈20 min, no puntúa).

| Estudiante | Grupo | Actividad | Paso 0 |
|---|:--:|:--:|---|
| Javier Jaguaco | G2 | D | Proyecto en Sentry + DSN por variable de entorno |
| David Cepeda | G4 | D | Proyecto en Sentry + DSN por variable de entorno |
| Zaith Manangón | G4 | A | Login mínimo que emita JWT + guard en una ruta |
| David Moran | G5 | A | Login mínimo que emita JWT + guard en una ruta |
| Stiven Molina | G6 | A | Login mínimo que emita JWT + guard en una ruta |

> **Antes de asumir que te toca el Paso 0, comprueba tu repositorio.** Si la base ya existe —aunque el grupo no la haya documentado—, sáltatelo, gana esos 20 minutos y deja constancia en la bitácora indicando el archivo donde ya estaba.

---

## Notas de administración *(para el docente)*

- Los nombres y usuarios de GitHub se tomaron de la **tabla "Equipo" del README de cada repositorio** al 26-jul-2026. Tres integrantes tienen el usuario sin confirmar porque su propio README conserva el marcador `@usuario` (G5 ×2, G7 ×1); conviene verificarlos en la lista de clase antes de publicar el examen.
- Si un roster cambia (integrante que se retira, grupo que se reorganiza), **la asignación se recalcula con la fórmula**, no se reparte a mano: reordenar por apellido y volver a aplicar `((G + P − 2) mod 6) + 1`.
- Las actividades **E** y **F** no tienen prerrequisito de Avance 3, por lo que sirven como reemplazo seguro si hubiera que reasignar a alguien a última hora.
- La rotación produce, a propósito, que **ningún grupo tenga las seis actividades**: con 3–4 integrantes cada grupo recibe un subconjunto distinto.
