import { IsBoolean, IsOptional } from 'class-validator';

export class AddVoucherValidityRequestDto {
  @IsBoolean()
  @IsOptional()
  checkValidity?: boolean;
}
