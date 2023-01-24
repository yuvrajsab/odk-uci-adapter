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
import { TerminusModule } from '@nestjs/terminus';
import { PrismaHealthIndicator } from '../prisma/prisma.health';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { RedisHealthModule } from '@liaoliaots/nestjs-redis-health';

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
    TerminusModule,
    RedisHealthModule,
    RedisModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        return {
          readyLog: true,
          config: {
            name: 'db',
            url: `redis://${config.get('QUEUE_HOST')}:${config.get(
              'QUEUE_PORT',
            )}`,
          },
        };
      },
      inject: [ConfigService],
    }),
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
    PrismaHealthIndicator,
  ],
})
export class AppModule {}
