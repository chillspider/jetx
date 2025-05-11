import { AutoMap } from '@automapper/classes';

import { OrderMembershipDto } from '../../membership/dtos/order-membership.dto';
import { OrderMetaData } from '../../order/dtos/order-metadata.dto';
import { OrderVoucherDto } from '../../order/dtos/order-voucher.dto';
import { OrderStatusEnum } from '../../order/enums/order-status.enum';
import { OrderTypeEnum } from '../../order/enums/order-type.enum';
import {
  PaymentMethod,
  PaymentProvider,
} from '../../payment/enums/payment-method.enum';
import { InvoiceStatusEnum } from '../../tax/enums/invoice-status.enum';

export class SyncOrderDto {
  @AutoMap()
  id: string;

  @AutoMap()
  incrementId: number;

  @AutoMap()
  customerId?: string;

  @AutoMap()
  customerName?: string;

  @AutoMap()
  customerEmail?: string;

  @AutoMap()
  customerPhone?: string;

  @AutoMap()
  note?: string;

  @AutoMap()
  subTotal?: number;

  @AutoMap()
  grandTotal: number;

  @AutoMap()
  itemQuantity: number;

  @AutoMap()
  discountAmount: number;

  @AutoMap()
  taxAmount?: number;

  @AutoMap()
  status: OrderStatusEnum;

  @AutoMap(() => [String])
  discountIds: string[];

  @AutoMap(() => [OrderVoucherDto])
  discounts?: OrderVoucherDto[];

  @AutoMap()
  paymentMethod: PaymentMethod;

  @AutoMap()
  paymentProvider: PaymentProvider;

  @AutoMap(() => OrderMetaData)
  data?: OrderMetaData;

  @AutoMap(() => OrderMembershipDto)
  membership?: OrderMembershipDto;

  @AutoMap()
  membershipAmount?: number;

  @AutoMap()
  type?: OrderTypeEnum;

  @AutoMap()
  invoiceStatus?: InvoiceStatusEnum;

  /// Link invoice
  @AutoMap()
  link?: string;

  @AutoMap()
  stationId?: string;

  @AutoMap()
  createdTime?: Date;

  @AutoMap()
  voucherName?: string;

  @AutoMap()
  packageId?: string;

  @AutoMap()
  voucherId?: string;
}
