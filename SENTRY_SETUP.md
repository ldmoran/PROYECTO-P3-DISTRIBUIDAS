# Integración de Sentry - Observabilidad del Sistema

## ✅ Pasos Completados

### 1. Instalación de dependencias
Se instaló `@sentry/nestjs` en todos los microservicios:
- `apps/gateway`
- `apps/libros`
- `apps/prestamos`
- `apps/notificaciones`

### 2. Configuración de Sentry
Se crearon archivos `instrument.ts` en cada microservicio con la inicialización de Sentry.

Archivo `.env` (no versionado, cada integrante crea el suyo) con:
```
SENTRY_DSN=<DSN del proyecto de Sentry, sin comillas>
```

> El DSN real nunca debe quedar commiteado ni como valor por defecto en el código: cualquiera con el DSN público puede enviar eventos falsos a esa cuenta. `instrument.ts` en cada servicio ahora usa `process.env.SENTRY_DSN` sin fallback — si falta la variable, Sentry simplemente no reporta en vez de apuntar a una cuenta ajena.

### 3. Importación en main.ts
Cada archivo `main.ts` ahora importa `instrument.ts` al inicio:
```typescript
import './instrument';
```

### 4. Módulo SentryModule agregado
Se añadió `SentryModule.forRoot()` a cada `app.module.ts` y se registró `SentryGlobalFilter` como filtro global de excepciones.

### 5. Captura en filtros de excepciones
Se agregó el decorador `@SentryExceptionCaptured()` a los métodos `catch()` en:
- `apps/gateway/src/common/filters/http-exception.filter.ts`
- `apps/libros/src/common/filters/rpc-exception.filter.ts`
- `apps/prestamos/src/common/filters/rpc-exception.filter.ts`
- `apps/notificaciones/src/common/filters/rpc-exception.filter.ts`

### 6. Variables de entorno en Docker Compose
Se agregaron las variables a cada servicio en `docker-compose.yml`:
```yaml
SENTRY_DSN: ${SENTRY_DSN}
SENTRY_ENVIRONMENT: development
SENTRY_TRACES_SAMPLE_RATE: "1.0"
SENTRY_RELEASE: <servicio>@1.0.0
```

---

## 🚀 Pasos Finales

### Antes de ejecutar Docker Compose:

1. **Verifica el archivo `.env`** en la raíz del proyecto con el DSN correcto.

2. **Inicia los servicios:**
   ```bash
   docker-compose up -d
   ```

3. **Verifica que Sentry esté funcionando:**
   - Accede a cualquier endpoint del Gateway (ej: http://localhost:3000/libros)
   - Genera un error deliberadamente (ej: solicita un libro que no existe)
   - El error debería aparecer en tu dashboard de Sentry

### Panel de Sentry:

- URL: https://sentry.io/projects/node/
- Allí podrás ver:
  - Errores capturados en tiempo real
  - Stack traces completos
  - Contexto de cada error (microservicio, ambiente, versión)
  - Alertas configuradas

---

## 📋 Resumen de Archivos Modificados

### Creados:
- `apps/gateway/src/instrument.ts`
- `apps/libros/src/instrument.ts`
- `apps/prestamos/src/instrument.ts`
- `apps/notificaciones/src/instrument.ts`
- `.env` (raíz del proyecto)

### Modificados:
- `apps/gateway/src/main.ts` - Agregar import de instrument
- `apps/libros/src/main.ts` - Agregar import de instrument
- `apps/prestamos/src/main.ts` - Agregar import de instrument
- `apps/notificaciones/src/main.ts` - Agregar import de instrument
- `apps/gateway/src/app.module.ts` - Agregar SentryModule
- `apps/libros/src/app.module.ts` - Agregar SentryModule
- `apps/prestamos/src/app.module.ts` - Agregar SentryModule
- `apps/notificaciones/src/app.module.ts` - Agregar SentryModule
- `apps/gateway/src/common/filters/http-exception.filter.ts` - Agregar @SentryExceptionCaptured
- `apps/libros/src/common/filters/rpc-exception.filter.ts` - Agregar @SentryExceptionCaptured
- `apps/prestamos/src/common/filters/rpc-exception.filter.ts` - Agregar @SentryExceptionCaptured
- `apps/notificaciones/src/common/filters/rpc-exception.filter.ts` - Agregar @SentryExceptionCaptured
- `docker-compose.yml` - Agregar variables SENTRY_* a cada servicio

---

## 🔍 Cómo funciona

Cuando ocurre un error en cualquier microservicio:

1. El error es capturado por el filtro global `SentryGlobalFilter`
2. Si el método está decorado con `@SentryExceptionCaptured()`, se envía a Sentry
3. Sentry recibe el evento con:
   - Stack trace
   - Contexto del request
   - Variables de ambiente (SENTRY_ENVIRONMENT, SENTRY_RELEASE)
   - Datos del microservicio que originó el error

---

## 📝 Notas Importantes

- El DSN está configurado en `.env` y se carga en tiempo de ejecución
- `SENTRY_TRACES_SAMPLE_RATE: "1.0"` captura el 100% de transacciones (para desarrollo). En producción, reduce este valor.
- El ambiente se configura como `development` por defecto; cámbialo en docker-compose o en las variables de entorno
- Los source maps no están configurados automáticamente. Para producción, considera usar el wizard de Sentry

---

## ✨ Prueba Rápida

Para verificar que funciona, agrega este endpoint temporal en cualquier controlador:

```typescript
@Get('/debug-sentry')
getError() {
  throw new Error('Prueba de integración con Sentry');
}
```

Luego accede a `http://localhost:3000/debug-sentry` (o el puerto correspondiente) y verás el error en tu dashboard de Sentry.
