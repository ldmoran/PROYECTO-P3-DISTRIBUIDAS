import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || 'https://59c710be822aacc870e73ff0f02fa665@o4511580700213248.ingest.us.sentry.io/4511804367241216',
  environment: process.env.SENTRY_ENVIRONMENT || 'development',
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 1.0),
  release: process.env.SENTRY_RELEASE || 'libros@1.0.0',
  dataCollection: {
    // Descomenta estas líneas si deseas desactivar la recopilación de datos del usuario
    // userInfo: false,
    // httpBodies: [],
  },
});
