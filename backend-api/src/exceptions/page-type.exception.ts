import { BadRequestException } from '@nestjs/common';

import { W24Error } from '../constants/error-code';

export class PageTypeException extends BadRequestException {
  constructor() {
    super(W24Error.InvalidField('Page_Type'));
  }
}
