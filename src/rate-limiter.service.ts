import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AccessKeyDetails, RunningRateLimit } from './models';
import { redis } from './common';

@Injectable()
export class RateLimiterService {
  async rateLimit(accessKeyDetails: AccessKeyDetails): Promise<boolean> {
    const now = new Date();

    if (new Date(accessKeyDetails.expiry).getTime() < now.getTime()) {
      throw new HttpException('API key expired', HttpStatus.UNAUTHORIZED);
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
      throw new HttpException(
        'Rate limit reached.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const lastReset = new Date(runningRateLimit.lastReset);
    const newRemainingLimit = runningRateLimit.remainingLimit - 1;

    if (newRemainingLimit < 0) {
      throw new HttpException(
        'Rate limit reached.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
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

    return true;
  }
}
