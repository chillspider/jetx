import { DynamicModule, Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { createClientProvider } from './client.provider';
import { MQTT_OPTION_PROVIDER } from './mqtt.constants';
import { MqttExplorer } from './mqtt.explorer';
import { MqttModuleAsyncOptions, MqttModuleOptions } from './mqtt.interface';
import { MqttService } from './mqtt.service';
import {
  createLoggerProvider,
  createOptionProviders,
} from './options.provider';

@Global()
@Module({
  imports: [DiscoveryModule],
  exports: [MqttService],
})
export class MqttModule {
  public static forRootAsync(options: MqttModuleAsyncOptions): DynamicModule {
    return {
      module: MqttModule,
      providers: [
        ...createOptionProviders(options),
        createLoggerProvider(options),
        createClientProvider(),
        MqttExplorer,
        MqttService,
      ],
    };
  }

  public static forRoot(options: MqttModuleOptions): DynamicModule {
    return {
      module: MqttModule,
      providers: [
        {
          provide: MQTT_OPTION_PROVIDER,
          useValue: options,
        },
        createLoggerProvider(options),
        createClientProvider(),
        MqttExplorer,
        MqttService,
      ],
    };
  }
}
