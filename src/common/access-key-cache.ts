import { AccessKeyDetails, RunningRateLimit } from '../models';
import { redis } from '.';

class AccessKeyCache_ {
  private rateLimitResetInterval: NodeJS.Timeout;

  async setAccessKeyDetails(
    accessKeyDetails: AccessKeyDetails,
  ): Promise<boolean> {
    try {
      const json = JSON.stringify(accessKeyDetails);
      await redis.set(`accessKeyDetails:${accessKeyDetails.accessKey}`, json);
      return true;
    } catch (err) {
      console.error('Failed to set access key details', err);
      return false;
    }
  }

  async getAccessKeyDetails(accessKeyValue: string): Promise<AccessKeyDetails> {
    try {
      const json = await redis.get(`accessKeyDetails:${accessKeyValue}`);
      return JSON.parse(json);
    } catch (err) {
      console.error('Failed to get access key details', err);
      return null;
    }
  }

  async resetRateLimitBuckets(): Promise<void> {
    this.rateLimitResetInterval = setInterval(async () => {
      const keys = await redis.keys('rateLimit:*');
      keys.map(async (key) => {
        const runningRateLimitsJson = await redis.get(key);
        const runningRateLimits: RunningRateLimit = JSON.parse(
          runningRateLimitsJson,
        );
        const accessKeyDetailsJson = await redis.get(
          `accessKeyDetails:${runningRateLimits.accessKeyValue}`,
        );
        const accessKeyDetails = JSON.parse(
          accessKeyDetailsJson,
        ) as AccessKeyDetails;
        runningRateLimits.remainingLimit = accessKeyDetails.limitPerSecond;
        redis.set(key, JSON.stringify(runningRateLimits));
      });
    }, 60 * 1000); // hardcoded to update every minute for now
  }

  async shutdownRateLimitReset(): Promise<void> {
    clearInterval(this.rateLimitResetInterval);
  }
}

const AccessKeyCache = new AccessKeyCache_();

export { AccessKeyCache };
