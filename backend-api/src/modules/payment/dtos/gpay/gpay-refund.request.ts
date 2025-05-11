import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class GPayRefundExtraDataRequest {
  @IsString()
  @ApiProperty()
  transactionID: string;

  @IsString()
  @ApiProperty()
  orderCurrency: string;

  @IsNumber()
  @ApiProperty()
  orderAmount: number;

  @IsString()
  @ApiProperty()
  orderID: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  orderDateTime?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  orderDescription?: string;
}

export class GPayRefundRequest {
  @IsString()
  @ApiProperty()
  requestID: string;

  @IsString()
  @ApiProperty()
  requestDateTime: string;

  @IsObject()
  @ApiProperty()
  requestData: GPayRefundExtraDataRequest;
}
