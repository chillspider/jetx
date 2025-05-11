import { NotFoundException } from '@nestjs/common';

import { W24Error } from '../constants/error-code';

export class ProductNotFoundException extends NotFoundException {
  constructor(error?: string) {
    super(W24Error.NotFound('Product'), error);
  }
}
