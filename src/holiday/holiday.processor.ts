import { Process, Processor } from '@nestjs/bull';
import { parseString } from "xml2js";
import { Job } from 'bull';
import { Post } from '@nestjs/common';
import { parse } from 'path';

@Processor('holiday')
export class HolidayProcessor {
//   private readonly logger = new Logger(HolidayProcessor.name);

  @Process('submit')
  handleSubmit(job: Job) {
    console.log('Start transcoding...');
    console.log({ex: job.data.data.xml_string});
    console.log('Transcoding completed');
    parseString(job.data.data.xml_string, function (err, results) {
        let data = JSON.stringify(results['h:html']['h:head'][0]['model'][0]['instance'][0]['data'][0]);
        console.log({results: data});
        // add api for UCI
    });
  }
}