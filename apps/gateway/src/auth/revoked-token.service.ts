import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RevokedTokenService implements OnModuleInit {
  private client: RedisClientType;

  constructor(private readonly configService: ConfigService) {
    this.client = createClient({
      url: `redis://${this.configService.get('REDIS_HOST', 'redis')}:${this.configService.get('REDIS_PORT', '6379')}`,
    });

    this.client.on('error', (err) => {
      console.error('Redis Error:', err);
    });
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async revokeToken(jti: string, ttlSeconds: number) {
    await this.client.set(`revoked:${jti}`, 'true', {
      EX: ttlSeconds,
    });
  }

  async isRevoked(jti: string): Promise<boolean> {
    const value = await this.client.get(`revoked:${jti}`);
    return value !== null;
  }
}