import { Process, Processor } from '@nestjs/bull';
import { xml2json } from "xml-js";
import { Job } from 'bull';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { examAnnouncementTemplate } from './sms.templates';
import { getStudentFromUdiseAndClass } from './queries';

@Processor('examAnnouncement')
export class ExamAnnouncementProcessor {
//   private readonly logger = new Logger(HolidayProcessor.name);
constructor(
  private configService: ConfigService,
  private readonly appService: AppService){}

  @Process('examAnnouncementSubmission')
  async handleSubmit(job: Job) {
    const respObj = JSON.parse(xml2json(job.data.data.xml_string, {compact: true}));
    console.log({respObj: JSON.stringify(respObj)});
    const udise = respObj.data.exam_date.udise._text;
    const classList = respObj.data.exam_date.class._text;
    const assessment = respObj.data.exam_date.assessment._text;
    const start_date = respObj.data.formatted_start_date._text;
    const end_date = respObj.data.formatted_end_date._text;
    console.log(udise, classList, assessment, start_date, end_date);
    const query = getStudentFromUdiseAndClass(udise, classList);
    const resp = await this.appService.sendGqlRequest(query)
    if( resp['errors'] !== undefined){
      console.log({response: resp['errors'][0]['message']});
      this.appService.updateSubmissionStatus(job.data.data.id, "FAILED", resp['errors'][0]['message']);
    }else if(resp['data']['data'] !== undefined){
      this.appService.updateSubmissionStatus(job.data.data.id, "PROCESSING")
      resp.data.data.forEach(async element => {
        const payload = examAnnouncementTemplate(assessment, start_date, end_date, element.name);
        const templateId = this.configService.get<string>('EXAM_ANNOUNCEMENT_TEMPLATE_ID');
        let resp = await this.appService.registerSms(element.phone, templateId, payload);
        console.log({resp: resp});
        if (resp.status === 200) {
          this.appService.updateSubmissionStatus(job.data.data.id, "SENT")
          this.appService.insertSmsTrackEntry({type: job.data.data.type, user_id: job.data.data.user_id, instance_id: job.data.data.instance_id, created_at: job.data.data.created_at, status: resp.message || resp.error, messageId: resp.result.messageId})
        }
      });
    }
    return "OK";
  }
}