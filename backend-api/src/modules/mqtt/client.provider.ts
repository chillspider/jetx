import { Logger, Provider } from '@nestjs/common';
import { connect } from 'mqtt';

import {
  MQTT_CLIENT_INSTANCE,
  MQTT_LOGGER_PROVIDER,
  MQTT_OPTION_PROVIDER,
} from './mqtt.constants';
import { MqttModuleOptions } from './mqtt.interface';

export function createClientProvider(): Provider {
  return {
    provide: MQTT_CLIENT_INSTANCE,
    useFactory: (options: MqttModuleOptions, logger: Logger) => {
      const client = connect(options);

      client.on('connect', () => {
        logger.log('MQTT connected');
      });

      client.on('disconnect', (_) => {
        logger.log('MQTT disconnected');
      });

      client.on('error', (error) => {
        logger.error('MQTT error', error);
      });

      client.on('reconnect', () => {
        logger.log('MQTT reconnecting');
      });

      client.on('close', () => {
        logger.log('MQTT closed');
      });

      client.on('offline', () => {
        logger.log('MQTT offline');
      });

      return client;
    },
    inject: [MQTT_OPTION_PROVIDER, MQTT_LOGGER_PROVIDER],
  };
}
