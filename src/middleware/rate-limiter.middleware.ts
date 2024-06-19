import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AccessKeyCache } from '../common/access-key-cache';
import { RateLimiterService } from '../core';

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  constructor(private readonly rateLimiterService: RateLimiterService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const headers = req.headers;
    const apiKeyHeader = headers['x-api-key'];

    if (!apiKeyHeader) {
      throw new HttpException(
        'Missing API key header',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const accessKey = apiKeyHeader as string;

    const accessKeyDetails =
      await AccessKeyCache.getAccessKeyDetails(accessKey);

    if (!accessKeyDetails) {
      throw new HttpException('Invalid API key', HttpStatus.UNAUTHORIZED);
    }

    if (accessKeyDetails.disabled) {
      throw new HttpException('API key disabled', HttpStatus.UNAUTHORIZED);
    }

    await this.rateLimiterService.rateLimit(accessKeyDetails);

    next();
  }
}
