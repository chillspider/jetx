import { Global, Module } from '@nestjs/common';
import { MailerModule, MailerOptions } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import * as path from 'path';

import { ApiConfigService } from '../../shared/services/api-config.service';
import { SharedModule } from '../../shared/shared.module';
import { MailService } from './services/mail.service';
import { MailHelperService } from './services/mail-helper.service';

@Global()
@Module({
  providers: [MailService, MailHelperService],
  imports: [
    SharedModule,
    MailerModule.forRootAsync({
      inject: [ApiConfigService],
      useFactory: async (configService: ApiConfigService) =>
        ({
          transport: {
            host: configService.smtpConfig.host,
            port: configService.smtpConfig.port,
            secure: configService.smtpConfig.enableSSL,
            auth: {
              user: configService.smtpConfig.username,
              pass: configService.smtpConfig.password,
            },
          },
          defaults: {
            from: `${configService.smtpConfig.senderName} <${configService.smtpConfig.fromAddress}>`,
            sender: configService.smtpConfig.fromAddress,
          },
          template: {
            path: path.join(__dirname, '/templates/mails'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        }) as MailerOptions,
    }),
  ],
  exports: [MailService, MailHelperService],
})
export class MailModule {}
