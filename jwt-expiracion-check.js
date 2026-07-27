// Demuestra el ciclo completo de un JWT (emisión -> validación -> expiración)
// usando el mismo JwtService/JWT_SECRET/JWT_EXPIRES_IN que usa el Gateway real
// (ver apps/gateway/src/auth/auth.module.ts y jwt.strategy.ts), pero con un
// expiresIn corto para poder observar el rechazo sin esperar 1h.
//
// Uso: cd apps/gateway && node ../../jwt-expiracion-check.js
const { JwtService } = require('@nestjs/jwt');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'biblioteca-secret';
const jwtService = new JwtService({ secret: SECRET, signOptions: { expiresIn: '2s' } });

const payload = { sub: 'admin', username: 'admin', roles: ['admin'] };
const token = jwtService.sign(payload);
console.log('1) Login -> access_token emitido con expiresIn=2s:');
console.log('  ', token);

console.log('\n2) Validación inmediata (igual que JwtStrategy, ignoreExpiration:false):');
try {
  console.log('   OK ->', JSON.stringify(jwt.verify(token, SECRET, { ignoreExpiration: false })));
} catch (e) {
  console.log('   RECHAZADO ->', e.name, '-', e.message);
}

setTimeout(() => {
  console.log('\n3) Misma validación pasados 3s (token ya expiró):');
  try {
    console.log('   OK ->', JSON.stringify(jwt.verify(token, SECRET, { ignoreExpiration: false })));
  } catch (e) {
    console.log('   RECHAZADO ->', e.name, '-', e.message);
    console.log('   (JwtAuthGuard.handleRequest recibe err y responde 401 Unauthorized, igual que en el Gateway real)');
  }
}, 3000);
