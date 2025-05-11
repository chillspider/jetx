import { NotFoundException } from '@nestjs/common';

import { W24Error } from '../constants/error-code';

export class CategoryNotFoundException extends NotFoundException {
  constructor(error?: string) {
    super(W24Error.NotFound('Category'), error);
  }
}
