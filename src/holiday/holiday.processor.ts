import { Process, Processor } from '@nestjs/bull';
import { parseString } from "xml2js";
import { Job } from 'bull';
import { Post } from '@nestjs/common';
import { parse } from 'path';
import { HolidayService } from './holiday.service';

@Processor('holiday')
export class HolidayProcessor {
//   private readonly logger = new Logger(HolidayProcessor.name);
constructor(private readonly holidayService: HolidayService){}

  @Process('submit')
  handleSubmit(job: Job) {
    console.log('Start transcoding...');
    console.log({ex: job.data.data.xml_string});
    console.log('Transcoding completed');
    let dummyBody;
    parseString(job.data.data.xml_string, function (err, results) {
      console.log({results: results.data})
        // let data = JSON.stringify(results['h:html']['h:head'][0]['model'][0]['instance'][0]['data'][0]);
        console.log({results: results.data['holiday_date'][0]['phone'][0]});
        // add api for UCI
        dummyBody = {
          "adapterId": "64036edb-e763-44b1-99b8-37b6c7b292c5",
          "to": {
              "userID": results.data['holiday_date'][0]['phone'][0],
              "deviceType": "PHONE"
          },
          "payload": {
              "text": "Kindly note your OTP @123@. Submission of the OTP will be taken as authentication that you have personally verified and overseen the distribution of smartphone to the mentioned student ID of your school. Thank you! - Samagra Shiksha, Himachal Pradesh"
          }
      }
    });
    console.log({dummyBody})
    console.log('Sending')
    // const res = 
    console.log('Done')
    return this.holidayService.registerSms(dummyBody);
  }
}