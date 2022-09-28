import { Process, Processor } from '@nestjs/bull';
import { xml2json } from "xml-js";
import { Job } from 'bull';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { meetingTemplate } from './sms.templates';
import { getStudentFromUdiseAndClass } from './queries';

@Processor('meeting')
export class MeetingProcessor {
//   private readonly logger = new Logger(HolidayProcessor.name);
constructor(
  private configService: ConfigService,
  private readonly appService: AppService){}

  @Process('meetingSubmission')
  async handleSubmit(job: Job) {
    const respObj = JSON.parse(xml2json(job.data.data.xml_string, {compact: true}));
    const udise = respObj.data.Meetings.udise._text;
    const classList = respObj.data.Meetings.class._text;
    const meeting_date = respObj.data.formatted_meeting_date._text;
    const meeting = respObj.data.Meetings.meeting._text;
    console.log(udise, classList, meeting_date, meeting);
    const query = getStudentFromUdiseAndClass(udise, classList);
    const resp = await this.appService.sendGqlRequest(query)
    if( resp['errors'] !== undefined){
      console.log({response: resp['errors'][0]['message']});
      this.appService.updateSubmissionStatus(job.data.data.id, "FAILED", resp['errors'][0]['message']);
    }else if(resp['data']['data'] !== undefined){
      this.appService.updateSubmissionStatus(job.data.data.id, "PROCESSED")
      resp.data.data.forEach(async element => {
        const payload = meetingTemplate(meeting_date, meeting);
        const templateId = this.configService.get<string>('MEETING_TEMPLATE_ID');
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