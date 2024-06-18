import { Injectable } from '@nestjs/common';

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
}
