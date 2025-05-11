import 'reflect-metadata';

import { Translation } from '../../common/entities/translation.entity';
import { defaultLanguageCode } from '../../constants';
import { LOCALIZED_PROPERTIES_KEY } from '../../decorators/localizable.decorator';

export interface ILocalizableObject {
  translations?: Record<string, Translation>;
  [key: string]: any; // Add index signature
}

export class LocalizeService<T extends ILocalizableObject> {
  public localize(data: T, language: string): T {
    if (language === defaultLanguageCode) {
      data.translations = null;
      return data;
    }

    if (!data?.translations) {
      return data;
    }

    const translate = data.translations[language] || null;

    if (!translate) {
      return data;
    }

    for (const property in translate) {
      (data as any)[property] = translate[property] || data[property];
    }

    return data;
  }

  public localizeArray(data: T[], language: string): T[] {
    if (language === defaultLanguageCode) {
      return data.map((item) => {
        item.translations = null;
        return item;
      });
    }

    return data.map((item) => this.localize(item, language));
  }

  public getLocalizableProperties(entity: unknown): string[] {
    if (Reflect.hasMetadata(LOCALIZED_PROPERTIES_KEY, entity)) {
      return Reflect.getMetadata(LOCALIZED_PROPERTIES_KEY, entity) as string[];
    }
    return [];
  }

  public extractLocaleValues(entity: T): Record<string, any> {
    const localizableProperties = this.getLocalizableProperties(entity);
    if (localizableProperties.length === 0) {
      return {};
    }

    const record: Record<string, any> = {};
    for (const prop of localizableProperties) {
      record[prop] = entity[prop];
    }

    return record;
  }

  public addTranslations(entity: T, language: string): T {
    const record = this.extractLocaleValues(entity);
    if (language === defaultLanguageCode || Object.keys(record).length === 0) {
      entity.translations = {};
      return entity;
    }

    const translations: Record<string, any> = {};
    translations[language] = record;

    entity.translations = translations;

    return entity;
  }

  public updateTranslations(entity: T, updatedEntity: T, language: string): T {
    const localizableProperties = this.getLocalizableProperties(entity);
    const record = this.extractLocaleValues(updatedEntity);

    if (language === defaultLanguageCode || Object.keys(record).length === 0) {
      return { ...entity, ...updatedEntity };
    }

    const result: T = { ...entity, ...record };
    if (!result.translations) {
      result.translations = {};
    }
    result.translations[language] = record;

    for (const prop of localizableProperties) {
      (result as any)[prop] = entity[prop];
    }

    return result;
  }

  public excludeLocalizeProps(entity: T, language: string): Partial<T> {
    const localizableProperties = this.getLocalizableProperties(entity);
    if (
      language === defaultLanguageCode ||
      localizableProperties.length === 0
    ) {
      return entity;
    }

    for (const prop of localizableProperties) {
      delete entity[prop];
    }

    return entity;
  }
}
