import { ApiProperty } from '@nestjs/swagger';

import { BooleanField, StringField } from '../../decorators';

export class ResponseDto<T> {
  @ApiProperty()
  readonly data: T;

  @BooleanField()
  readonly isSuccess: boolean;

  @StringField({ each: true })
  readonly errors: string[];

  constructor(data: T, isSuccess = true, errors: string[] = []) {
    this.data = data;
    this.isSuccess = isSuccess;
    this.errors = errors;
  }
}
