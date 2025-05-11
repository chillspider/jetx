import { ApiProperty } from '@nestjs/swagger';

import { BooleanField, NumberField } from '../../decorators';
import { PaginationRequestDto } from './pagination-request.dto';

interface IPaginationResponseParameters {
  paginationRequest: PaginationRequestDto;
  total: number;
}

export class PaginationMetaDto {
  @NumberField()
  readonly pageIndex: number;

  @NumberField()
  readonly pageSize: number;

  @NumberField()
  readonly total: number;

  @NumberField()
  readonly pageCount: number;

  @BooleanField()
  readonly hasPreviousPage: boolean;

  @BooleanField()
  readonly hasNextPage: boolean;

  constructor({ paginationRequest, total }: IPaginationResponseParameters) {
    this.pageIndex = paginationRequest.pageIndex;
    this.pageSize = paginationRequest.pageSize;
    this.total = total;
    this.pageCount = Math.ceil(this.total / this.pageSize);
    this.hasPreviousPage = this.pageIndex > 1;
    this.hasNextPage = this.pageIndex < this.pageCount;
  }
}

export class PaginationResponseDto<T> extends PaginationMetaDto {
  @ApiProperty({ isArray: true })
  readonly data!: T[];
}
