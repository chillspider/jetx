import 'reflect-metadata';

export const LOCALIZED_PROPERTIES_KEY = 'LocalizedProperties';

export function Localizable(): PropertyDecorator {
  return function (target, propertyKey) {
    if (!Reflect.hasMetadata(LOCALIZED_PROPERTIES_KEY, target)) {
      Reflect.defineMetadata(LOCALIZED_PROPERTIES_KEY, [propertyKey], target);
    } else {
      const localizedProperties = Reflect.getMetadata(
        LOCALIZED_PROPERTIES_KEY,
        target,
      ) as string[];
      Reflect.defineMetadata(
        LOCALIZED_PROPERTIES_KEY,
        [...localizedProperties, propertyKey],
        target,
      );
    }
  };
}
