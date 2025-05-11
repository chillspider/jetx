import { Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

import { defaultLanguageCode, LANGUAGE } from '../../constants';

const customProviders = [
  {
    provide: LANGUAGE,
    inject: [REQUEST],
    scope: Scope.REQUEST,
    useFactory: (req: any): Promise<string> => {
      return req?.i18nLang || defaultLanguageCode;
    },
  },
];

export default customProviders;
