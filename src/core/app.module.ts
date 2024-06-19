import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RateLimiterMiddleware } from '../middleware';
import { RateLimiterService } from './rate-limiter.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, RateLimiterService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimiterMiddleware).forRoutes('*');
  }
}
