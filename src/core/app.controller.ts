import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/tokens/:tokenId')
  getToken(@Param('tokenId') tokenId: string): Promise<any> {
    return this.appService.getToken(tokenId);
  }
}
