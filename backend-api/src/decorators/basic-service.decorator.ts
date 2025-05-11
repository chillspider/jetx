import { SetMetadata } from '@nestjs/common';

export const AUTH_BASIC_SERVICE_KEY = 'custom:auth-basic-service';
export const AuthBasicService = (service: string) =>
  SetMetadata(AUTH_BASIC_SERVICE_KEY, service);
