import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';

export class GPayQueryExtraDataRequest {
  @IsString()
  @ApiProperty()
  transactionID: string;
}

export class GPayQueryRequest<T> {
  @IsString()
  @ApiProperty()
  requestID: string;

  @IsString()
  @ApiProperty()
  requestDateTime: string;

  @IsObject()
  @ApiProperty()
  requestData: T;
}
