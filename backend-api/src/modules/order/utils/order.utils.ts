import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

import { getUtcNow } from '../../../common/utils';
import { IW24Error, W24Error } from '../../../constants/error-code';
import { NotificationDeepLink } from '../../notification/enums/notification-deep-link.enum';
import { PaymentMethod } from '../../payment/enums/payment-method.enum';
import { ProductTypeEnum } from '../../product/enums/products.enum';
import { WashMode } from '../../yigoli/enums/wash-mode.enum';
import { OrderVoucherDto } from '../dtos/order-voucher.dto';
import { VoucherDto } from '../dtos/voucher.dto';
import { OrderEntity } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';
import { OrderStatusEnum } from '../enums/order-status.enum';
import { OrderTypeEnum } from '../enums/order-type.enum';
import {
  VoucherProfileApplicationEnum,
  VoucherStatusEnum,
  VoucherTypeEnum,
} from '../enums/vouchers.enum';

dayjs.extend(isBetween);

export class OrderUtils {
  static getWashMode(mode: string): WashMode {
    const modes = Object.values(WashMode).filter((e) => typeof e === 'number');
    const washMode = modes.find((e) => e === +mode);
    return washMode;
  }

  static validateVoucher(
    userId: string,
    voucher: VoucherDto,
    item: OrderItemEntity,
  ): {
    result: boolean;
    error?: IW24Error;
  } {
    // Check voucher owner
    if (voucher.userId !== userId) {
      return {
        result: false,
        error: W24Error.VoucherOwnerInvalid,
      };
    }

    // Check voucher product type
    switch (item.productType) {
      case ProductTypeEnum.WASHING:
        if (voucher.type !== VoucherTypeEnum.WASHING_SERVICE) {
          return {
            result: false,
            error: W24Error.VoucherTypeInvalid,
          };
        }

        if (
          voucher.profileApplication !==
          VoucherProfileApplicationEnum.WASHING_SERVICE
        ) {
          return {
            result: false,
            error: W24Error.VoucherProfileInvalid,
          };
        }

        break;
      default:
        break;
    }

    // Check voucher status
    if (voucher.status !== VoucherStatusEnum.AVAILABLE) {
      return {
        result: item.orderId === voucher.orderId,
        error: W24Error.VoucherStatusInvalid,
      };
    }

    // Check voucher expired
    const now = getUtcNow();
    if (voucher.startAt && dayjs(voucher.startAt).isAfter(now)) {
      return {
        result: false,
        error: W24Error.VoucherNotActiveYet,
      };
    }

    if (voucher.endAt && dayjs(voucher.endAt).isBefore(now)) {
      return {
        result: false,
        error: W24Error.VoucherExpired,
      };
    }

    // Check voucher validity
    const excludeTimes = (voucher.validity?.excludeTimes ?? []).filter(
      (e) => e.start && e.end,
    );
    if (excludeTimes?.length) {
      const isExcluded = excludeTimes.some((e) =>
        dayjs(now).isBetween(dayjs(e.start), dayjs(e.end), null, '[]'),
      );

      if (isExcluded) {
        return {
          result: false,
          error: W24Error.VoucherExcludedTime,
        };
      }
    }

    // Check voucher min order value
    if (item.total < voucher.minOrderValue) {
      return {
        result: false,
        error: W24Error.VoucherMinOrderValue,
      };
    }

    // Check voucher mode restriction
    const washMode = item.data?.mode;
    const washModes = voucher.validity?.washModes ?? [];
    if (washModes.length && !washModes.includes(washMode)) {
      return {
        result: false,
        error: W24Error.VoucherModeInvalid,
      };
    }

    // Check voucher location restriction
    const stationIds = voucher.location?.stationIds ?? [];
    const deviceIds = voucher.location?.deviceIds ?? [];
    const isExcluded = voucher.location?.isExcluded ?? false;

    // Check station
    const curStationId = item.data?.stationId;
    const isValidStation = this.isValidLocation(
      isExcluded,
      stationIds,
      curStationId,
    );

    if (!isValidStation) {
      return {
        result: false,
        error: W24Error.VoucherStationInvalid,
      };
    }

    // Check device
    const curDeviceId = item.data?.deviceId;
    const isValidDevice = this.isValidLocation(
      isExcluded,
      deviceIds,
      curDeviceId,
    );

    if (!isValidDevice) {
      return {
        result: false,
        error: W24Error.VoucherDeviceInvalid,
      };
    }

    return {
      result: true,
    };
  }

