import { InjectQueue } from '@nestjs/bull';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { Queue } from 'bull';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { PrismaHealthIndicator } from '../prisma/prisma.health';
import { RedisHealthIndicator } from '@liaoliaots/nestjs-redis-health';
import Redis from 'ioredis';
import { InjectRedis } from '@liaoliaots/nestjs-redis';

@Controller()
export class AppController {
  constructor(
    private healthCheckService: HealthCheckService,
    private http: HttpHealthIndicator,
    private prismaIndicator: PrismaHealthIndicator,
    private redisIndicator: RedisHealthIndicator,
    @InjectRedis() private readonly redis: Redis,
    private configService: ConfigService,
    @InjectQueue('holiday') private readonly holidaySubmissionQueue: Queue,
    @InjectQueue('meeting') private readonly meetingSubmissionQueue: Queue,
    @InjectQueue('examAnnouncement')
    private readonly examAnnouncementSubmissionQueue: Queue,
    @InjectQueue('examResultAnnouncement')
    private readonly examResultAnnouncementSubmissionQueue: Queue,
    @InjectQueue('announcement')
    private readonly announcementSubmissionQueue: Queue,
    @InjectQueue('homework') private readonly homeworkSubmissionQueue: Queue,
  ) {}

  @Post('submit')
  async submit(@Body() sub: any): Promise<any> {
    if (sub.event.data.new.type.toUpperCase() === 'HOLIDAY') {
      try {
        await this.holidaySubmissionQueue.add('holidaySubmission', {
          data: sub.event.data.new,
        });
        return 'Successfully Submitted Holiday Form!!';
      } catch (e) {
        return `Submission failed for Holiday Form: ${e.message}`;
      }
    } else if (sub.event.data.new.type.toUpperCase() === 'MEETING') {
      try {
        await this.meetingSubmissionQueue.add('meetingSubmission', {
          data: sub.event.data.new,
        });
        return 'Successfully Submitted Meeting Form!!';
      } catch (e) {
        return `Submission failed for Meeting Form: ${e.message}`;
      }
    } else if (sub.event.data.new.type.toUpperCase() === 'EXAM_ANNOUNCEMENT') {
      try {
        await this.examAnnouncementSubmissionQueue.add(
          'examAnnouncementSubmission',
          {
            data: sub.event.data.new,
          },
        );
        return 'Successfully Submitted ExamAnnouncement Form!!';
      } catch (e) {
        return `Submission failed for ExamAnnouncement Form: ${e.message}`;
      }
    } else if (
      sub.event.data.new.type.toUpperCase() === 'EXAM_RESULT_ANNOUNCEMENT'
    ) {
      try {
        await this.examResultAnnouncementSubmissionQueue.add(
          'examResultAnnouncementSubmission',
          {
            data: sub.event.data.new,
          },
        );
        return 'Successfully Submitted ExamResultAnnouncement Form!!';
      } catch (e) {
        return `Submission failed for ExamResultAnnouncement Form: ${e.message}`;
      }
    } else if (sub.event.data.new.type.toUpperCase() === 'ANNOUNCEMENT') {
      try {
        await this.announcementSubmissionQueue.add('announcementSubmission', {
          data: sub.event.data.new,
        });
        return 'Successfully Submitted Announcement Form!!';
      } catch (e) {
        return `Submission failed for Announcement Form: ${e.message}`;
      }
    } else if (sub.event.data.new.type.toUpperCase() === 'HOMEWORK') {
      try {
        await this.homeworkSubmissionQueue.add('homeworkSubmission', {
          data: sub.event.data.new,
        });
        return 'Successfully Submitted Announcement Form!!';
      } catch (e) {
        return `Submission failed for Announcement Form: ${e.message}`;
      }
    }
  }

  @Get('/health')
  @HealthCheck()
  async checkHealth() {
    return this.healthCheckService.check([
      async () =>
        this.http.pingCheck(
          'Hasura (Samarth)',
          this.configService.get('GQL_HOST'),
        ),
      async () =>
        this.http.pingCheck(
          'Hasura (Self)',
          this.configService.get('HASURA_HOST'),
        ),
      async () =>
        this.http.pingCheck(
          'Basic Check',
          `http://localhost:${this.configService.get('PORT')}`,
        ),
      async () =>
        this.redisIndicator.checkHealth('Redis', {
          type: 'redis',
          client: this.redis,
          timeout: 500,
        }),
      async () => this.prismaIndicator.isHealthy('Db'),
    ]);
  }

  @Get()
  getMessage(): any {
    return 'ODK-UCI Queue Service is running';
  }
}
