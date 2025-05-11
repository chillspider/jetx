/* eslint-disable @typescript-eslint/ban-types */
export const FNB_PRICE_CONVERTER = 'fnb:price_converter';

export function FnbPriceConverter(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    Reflect.defineMetadata(FNB_PRICE_CONVERTER, true, target, propertyKey);
  };
}
