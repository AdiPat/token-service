import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/core';
import { redis } from '../src/common';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await redis.flushdb();
  });

  describe('/tokens/{tokenId} (GET)', () => {
    it('/tokens/bitcoin (GET): fails with UNAUTHORIZED', () => {
      return request(app.getHttpServer())
        .get('/tokens/bitcoin')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('/tokens/bitcoin (GET): valid key allows request', async () => {
      const xApiKey = 'validkey';
      await redis.set(
        `accessKeyDetails:${xApiKey}`,
        JSON.stringify({
          accessKey: xApiKey,
          limitPerSecond: 100,
          disabled: false,
          expiry: new Date().getTime() + 1000 * 60 * 60 * 24,
        }),
      );

      return request(app.getHttpServer())
        .get('/tokens/bitcoin')
        .expect(HttpStatus.OK)
        .set('x-api-key', xApiKey)
        .expect((res) => {
          if (!res.body) {
            throw new Error('Invalid response body');
          }
        });
    });

    it('/tokens/bitcoin (GET): disabled key fails with UNAUTHORIZED', async () => {
      const xApiKey = 'disabledkey';
      await redis.set(
        `accessKeyDetails:${xApiKey}`,
        JSON.stringify({
          accessKey: xApiKey,
          limitPerSecond: 100,
          disabled: true,
          expiry: new Date().getTime() + 1000 * 60 * 60 * 24,
        }),
      );

      return request(app.getHttpServer())
        .get('/tokens/bitcoin')
        .expect(HttpStatus.UNAUTHORIZED)
        .set('x-api-key', xApiKey);
    });

    it('/tokens/bitcoin (GET): expired key fails with UNAUTHORIZED', async () => {
      const xApiKey = 'expiredkey';
      await redis.set(
        `accessKeyDetails:${xApiKey}`,
        JSON.stringify({
          accessKey: xApiKey,
          limitPerSecond: 100,
          disabled: false,
          expiry: new Date().getTime() - 1000 * 60 * 60 * 24,
        }),
      );

      return request(app.getHttpServer())
        .get('/tokens/bitcoin')
        .expect(HttpStatus.UNAUTHORIZED)
        .set('x-api-key', xApiKey);
    });

    it('/tokens/bitcoin (GET): rate limited key fails with TOO_MANY_REQUESTS', async () => {
      const xApiKey = 'ratelimitedkey';
      await redis.set(
        `accessKeyDetails:${xApiKey}`,
        JSON.stringify({
          accessKey: xApiKey,
          limitPerSecond: 1,
          disabled: false,
          expiry: new Date().getTime() + 1000 * 60 * 60 * 24,
        }),
      );

      await redis.set(
        `rateLimit:${xApiKey}`,
        JSON.stringify({
          accessKeyValue: xApiKey,
          interval: 60,
          remainingLimit: 0,
          lastReset: new Date(),
        }),
      );

      return request(app.getHttpServer())
        .get('/tokens/bitcoin')
        .expect(HttpStatus.TOO_MANY_REQUESTS)
        .set('x-api-key', xApiKey);
    });
  });

  it('/tokens/bitcoin (GET): rate limited key fails with TOO_MANY_REQUESTS for multiple requests', async () => {
    const requestLimit = 10;

    await redis.flushdb();
    const xApiKey = 'ratelimitedkey';
    await redis.set(
      `accessKeyDetails:${xApiKey}`,
      JSON.stringify({
        accessKey: xApiKey,
        limitPerSecond: requestLimit, // this should be limit per min
        disabled: false,
        expiry: new Date().getTime() + 1000 * 60 * 60 * 24,
      }),
    );

    for (let i = 0; i < requestLimit; i++) {
      await request(app.getHttpServer())
        .get('/tokens/bitcoin')
        .expect(HttpStatus.OK)
        .set('x-api-key', xApiKey);
    }

    return request(app.getHttpServer())
      .get('/tokens/bitcoin')
      .expect(HttpStatus.TOO_MANY_REQUESTS)
      .set('x-api-key', xApiKey);
  });
});
