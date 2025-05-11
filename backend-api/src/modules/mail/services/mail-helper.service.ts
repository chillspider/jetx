import fs from 'node:fs/promises';

import { Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';
import * as path from 'path';

import { EMAIL_TEMPLATE_PATH } from '../../../constants/config';
import { TranslationService } from '../../../shared/services/translation.service';
import { EMAIL_TEMPLATE_PATHS } from '../constants/email-templates.constant';
import { EmailTemplate } from '../enums/email-template.enum';

@Injectable()
export class MailHelperService {
  constructor(private readonly _translationService: TranslationService) {}

  public async buildTemplate<T>(
    template: EmailTemplate,
    context: T,
    useLayout = true,
  ): Promise<string> {
    try {
      const templatePath = this._getPathTemplate(template);
      const file = await this._getFileContent(templatePath);

      const html = Handlebars.compile(file, {
        strict: true,
      })(context);

      if (!useLayout) return html;

      return await this._buildLayoutTemplate(html);
    } catch (error) {
      return '';
    }
  }

  private async _buildLayoutTemplate(content: string): Promise<string> {
    try {
      const layoutPath = path.join(
        EMAIL_TEMPLATE_PATH,
        EMAIL_TEMPLATE_PATHS.LAYOUT,
      );
      const file = await this._getFileContent(layoutPath);

      const [
        appName,
        contactDescription,
        or,
        phone,
        email,
        address,
        copyright,
      ] = this._translationService.translates([
        { key: 'common.appName' },
        { key: 'common.contactDescription' },
        { key: 'common.or' },
        { key: 'common.phone' },
        { key: 'common.email' },
        { key: 'common.address' },
        { key: 'common.copyright' },
      ]);

      const context = {
        content,
        appName,
        contactDescription,
        or,
        phone,
        email,
        address,
        copyright,
      };

      return Handlebars.compile(file, {
        strict: true,
      })(context);
    } catch (error) {
      return content;
    }
  }

  private async _getFileContent(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }

  private _getPathTemplate(template: EmailTemplate): string {
    const templatePath = template + '.hbs';
    return path.join(EMAIL_TEMPLATE_PATH, templatePath);
  }
}
