import { Injectable } from '@nestjs/common';
import { isArray, isString, map } from 'lodash';
import type { TranslateOptions } from 'nestjs-i18n';
import { I18nContext, I18nService } from 'nestjs-i18n';

import { AbstractDto } from '../../common/dto/abstract.dto';
import { getLanguageCode } from '../../common/utils';
import { defaultLanguageCode } from '../../constants';
import { STATIC_TRANSLATION_DECORATOR_KEY } from '../../decorators';
import type { ITranslationDecoratorInterface } from '../../interfaces';

type TranslationData = {
  key: string;
  options?: TranslateOptions;
};

@Injectable()
export class TranslationService {
  constructor(private readonly i18n: I18nService) {}

  public t(key: string, options?: TranslateOptions): string {
    return this.translate(key, options);
  }

  public translate(key: string, options?: TranslateOptions): string {
    try {
      const lang = I18nContext.current()?.lang || defaultLanguageCode;
      const langCode = getLanguageCode(options?.lang || lang);

      return this.i18n.translate(key, { ...options, lang: langCode });
    } catch (error) {
      return key;
    }
  }

  public translates(data: TranslationData[], lang?: string): string[] {
    return data.map((d) =>
      this.translate(d.key, {
        lang,
        ...d.options,
      }),
    );
  }

  async translateNecessaryKeys<T extends AbstractDto>(dto: T): Promise<T> {
    await Promise.all(
      map(dto, async (value, key) => {
        if (isString(value)) {
          const translateDec: ITranslationDecoratorInterface | undefined =
            Reflect.getMetadata(STATIC_TRANSLATION_DECORATOR_KEY, dto, key);

          if (translateDec) {
            return this.translate(
              `${translateDec.translationKey ?? key}.${value}`,
            );
          }

          return;
        }

        if (value instanceof AbstractDto) {
          return this.translateNecessaryKeys(value);
        }

        if (isArray(value)) {
          return Promise.all(
            map(value, (v) => {
              if (v instanceof AbstractDto) {
                return this.translateNecessaryKeys(v);
              }

              return null;
            }),
          );
        }
        return null;
      }),
    );

    return dto;
  }
}
