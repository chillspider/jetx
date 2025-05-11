import { NotFoundException } from '@nestjs/common';

import { W24Error } from '../constants/error-code';

export class VoucherNotFoundException extends NotFoundException {
  constructor(error?: string) {
    super(W24Error.NotFound('Voucher'), error);
  }
}
