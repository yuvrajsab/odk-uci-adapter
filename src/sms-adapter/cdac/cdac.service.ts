import { HttpException, Injectable, Logger } from '@nestjs/common';
import { SmsAdapterInterface } from '../sms-adapter.interface';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { catchError, lastValueFrom, map } from 'rxjs';

@Injectable()
export class CdacService implements SmsAdapterInterface {
  private readonly cdacServiceUrl;
  protected readonly logger = new Logger(CdacService.name); // logger instance
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.logger.log(`${CdacService.name} initialized..`);
    this.cdacServiceUrl = configService.get<string>('CDAC_SERVICE_URL');
  }

  async sendSms(phone: string, templateId: string, payload: string) {
    this.logger.debug(
      `Processing registerSms() callback: ${JSON.stringify([
        phone,
        templateId,
        payload,
      ])}`,
    );
    const params = new URLSearchParams({
      message: payload,
      mobileNumber: phone,
      templateid: templateId,
    });
    const url = `${
      this.cdacServiceUrl
    }/api/send_single_unicode_sms?${params.toString()}`;
    return await lastValueFrom(
      this.httpService.get(url).pipe(
        map((response: any) => {
          let messageId = response.data.toString();
          const statusCode = messageId.substring(0, 3) || '0';
          if (statusCode != '402') {
            throw new HttpException(
              { error: `CDAC Error: ${messageId}`, data: {} },
              statusCode,
            ); // or else throw exception
          }
          messageId = messageId.slice(12, -1);
          const resp = {
            timestamp: new Date(),
            status: 200,
            error: null,
            message: response.data.toString(),
            path: '/api/send_single_unicode_sms',
            result: {
              messageId: messageId,
            },
          };
          this.logger.debug(
            `Processed registerSms() SUCCESS: ${JSON.stringify(resp)}`,
          );
          return resp;
        }),
        catchError((e) => {
          console.log(e.response);
          this.logger.error(
            `Processing registerSms() FAILURE: ${JSON.stringify(
              e.response.data,
            )}`,
          );
          throw new HttpException(e.response.error, e?.response?.status || 500); // or else throw exception
        }),
      ),
    );
  }
}