  static isValidLocation(
    isExcluded: boolean,
    ids: string[] = [],
    curId: string = null,
  ): boolean {
    const isCurrIncluded = ids.includes(curId);

    return ids.length === 0 || (isExcluded ? !isCurrIncluded : isCurrIncluded);
  }

  static calculateItemValue(items: OrderItemEntity[]): {
    subTotal: number;
    quantity: number;
  } {
    return items.reduce(
      ({ subTotal, quantity }, item) => {
        return {
          subTotal: subTotal + Number(item.total || 0),
          quantity: quantity + Number(item.qty || 0),
        };
      },
      {
        subTotal: 0,
        quantity: 0,
      },
    );
  }

  static calculateGrandTotal(order: OrderEntity): number {
    if (!order) return 0;

    const {
      subTotal = 0,
      taxAmount = 0,
      extraFee = 0,
      discountAmount = 0,
      membershipAmount = 0,
    } = order;

    const grandTotal = Math.round(
      subTotal + taxAmount + extraFee - discountAmount - membershipAmount,
    );

    return Math.max(grandTotal, 0);
  }

  static validateNotifyOrder(order: OrderEntity): boolean {
    if (!order || !order.customerId) return false;

    switch (order.type) {
      case OrderTypeEnum.PACKAGE: {
        const notifiableStatuses = [
          OrderStatusEnum.PENDING,
          OrderStatusEnum.COMPLETED,
          OrderStatusEnum.FAILED,
        ];
        return notifiableStatuses.includes(order.status);
      }

      case OrderTypeEnum.FNB: {
        const notifiableStatuses = [
          OrderStatusEnum.REJECTED,
          OrderStatusEnum.CANCELED,
          OrderStatusEnum.REFUNDED,
          OrderStatusEnum.COMPLETED,
        ];
        return notifiableStatuses.includes(order.status);
      }

      case OrderTypeEnum.TOKENIZE:
        return false;

      default: {
        const notifiableStatuses = [
          OrderStatusEnum.PENDING,
          OrderStatusEnum.PROCESSING,
          OrderStatusEnum.COMPLETED,
          OrderStatusEnum.FAILED,
          OrderStatusEnum.ABNORMAL_STOP,
          OrderStatusEnum.SELF_STOP,
        ];

        return notifiableStatuses.includes(order.status);
      }
    }
  }

  static notificationMsg(
    status: OrderStatusEnum,
    type: OrderTypeEnum,
  ): {
    title: string;
    content: string;
  } {
    if (type !== OrderTypeEnum.DEFAULT) {
      return {
        title: `notification.order.${type}.title.${status}`,
        content: `notification.order.${type}.content.${status}`,
      };
    }

    return {
      title: `notification.order.title.${status}`,
      content: `notification.order.content.${status}`,
    };
  }

  static getVoucherName(discounts: OrderVoucherDto[]): string {
    return (discounts || [])
      .map((d) => d.name)
      .filter((n) => !!n.length)
      .join(', ');
  }

  static getDeepLink(type: OrderTypeEnum): NotificationDeepLink {
    if (type === OrderTypeEnum.PACKAGE) {
      return;
    }

    return NotificationDeepLink.Order;
  }

  static canImportInvoice(order: OrderEntity): boolean {
    if (order.status !== OrderStatusEnum.COMPLETED) return false;
    if (order.paymentMethod === PaymentMethod.VOUCHER_PAID) return false;

    return true;
  }
}
