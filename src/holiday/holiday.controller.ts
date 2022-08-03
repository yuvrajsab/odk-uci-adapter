import { InjectQueue } from '@nestjs/bull';
import { Body, Controller, Post } from '@nestjs/common';
import { Queue } from 'bull';

@Controller('holiday')
export class HolidayController {
  constructor(@InjectQueue('holiday') private readonly submissionQueue: Queue) {}

  @Post('submit')
  async submit(@Body() sub: any): Promise<any> {
    console.log({subBody: sub.event.data.new})
    try{
        await this.submissionQueue.add('submit', {
            data: sub.event.data.new,
          });
        return 'Successfully Submitted!!';
    }
    catch(e){
        return `Submission failed: ${e.message}`
    }
  }
}
