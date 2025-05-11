import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';

@Controller('healthcheck')
export class HealthCheckerController {
  constructor() {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @HealthCheck()
  async check(): Promise<{ data: boolean }> {
    return { data: true };
  }
}
