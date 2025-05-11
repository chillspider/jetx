/* eslint-disable @typescript-eslint/ban-types */
import { isArray, isNumber, isObject } from 'lodash';

import { FNB_PRICE_CONVERTER } from '../../../decorators/fnb-price.decorator';
import { BBProductDiscountDto } from '../dtos/bb-product.dto';
import { BBDiscountActionEnum } from '../enums/bb.enum';

export class BBUtils {
  static toCent(price: number): number {
    return Math.round(price * 100);
  }

  static toPrice(cent: number): number {
    return Math.round(cent / 100);
  }

  static formatPrices<T extends object | object[]>(
    data: T,
    toCent: boolean = false,
  ): T {
    if (!data) return data;

    if (isArray(data)) {
      return data.map((item) =>
        isObject(item) ? this.formatPrices(item, toCent) : item,
      ) as T;
    }

    if (isObject(data)) {
      const typedData = data as Record<string, any>; // Type assertion

      const priceKeys = Object.keys(typedData).filter((key) =>
        Reflect.getMetadata(
          FNB_PRICE_CONVERTER,
          data.constructor.prototype,
          key,
        ),
      );

      for (const [key, value] of Object.entries(typedData)) {
        if (priceKeys.includes(key) && isNumber(value)) {
          // Convert price fields
          typedData[key] = toCent
            ? BBUtils.toCent(value)
            : BBUtils.toPrice(value);
        } else if (isArray(value)) {
          // Handle arrays of objects
          typedData[key] = value.map((item) =>
            isObject(item) ? this.formatPrices(item, toCent) : item,
          );
        } else if (isObject(value)) {
          // Handle nested objects
          typedData[key] = this.formatPrices(value, toCent);
        }
      }

      return typedData as T;
    }

    return data;
  }

  static getValidDiscount(
    discounts: BBProductDiscountDto[] = [],
  ): BBProductDiscountDto | null {
    const validDiscounts = discounts.filter((discount) => !discount.isExpired);
    if (!validDiscounts?.length) return null;

    let appliedDiscount: BBProductDiscountDto = validDiscounts[0];

    for (const curDiscount of validDiscounts) {
      if (
        (appliedDiscount.priority ?? Infinity) <
        (curDiscount.priority ?? Infinity)
      ) {
        continue;
      }
      if (
        (appliedDiscount.priority ?? Infinity) >
        (curDiscount.priority ?? Infinity)
      ) {
        appliedDiscount = curDiscount;
        continue;
      }

      if (appliedDiscount.discountAction !== curDiscount.discountAction) {
        if (
          appliedDiscount.discountAction === BBDiscountActionEnum.FIXED_PRICE
        ) {
          continue;
        }
        if (curDiscount.discountAction === BBDiscountActionEnum.FIXED_PRICE) {
          appliedDiscount = curDiscount;
          continue;
        }
      }

      if (appliedDiscount.price > curDiscount.price) {
        appliedDiscount = curDiscount;
      }
    }

    return appliedDiscount;
  }
}
