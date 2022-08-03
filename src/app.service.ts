import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome!! Use POST `:formName/submit` for trigger events.';
  }
}
