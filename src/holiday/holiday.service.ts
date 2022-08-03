import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class HolidayService {
    constructor(
        private readonly httpService: HttpService,
        private configService: ConfigService,
        ){}
        
    async registerSms(data: any): Promise<any> {
        return this.httpService.post(`${this.configService.get<string>('UCI_URL')}`, data).pipe(map((response: any) =>{ return response.data; })).pipe(catchError(e => { throw new HttpException(e.response.data, e.response.status);}));
    }
}
