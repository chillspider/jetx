import { ClassFieldOptional, UUIDField } from '../../../../decorators';
import { VoucherMetadataDto } from '../voucher-metadata.dto';

export class UseVoucherDto {
  @UUIDField()
  orderId: string;

  @ClassFieldOptional(() => VoucherMetadataDto)
  data?: VoucherMetadataDto;
}
