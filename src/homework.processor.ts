import { Process, Processor } from '@nestjs/bull';
import { xml2json } from "xml-js";
import { Job } from 'bull';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { examResultAnnouncementTemplate, homeworkTemplate } from './sms.templates';
import { getStudentFromId, getStudentFromUdiseAndClass } from './queries';

@Processor('homework')
export class HomeworkProcessor {
//   private readonly logger = new Logger(HolidayProcessor.name);
constructor(
  private configService: ConfigService,
  private readonly appService: AppService){}

  @Process('homeworkSubmission')
  async handleSubmit(job: Job) {
    try {
      const respObj = JSON.parse(xml2json(job.data.data.xml_string, {compact: true}));
      console.log({respObj: JSON.stringify(respObj)});
      const udise = respObj.data.school_info.udise._text;
      const classList = respObj.data.school_info.class._text;
      const ids = respObj.data.selected_students._text;
      const subject = respObj.data.subject._text;
      console.log(udise, classList, ids, subject);
      const query = getStudentFromId(ids);
      const resp = await this.appService.sendGqlRequest(query)
      if( resp['errors'] !== undefined){
        console.log({response: resp['errors'][0]['message']});
        this.appService.updateSubmissionStatus(job.data.data.id, "FAILED", resp['errors'][0]['message']);
      }else if(resp['data']['data'] !== undefined){
        this.appService.updateSubmissionStatus(job.data.data.id, "PROCESSING")
        resp.data.data.forEach(async element => {
          const payload = homeworkTemplate(element.name, subject);
          const templateId = this.configService.get<string>('HOMEWORK_TEMPLATE_ID');
          let resp = await this.appService.registerSms(element.phone, templateId, payload);
          if (resp.status === 200) {
            this.appService.insertSmsTrackEntry({type: job.data.data.type, user_id: job.data.data.user_id, phone_no: String(element.phone), instance_id: job.data.data.instance_id, created_at: job.data.data.created_at, status: resp.message || resp.error, message_id: resp.result.messageId})
          }
        });
        this.appService.updateSubmissionStatus(job.data.data.id, "DONE")
      }
    } catch (error) {
      console.log({error});
      this.appService.updateSubmissionStatus(job.data.data.id, "FAILED", error.message)
    }
    return "OK";
  }
}