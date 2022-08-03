import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { HolidayController } from './holiday.controller';
import { HolidayProcessor } from './holiday.processor';
import { HolidayService } from './holiday.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'holiday',
    }),
    HttpModule,
  ],
  controllers: [HolidayController],
  providers: [HolidayProcessor, HolidayService],
})
export class HolidayModule {}
