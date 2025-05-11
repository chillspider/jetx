import { Injectable } from '@nestjs/common';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { I18nContext } from 'nestjs-i18n';
import { Attachment } from 'nodemailer/lib/mailer';

import { minutesToHours } from '../../../common/utils';
import { defaultLanguageCode } from '../../../constants';
import { ApiConfigService } from '../../../shared/services/api-config.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { TranslationService } from '../../../shared/services/translation.service';
import { EmailTemplate } from '../enums/email-template.enum';
import { IForgotPassword } from '../interfaces/forgot-password.interface';
import { ISupportConfirmation } from '../interfaces/support-confirmation.inteface';
import { IVerifyEmail } from '../interfaces/verify-email.inteface';
import { MailHelperService } from './mail-helper.service';

@Injectable()
export class MailService {
  constructor(
    private _mailerService: MailerService,
    private readonly _logger: LoggerService,
    private readonly _configService: ApiConfigService,
    private readonly _translationService: TranslationService,
    private readonly _mailHelper: MailHelperService,
  ) {}

  public async forgotPassword(payload: IForgotPassword): Promise<boolean> {
    try {
      const { email, otp, user } = payload;

      const [title, welcome, otpExpired] = this._translationService.translates([
        { key: 'common.resetPassword.title' },
        {
          key: 'common.resetPassword.welcome',
          options: { args: { user } },
        },
        {
          key: 'common.resetPassword.otpExpired',
          options: {
            args: { expired: this._configService.otpExpirationTime },
          },
        },
      ]);

      const context = {
        title,
        welcome,
        otpExpired,
        otp,
      };

      const html = await this._mailHelper.buildTemplate(
        EmailTemplate.ResetPassword,
        context,
      );

      await this._mailerService.sendMail({
        to: email,
        subject: title,
        html: html,
      });

      return true;
    } catch (err) {
      this._logger.error(err);
      return false;
    }
  }

  public async supportConfirmation(
    payload: ISupportConfirmation,
  ): Promise<boolean> {
    try {
      const { email, user, verifyEmailToken } = payload;

      const [title, welcome, content, verifyEmail, verifyEmailButton] =
        this._translationService.translates([
          { key: 'common.supportConfirmation.title' },
          {
            key: 'common.supportConfirmation.welcome',
            options: { args: { user } },
          },
          {
            key: 'common.supportConfirmation.content',
          },
          {
            key: 'common.supportConfirmation.verifyEmail',
          },
          {
            key: 'common.supportConfirmation.verifyEmailButton',
          },
        ]);

      let verifyUrl;
      if (verifyEmailToken) {
        const lang = I18nContext.current()?.lang || defaultLanguageCode;
        verifyUrl = `${this._configService.apiUrl}/api/v1/auth/email/verify?token=${verifyEmailToken}&lang=${lang}`;
      }

      const context = {
        title,
        welcome,
        content,
        verifyEmail,
        verifyEmailButton,
        verifyEmailUrl: verifyUrl,
      };

      const html = await this._mailHelper.buildTemplate(
        EmailTemplate.SupportConfirmation,
        context,
      );

      await this._mailerService.sendMail({
        to: email,
        subject: title,
        html: html,
      });

      return true;
    } catch (err) {
      this._logger.error(err);
      return false;
    }
  }

  public async verifyEmail(payload: IVerifyEmail): Promise<boolean> {
    try {
      const { email, user, token } = payload;
      const expiredTime = this._configService.emailExpirationTime;

      const [title, welcome, content, verifyButton] =
        this._translationService.translates([
          { key: 'common.emailVerification.title' },
          {
            key: 'common.emailVerification.welcome',
            options: { args: { user } },
          },
          {
            key: 'common.emailVerification.content',
            options: {
              args: { email, expiredTime: minutesToHours(expiredTime) },
            },
          },
          {
            key: 'common.verify',
          },
        ]);

      const lang = I18nContext.current()?.lang || defaultLanguageCode;
      const verifyUrl = `${this._configService.apiUrl}/api/v1/auth/email/verify?token=${token}&lang=${lang}`;

      const context = {
        title,
        welcome,
        content,
        verifyButton,
        verifyUrl,
      };

      const html = await this._mailHelper.buildTemplate(
        EmailTemplate.VerifyEmail,
        context,
      );

      await this._mailerService.sendMail({
        to: email,
        subject: title,
        html: html,
      });

      return true;
    } catch (err) {
      this._logger.error(err);
      return false;
    }
  }

  public async refundList(
    attachment: Attachment,
    emails: string[],
  ): Promise<boolean> {
    try {
      const context = {
        title: this._translationService.t('common.refund.title'),
        description: this._translationService.t('common.refund.description'),
        company: this._translationService.t('common.appName'),
      };

      const html = await this._mailHelper.buildTemplate(
        EmailTemplate.RefundList,
        context,
        false,
      );

      await this._mailerService.sendMail({
        to: emails,
        subject: this._translationService.t('common.refund.title'),
        html: html,
        attachments: [attachment],
      });

      return true;
    } catch (err) {
      this._logger.error(err);
      return false;
    }
  }

  public async sendMail(sendMailOptions: ISendMailOptions): Promise<{
    accepted: string[];
    rejected: string[];
  }> {
    try {
      const result = await this._mailerService.sendMail(sendMailOptions);
      return { accepted: result?.accepted, rejected: result?.rejected };
    } catch (err) {
      this._logger.error(err);
      return { accepted: [], rejected: [] };
    }
  }
}
