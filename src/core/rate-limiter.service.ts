import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AccessKeyDetails, RequestLogItem, RunningRateLimit } from '../models';
import { redis } from '../common';
import { nanoid } from 'nanoid';

@Injectable()
export class RateLimiterService {
  /**
   *
   * Applies dynamic rate-limiting rules based on access key and logs the request.
   * @param accessKeyDetails Access key information required to apply dynamic rate limits
   * @returns Promise<void>
   *
   */
  async rateLimit(accessKeyDetails: AccessKeyDetails): Promise<void> {
    const now = new Date();

    if (new Date(accessKeyDetails.expiry).getTime() < now.getTime()) {
      const errorMessage = 'API key expired';
      const statusCode = HttpStatus.UNAUTHORIZED;
      const requestLog: RequestLogItem = {
        id: nanoid(),
        accessKeyValue: accessKeyDetails.accessKey,
        requestTime: now,
        rateLimited: false,
        errorMessage,
        statusCode,
      };

      redis.set(
        `requestLog:${accessKeyDetails.accessKey}`,
        JSON.stringify(requestLog),
      );
      throw new HttpException(errorMessage, statusCode);
    }

    const runningRateLimitJson = await redis.get(
      `rateLimit:${accessKeyDetails.accessKey}`,
    );

    const runningRateLimit = JSON.parse(
      runningRateLimitJson,
    ) as RunningRateLimit;

    if (!runningRateLimit) {
      const newRunningRateLimit: RunningRateLimit = {
        accessKeyValue: accessKeyDetails.accessKey,
        interval: 60,
        remainingLimit: accessKeyDetails.limitPerSecond,
        lastReset: new Date(),
      };

      await redis.set(
        `rateLimit:${accessKeyDetails.accessKey}`,
        JSON.stringify(newRunningRateLimit),
      );
    }

    if (runningRateLimit.remainingLimit === 0) {
      const errorMessage = 'Rate limit reached.';
      const statusCode = HttpStatus.TOO_MANY_REQUESTS;
      const requestLog: RequestLogItem = {
        id: nanoid(),
        accessKeyValue: accessKeyDetails.accessKey,
        requestTime: now,
        rateLimited: true,
        errorMessage,
        statusCode,
      };

      redis.set(
        `requestLog:${accessKeyDetails.accessKey}`,
        JSON.stringify(requestLog),
      );

      throw new HttpException(errorMessage, statusCode);
    }

    const lastReset = new Date(runningRateLimit.lastReset);
    const newRemainingLimit = runningRateLimit.remainingLimit - 1;

    if (newRemainingLimit < 0) {
      const errorMessage = 'Rate limit reached.';
      const statusCode = HttpStatus.TOO_MANY_REQUESTS;
      const requestLog: RequestLogItem = {
        id: nanoid(),
        accessKeyValue: accessKeyDetails.accessKey,
        requestTime: now,
        rateLimited: true,
        errorMessage,
        statusCode,
      };

      redis.set(
        `requestLog:${accessKeyDetails.accessKey}`,
        JSON.stringify(requestLog),
      );

      throw new HttpException(errorMessage, statusCode);
    }

    const newRunningRateLimit: RunningRateLimit = {
      accessKeyValue: accessKeyDetails.accessKey,
      interval: 60,
      remainingLimit: newRemainingLimit,
      lastReset: lastReset,
    };

    await redis.set(
      `rateLimit:${accessKeyDetails.accessKey}`,
      JSON.stringify(newRunningRateLimit),
    );
  }
}
