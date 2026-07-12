/**
 * benchmark.js — Mide latencia (promedio, p95, máx) del camino SÍNCRONO
 * (Gateway -> Préstamos -> Libros por TCP) vs. el camino ASÍNCRONO
 * (Préstamos -> Redis, sin esperar a Notificaciones).
 *
 * Solo usa el módulo http nativo de Node (sin librerías externas).
 *
 * Uso:
 *   1) Levanta el sistema:      docker compose up -d --build
 *   2) Crea un libro de prueba: POST http://localhost:3000/api/libros
 *      y copia su "id".
 *   3) Ejecuta:                 node benchmark.js <libroId>
 */
const http = require('http');

const GATEWAY_HOST = 'localhost';
const GATEWAY_PORT = 3000;
const ITERATIONS = 50;

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const start = process.hrtime.bigint();
    const req = http.request(
      {
        host: GATEWAY_HOST,
        port: GATEWAY_PORT,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let chunks = '';
        res.on('data', (c) => (chunks += c));
        res.on('end', () => {
          const end = process.hrtime.bigint();
          const ms = Number(end - start) / 1_000_000;
          resolve({ status: res.statusCode, ms, body: chunks });
        });
      },
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function stats(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = sum / sorted.length;
  const p95Index = Math.max(Math.floor(sorted.length * 0.95) - 1, 0);
  const p95 = sorted[p95Index];
  const max = sorted[sorted.length - 1];
  return { avg, p95, max };
}

async function medirCaminoSincrono(libroId) {
  const tiempos = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const { ms, status } = await post('/api/prestamos/test-sync', { libroId });
    if (status < 300) tiempos.push(ms);
  }
  return { stats: stats(tiempos), ok: tiempos.length };
}

async function medirCaminoAsincrono() {
  const tiempos = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const { ms, status } = await post('/api/prestamos/test-async', {});
    if (status < 300) tiempos.push(ms);
  }
  return { stats: stats(tiempos), ok: tiempos.length };
}

async function main() {
  const libroId = process.argv[2];
  if (!libroId) {
    console.error('Uso: node benchmark.js <libroId>');
    console.error('El libroId debe existir. Créalo primero con:');
    console.error('  POST http://localhost:3000/api/libros');
    process.exit(1);
  }

  console.log(`Ejecutando ${ITERATIONS} peticiones por camino contra http://${GATEWAY_HOST}:${GATEWAY_PORT}...\n`);

  console.log('1) Midiendo camino SÍNCRONO (Gateway -> Préstamos -> Libros por TCP)...');
  const sync = await medirCaminoSincrono(libroId);

  console.log('2) Midiendo camino ASÍNCRONO (Préstamos -> Redis, sin esperar a Notificaciones)...');
  const asinc = await medirCaminoAsincrono();

  console.log('\n=== Resultados (ms) ===');
  console.log(`Síncrono  -> ok: ${sync.ok}/${ITERATIONS} | avg: ${sync.stats.avg.toFixed(2)} | p95: ${sync.stats.p95.toFixed(2)} | max: ${sync.stats.max.toFixed(2)}`);
  console.log(`Asíncrono -> ok: ${asinc.ok}/${ITERATIONS} | avg: ${asinc.stats.avg.toFixed(2)} | p95: ${asinc.stats.p95.toFixed(2)} | max: ${asinc.stats.max.toFixed(2)}`);

  console.log('\nFilas listas para pegar en la tabla del README:');
  console.log(`| Síncrono | ${sync.stats.avg.toFixed(2)} | ${sync.stats.p95.toFixed(2)} | ${sync.stats.max.toFixed(2)} |`);
  console.log(`| Asíncrono | ${asinc.stats.avg.toFixed(2)} | ${asinc.stats.p95.toFixed(2)} | ${asinc.stats.max.toFixed(2)} |`);
}

main();
