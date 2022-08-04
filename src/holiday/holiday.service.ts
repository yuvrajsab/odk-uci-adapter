import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable()
export class HolidayService {
    constructor(
        private readonly httpService: HttpService,
        private configService: ConfigService,
        ){}
        
    async registerSms(data: any): Promise<any> {
        console.log({data})
        let resp = this.httpService.post(`${this.configService.get<string>('UCI_URL')}/message/send`, data).pipe(map((response: any) =>{ response.data; }), catchError(e => { throw new HttpException(e.response.data, e.response.status);})).subscribe();
        return resp;
    }
}
