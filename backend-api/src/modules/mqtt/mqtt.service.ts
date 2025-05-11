import { Inject, Injectable } from '@nestjs/common';
import {
  IClientPublishOptions,
  IClientSubscribeOptions,
  ISubscriptionGrant,
  MqttClient,
  Packet,
} from 'mqtt';

import { MQTT_CLIENT_INSTANCE } from './mqtt.constants';

@Injectable()
export class MqttService {
  constructor(
    @Inject(MQTT_CLIENT_INSTANCE) private readonly client: MqttClient,
  ) {}

  subscribe(
    topic: string | string[],
    opts?: IClientSubscribeOptions,
  ): Promise<ISubscriptionGrant[]> {
    return new Promise((resolve, reject) => {
      this.client.subscribe(topic, opts || null, (err, granted) => {
        if (err) {
          reject(err);
        } else {
          resolve(granted);
        }
      });
    });
  }

  unsubscribe(topic: string, opts?: Record<string, any>): Promise<Packet> {
    return new Promise<Packet>((resolve, reject) => {
      this.client.unsubscribe(topic, opts || null, (error, packet) => {
        if (error) {
          reject(error);
        } else {
          resolve(packet);
        }
      });
    });
  }

  publish(
    topic: string,
    // eslint-disable-next-line @typescript-eslint/ban-types
    message: string | Buffer | object,
    opts?: IClientPublishOptions,
  ): Promise<Packet> {
    return new Promise<Packet>((resolve, reject) => {
      if (typeof message === 'object') {
        message = JSON.stringify(message);
      }
      this.client.publish(topic, message, opts || null, (error, packet) => {
        if (error) {
          reject(error);
        } else {
          resolve(packet);
        }
      });
    });
  }
}
