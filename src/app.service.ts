import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, lastValueFrom, map } from 'rxjs';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  adapterId;
  constructor(
    private prisma: PrismaService,
    private readonly httpService: HttpService,
    private configService: ConfigService,
    ){
      this.adapterId = this.configService.get<string>('UCI_ADAPTER_ID');
    }

async sendGqlRequest(query: string): Promise<any> {
    const headers: Record<string, string | number | boolean> = this.configService.get<Record<string, string | number | boolean>>('GQL_HEADERS');
    let resp = await lastValueFrom(this.httpService.post(this.configService.get<string>('GQL_URL'), {query}, { headers: JSON.parse(headers.toString()) }).pipe(map((response: any) =>{ return response.data }), catchError(async (e) => { throw new HttpException(e.response.data, e.response.status);})));
    return resp
}

async registerSms(phone: string, templateId: string, payload: string): Promise<any> {
  const data = {
    "adapterId": this.adapterId,
    "to": {
        "userID": phone,
        "deviceType": "PHONE",
        "meta": {
          "templateId": templateId,
      }
    },
    "payload": {
        "text": payload
    }
}
    let resp = await lastValueFrom(this.httpService.post(`${this.configService.get<string>('UCI_URL')}/message/send`, data).pipe(map((response: any) =>{ return response.data; }), catchError(e => { console.log({e}); throw new HttpException(e.response.data, e.response.status);})));
    return resp;
}

async updateSubmissionStatus(id, status, remarks=""): Promise<any> {
  return this.prisma.submission.updateMany({
    where: { id: id },
    data: { status: status, remarks: remarks}
  });
}

async insertSmsTrackEntry(data: {
  type: string
  user_id: string
  instance_id: string
  created_at?: Date | string
  status: string
  messageId: string
}): Promise<any> {
  return this.prisma.sms_track.create({
    data: data
  });
}

  getHello(): string {
    return 'Welcome!! Use POST `:formName/submit` for trigger events.';
  }
}
