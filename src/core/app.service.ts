import { Injectable } from '@nestjs/common';
import { AccessKeyCache } from '../common/access-key-cache';

@Injectable()
export class AppService {
  getToken(tokenId: string): Promise<any> {
    return {
      // @ts-ignore
      tokenId,
      bitcoin: {
        usd: 64835,
        usd_market_cap: 1277989080236.3804,
        usd_24h_vol: 38146650224.13893,
        usd_24h_change: -0.3872257517061325,
        last_updated_at: 1718719199,
      },
    };
  }

  onApplicationShutdown(signal: string) {
    console.log(signal); // e.g. "SIGINT"
    if (
      signal === 'SIGINT' ||
      signal === 'SIGTERM' ||
      signal === 'SIGQUIT' ||
      signal === 'SIGHUP'
    ) {
      AccessKeyCache.shutdownRateLimitReset();
    }
  }
}
