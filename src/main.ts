import { NestFactory } from '@nestjs/core';
import { AppModule } from './core';
import { AccessKeyCache } from './common/access-key-cache';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  AccessKeyCache.resetRateLimitBuckets();
  await app.listen(3000);
}
bootstrap();
