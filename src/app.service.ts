import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, lastValueFrom, map } from 'rxjs';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  adapterId;
  private UCI_500_ALLOWED: boolean;
  private readonly logger = new Logger(AppService.name);

  constructor(
    private prisma: PrismaService,
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.adapterId = this.configService.get<string>('UCI_ADAPTER_ID');
    this.UCI_500_ALLOWED =
      this.configService.get<string>('UCI_500_ALLOWED', 'false') == 'true';
  }

  async sendGqlRequest(query: string): Promise<any> {
    const headers: Record<string, string | number | boolean> =
      this.configService.get<Record<string, string | number | boolean>>(
        'GQL_HEADERS',
      );
    this.logger.debug(`Sending GQL request for query: ${query}...`);
    return await lastValueFrom(
      this.httpService
        .post(
          this.configService.get<string>('GQL_URL'),
          { query },
          { headers: JSON.parse(headers.toString()) },
        )
        .pipe(
          map((response: any) => {
            this.logger.debug(`GQL response:`, response.data);
            return response.data;
          }),
          catchError(async (e) => {
            this.logger.error(`GQL error: ${e.toString()}`);
            throw new HttpException(e.response.data, e.response.status);
          }),
        ),
    );
  }

  async registerSms(
    phone: string,
    templateId: string,
    payload: string,
  ): Promise<any> {
    this.logger.debug(
      `Processing registerSms() callback: ${JSON.stringify([
        phone,
        templateId,
        payload,
      ])}`,
    );
    const data = {
      adapterId: this.adapterId,
      to: {
        userID: phone,
        deviceType: 'PHONE',
        meta: {
          templateId: templateId,
        },
      },
      payload: {
        text: payload,
      },
    };
    return await lastValueFrom(
      this.httpService
        .post(`${this.configService.get<string>('UCI_URL')}/message/send`, data)
        .pipe(
          map((response: any) => {
            this.logger.debug(
              `Processed registerSms() SUCCESS: ${JSON.stringify(
                response.data,
              )}`,
            );
            return response.data;
          }),
          catchError((e) => {
            this.logger.error(
              `Processing registerSms() FAILURE: ${e.toString()}`,
            );
            if (this.UCI_500_ALLOWED && e.response.status == 500) {
              // simply just resolve the promise as success even in case of 500s
              return new Promise((resolve) => {
                resolve(e.response.data);
              });
            }
            throw new HttpException(e.response.error, e.response.status); // or else throw exception
          }),
        ),
    );
  }

  async updateSubmissionStatus(id, status, remarks = ''): Promise<any> {
    this.logger.debug(
      `id: ${id}: updateSubmissionStatus() callback: ${JSON.stringify([
        id,
        status,
        remarks,
      ])}`,
    );
    return this.prisma.submission.updateMany({
      where: { id: id },
      data: { status: status, remarks: remarks },
    });
  }

  async insertSmsTrackEntry(data: {
    type: string;
    user_id: string;
    phone_no: string;
    instance_id: string;
    created_at?: Date | string;
    status: string;
    message_id: string;
  }): Promise<any> {
    this.logger.debug(
      `Processing insertSmsTrackEntry() callback: ${JSON.stringify(data)}`,
    );
    return this.prisma.sms_track.create({
      data: data,
    });
  }

  getHello(): string {
    return 'Welcome!! Use POST `:formName/submit` for trigger events.';
  }
}
