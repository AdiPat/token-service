import { HttpStatus } from '@nestjs/common';

interface RequestLogItem {
  id: string;
  accessKeyValue: string;
  requestTime: Date;
  rateLimited: boolean;
  errorMessage: string;
  statusCode: HttpStatus;
}

export { RequestLogItem };
