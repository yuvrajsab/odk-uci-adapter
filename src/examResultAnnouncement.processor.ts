import { Process, Processor } from '@nestjs/bull';
import { xml2json } from 'xml-js';
import { Job } from 'bull';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { examResultAnnouncementTemplate } from './sms.templates';
import { getStudentFromUdiseAndClass } from './queries';
import { ExamAnnouncementProcessor } from './examAnnouncement.processor';
import { Logger } from '@nestjs/common';

@Processor('examResultAnnouncement')
export class ExamResultAnnouncementProcessor {
  private readonly logger = new Logger(ExamAnnouncementProcessor.name);
  constructor(
    private configService: ConfigService,
    private readonly appService: AppService,
  ) {}

  @Process('examResultAnnouncementSubmission')
  async handleSubmit(job: Job) {
    this.logger.debug(`Processing id: ${job.data.data.id}...`);
    try {
      const respObj = JSON.parse(
        xml2json(job.data.data.xml_string, { compact: true }),
      );
      this.logger.debug(
        `id: ${job.data.data.id}: xml2json: ${JSON.stringify(respObj)}`,
      );
      const udise = respObj.data.exam_date.udise._text;
      const classList = respObj.data.exam_date.class._text;
      const assessment = respObj.data.exam_date.assessment._text;
      const result_date = respObj.data.formatted_results_date._text;
      console.log(udise, classList, assessment, result_date);
      const query = getStudentFromUdiseAndClass(udise, classList);
      const resp = await this.appService.sendGqlRequest(query);
      if (resp['errors'] !== undefined) {
        console.log({ response: resp['errors'][0]['message'] });
        await this.appService.updateSubmissionStatus(
          job.data.data.id,
          'FAILED',
          resp['errors'][0]['message'],
        );
      } else if (resp['data']['data'] !== undefined) {
        await this.appService.updateSubmissionStatus(
          job.data.data.id,
          'PROCESSING',
        );
        this.logger.debug(`id: ${job.data.data.id}: PROCESSING...`);
        for (const element of resp.data.data) {
          const payload = examResultAnnouncementTemplate(
            assessment,
            result_date,
            element.name,
          );
          const templateId = this.configService.get<string>(
            'EXAM_RESULT_ANNOUNCEMENT_TEMPLATE_ID',
          );
          const resp = await this.appService.registerSms(
            element.phone,
            templateId,
            payload,
          );
          if (resp.status === 200) {
            await this.appService.insertSmsTrackEntry({
              type: job.data.data.type,
              user_id: job.data.data.user_id,
              phone_no: String(element.phone),
              instance_id: job.data.data.instance_id,
              created_at: job.data.data.created_at,
              status: resp.message || resp.error,
              message_id: resp.result.messageId,
            });
          }
        }
        await this.appService.updateSubmissionStatus(job.data.data.id, 'DONE');
      }
    } catch (error) {
      this.logger.error(`id: ${job.data.data.id}: ERROR:`, error);
      await this.appService.updateSubmissionStatus(
        job.data.data.id,
        'FAILED',
        error.message,
      );
    }
    return 'OK';
  }
}
