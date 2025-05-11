import { BadRequestException } from '@nestjs/common';

import { W24Error } from '../constants/error-code';

export class FileNotImageException extends BadRequestException {
  constructor(error?: string) {
    super(W24Error.InvalidField('Image'), error);
  }
}
