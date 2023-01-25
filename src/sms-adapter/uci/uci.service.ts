import { HttpException, Injectable, Logger } from '@nestjs/common';
import { SmsAdapterInterface } from '../sms-adapter.interface';
import { ConfigService } from '@nestjs/config';
import { catchError, lastValueFrom, map } from 'rxjs';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class UciService implements SmsAdapterInterface {
  private readonly adapterId: string;
  private readonly UCI_500_ALLOWED: boolean;
  protected readonly logger = new Logger(UciService.name); // logger instance

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.logger.log(`${UciService.name} initialized..`);

    // initializing env variables in use
    this.adapterId = configService.get<string>('UCI_ADAPTER_ID');
    this.UCI_500_ALLOWED =
      configService.get<string>('UCI_500_ALLOWED', 'false') == 'true';
  }

  async sendSms(phone: string, templateId: string, payload: string) {
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
              `Processing registerSms() FAILURE: ${JSON.stringify(
                e.response.data,
              )}`,
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
}
