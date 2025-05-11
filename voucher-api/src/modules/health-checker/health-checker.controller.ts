import { Controller, Get } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';

@Controller('healthcheck')
export class HealthCheckerController {
  constructor() {}

  @Get()
  @HealthCheck()
  async check(): Promise<{ data: boolean }> {
    return { data: true };
  }
}
