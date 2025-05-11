/* eslint-disable @typescript-eslint/naming-convention */
import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import * as admin from 'firebase-admin';

import {
  NotificationMulticastPayload,
  NotificationPayload,
  NotificationTokenPayload,
  NotificationTopicPayload,
} from '../../modules/notification/dtos/notification-payload.dto';
import { ApiConfigService } from './api-config.service';
import { LoggerService } from './logger.service';

dayjs.extend(duration);

export type TokenMessage = admin.messaging.TokenMessage;
export type BatchResponse = admin.messaging.BatchResponse;
export type Messaging = admin.messaging.Messaging;

export const DEFAULT_TOPIC = 'default';

@Injectable()
export class FCMService {
  private _fcm: Messaging;

  private _defaultTTL = {
    ios: dayjs.duration({ days: 7 }).asSeconds(),
    android: dayjs.duration({ days: 7 }).asMilliseconds(),
  };

  constructor(
    private readonly _configService: ApiConfigService,
    private readonly _logger: LoggerService,
  ) {
    const defaultApp = admin.initializeApp({
      projectId: this._configService.firebase.projectId,
      credential: admin.credential.cert({
        projectId: this._configService.firebase.projectId,
        clientEmail: this._configService.firebase.clientEmail,
        privateKey: this._configService.firebase.privateKey,
      }),
    });
    this._fcm = admin.messaging(defaultApp);
  }

  public send(data: NotificationTokenPayload): Promise<string> {
    try {
      const message = {
        ...this._message(data),
        token: data.token,
      };

      return this._fcm.send(message);
    } catch (error) {
      this._logger.error(error);
      throw error;
    }
  }

  public sendEach(data: NotificationMulticastPayload): Promise<BatchResponse> {
    try {
      const messages = data.tokens.map((token) => ({
        ...this._message(data),
        token,
      }));

      return this._fcm.sendEach(messages);
    } catch (error) {
      this._logger.error(error);
      throw error;
    }
  }

  public sendMulticast(
    data: NotificationMulticastPayload,
  ): Promise<BatchResponse> {
    try {
      const message = {
        ...this._message(data),
        tokens: data.tokens,
      };

      return this._fcm.sendEachForMulticast(message);
    } catch (error) {
      this._logger.error(error);
      throw error;
    }
  }

  public sendTopic(data: NotificationTopicPayload): Promise<string> {
    try {
      const message = {
        ...this._message(data),
        topic: data.topic,
      };

      return this._fcm.send(message);
    } catch (error) {
      this._logger.error(error);
      throw error;
    }
  }

  public sendAll(data: NotificationPayload): Promise<string> {
    try {
      const message = {
        ...this._message(data),
        topic: DEFAULT_TOPIC,
      };

      return this._fcm.send(message);
    } catch (error) {
      this._logger.error(error);
      throw error;
    }
  }

  public async subscribeToDefaultTopic(
    token: string | string[],
  ): Promise<boolean> {
    const result = await this._fcm.subscribeToTopic(token, DEFAULT_TOPIC);
    return result?.successCount > 0;
  }

  public async unsubscribeToDefaultTopic(
    token: string | string[],
  ): Promise<boolean> {
    const result = await this._fcm.unsubscribeFromTopic(token, DEFAULT_TOPIC);
    return result?.successCount > 0;
  }

  public async subscribeToTopic(
    deviceToken: string | string[],
    topic: string = null,
  ): Promise<boolean> {
    topic ??= DEFAULT_TOPIC;

    const result = await this._fcm.subscribeToTopic(deviceToken, topic);
    return result?.successCount > 0;
  }

  public async unsubscribeFromTopic(
    deviceToken: string | string[],
    topic: string = null,
  ): Promise<boolean> {
    topic ??= DEFAULT_TOPIC;

    const result = await this._fcm.unsubscribeFromTopic(deviceToken, topic);
    return result?.successCount > 0;
  }

  private _message({
    type,
    data,
    notification,
    ttl,
    badge,
    deepLink,
  }: NotificationPayload): Omit<TokenMessage, 'token'> {
    const msgData: Record<string, string> = {
      type: String(type),
      data: JSON.stringify(data),
      deepLink: deepLink,
    };

    const payload: Omit<TokenMessage, 'token'> = {
      data: msgData,
      notification: { ...notification },
      android: {
        notification: { notificationCount: badge },
        ttl: ttl ?? this._defaultTTL.android,
        data: msgData,
      },
      apns: {
        headers: {
          'apns-expiration': ttl
            ? ttl.toString()
            : this._defaultTTL.ios.toString(),
        },
        payload: {
          aps: { badge, mutableContent: true },
          data: msgData,
        },
        fcmOptions: {},
      },
      webpush: { headers: {} },
    };

    if (notification.imageUrl && this._isValidImageUrl(notification.imageUrl)) {
      payload.android.notification.imageUrl = notification.imageUrl;
      payload.apns.fcmOptions.imageUrl = notification.imageUrl;
      payload.webpush.headers['image'] = notification.imageUrl;
    }

    return payload;
  }

  private _isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i;
      return (
        ['http:', 'https:'].includes(urlObj.protocol) &&
        imageExtensions.test(urlObj.pathname)
      );
    } catch {
      return false;
    }
  }
}
