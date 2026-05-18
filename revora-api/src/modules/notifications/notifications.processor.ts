import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';

// BUG #25 FIX: BullMQ queues were registered in app.module.ts but no processor
// (consumer) existed anywhere — jobs were enqueued and silently discarded.

@Processor('notifications')
@Injectable()
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  // Handles queued email send jobs
  @Process('send-email')
  async handleEmail(job: Job<{ to: string; subject: string; html: string }>) {
    this.logger.log(`Sending email to ${job.data.to}: ${job.data.subject}`);
    // TODO: wire up Resend or Nodemailer
    // await this.resend.emails.send({ from: 'noreply@revora.com', ...job.data });
    this.logger.log(`Email sent to ${job.data.to}`);
  }

  // Handles queued push notification jobs
  @Process('send-push')
  async handlePush(job: Job<{ userId: string; title: string; body: string }>) {
    this.logger.log(`Sending push to userId=${job.data.userId}`);
    // TODO: wire up FCM / Expo push tokens
  }
}
