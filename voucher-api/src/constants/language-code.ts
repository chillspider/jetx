export enum LanguageCode {
  en = 'en',
  vi = 'vi',
}

export const supportedLanguageCount = Object.values(LanguageCode).length;

export const defaultLanguageCode = LanguageCode.vi;
