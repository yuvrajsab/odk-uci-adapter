import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AnnouncementProcessor } from './announcement.processor';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExamAnnouncementProcessor } from './examAnnouncement.processor';
import { ExamResultAnnouncementProcessor } from './examResultAnnouncement.processor';
import { HolidayProcessor } from './holiday.processor';
import { HomeworkProcessor } from './homework.processor';
import { MeetingProcessor } from './meeting.processor';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('QUEUE_HOST'),
          port: configService.get('QUEUE_PORT'),
        },
        limiter: {
          max: 2, // we'll process max X request per second; because CDA has issues
          duration: 1000,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: 'holiday',
      },
      {
        name: 'meeting',
      },
      {
        name: 'examAnnouncement',
      },
      {
        name: 'examResultAnnouncement',
      },
      {
        name: 'announcement',
      },
      {
        name: 'homework',
      },
    ),
    HttpModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    HolidayProcessor,
    MeetingProcessor,
    ExamAnnouncementProcessor,
    ExamResultAnnouncementProcessor,
    AnnouncementProcessor,
    HomeworkProcessor,
  ],
})
export class AppModule {}
