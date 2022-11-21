import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, lastValueFrom, map } from 'rxjs';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  adapterId;
  private readonly logger = new Logger(AppService.name);

  constructor(
    private prisma: PrismaService,
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.adapterId = this.configService.get<string>('UCI_ADAPTER_ID');
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
            this.logger.debug(`GQL response: ${JSON.stringify(response)}`);
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
              `Processing registerSms() SUCCESS: ${JSON.stringify(
                response.data,
              )}`,
            );
            return response.data;
          }),
          catchError((e) => {
            this.logger.error(
              `Processing registerSms() FAILURE: ${e.toString()}`,
            );
            e.response.data;
            throw new HttpException(e.response.error, e.response.status);
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
