import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { HolidayProcessor } from './holiday.processor';
import { MeetingProcessor } from './meeting.processor';
import { ExamAnnouncementProcessor } from './examAnnouncement.processor';
import { ExamResultAnnouncementProcessor } from './examResultAnnouncement.processor';
import { AnnouncementProcessor } from './announcement.processor';
import { HomeworkProcessor } from './homework.processor';
import { PrismaHealthIndicator } from '../prisma/prisma.health';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { RedisHealthModule } from '@liaoliaots/nestjs-redis-health';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { BullModule } from '@nestjs/bull';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
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
      imports: [
        HttpModule,
        ConfigModule,
        TerminusModule,
        RedisModule.forRootAsync({
          imports: [ConfigModule],
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
        RedisHealthModule,
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
          {
            name: 'slr',
          },
        ),
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('services should be defined"', () => {
      expect(appController).toBeDefined();
    });
  });
});
