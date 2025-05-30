/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { agent_bot } from '../models/agent_bot';
import type { agent_bot_create_update_payload } from '../models/agent_bot_create_update_payload';

import type { CancelablePromise } from '../core/CancelablePromise';
import { ChatwootAPIConfig } from '../core/ChatwootAPI';
import { request as __request } from '../core/request';

export class AccountAgentBots {
  private chatwootAPI: ChatwootAPIConfig;

  constructor({ config }: { config: ChatwootAPIConfig }) {
    this.chatwootAPI = config;
  }

  /**
   * List all AgentBots
   * List all agent bots available for the current account
   * @returns agent_bot Success
   * @throws ApiError
   */
  public list({
    accountId,
  }: {
    /**
     * The numeric ID of the account
     */
    accountId: number;
  }): CancelablePromise<Array<agent_bot>> {
    return __request(this.chatwootAPI, {
      method: 'GET',
      url: '/api/v1/accounts/{account_id}/agent_bots',
      path: {
        account_id: accountId,
      },
      errors: {
        401: `Unauthorized`,
      },
    });
  }

  /**
   * Create an Agent Bot
   * Create an agent bot in the account
   * @returns agent_bot Success
   * @throws ApiError
   */
  public create({
    accountId,
    data,
  }: {
    /**
     * The numeric ID of the account
     */
    accountId: number;
    data: agent_bot_create_update_payload;
  }): CancelablePromise<agent_bot> {
    return __request(this.chatwootAPI, {
      method: 'POST',
      url: '/api/v1/accounts/{account_id}/agent_bots',
      path: {
        account_id: accountId,
      },
      body: data,
      errors: {
        401: `Unauthorized`,
      },
    });
  }

  /**
   * Get an agent bot details
   * Get the details of an agent bot in the account
   * @returns agent_bot Success
   * @throws ApiError
   */
  public get({
    accountId,
    id,
  }: {
    /**
     * The numeric ID of the account
     */
    accountId: number;
    /**
     * The ID of the agentbot to be updated
     */
    id: number;
  }): CancelablePromise<agent_bot> {
    return __request(this.chatwootAPI, {
      method: 'GET',
      url: '/api/v1/accounts/{account_id}/agent_bots/{id}',
      path: {
        account_id: accountId,
        id: id,
      },
      errors: {
        401: `Unauthorized`,
        404: `The given agent bot ID does not exist in the account`,
      },
    });
  }

  /**
   * Update an agent bot
   * Update an agent bot's attributes
   * @returns agent_bot Success
   * @throws ApiError
   */
  public update({
    accountId,
    id,
    data,
  }: {
    /**
     * The numeric ID of the account
     */
    accountId: number;
    /**
     * The ID of the agentbot to be updated
     */
    id: number;
    data: agent_bot_create_update_payload;
  }): CancelablePromise<agent_bot> {
    return __request(this.chatwootAPI, {
      method: 'PATCH',
      url: '/api/v1/accounts/{account_id}/agent_bots/{id}',
      path: {
        account_id: accountId,
        id: id,
      },
      body: data,
      errors: {
        401: `Unauthorized`,
      },
    });
  }

  /**
   * Delete an AgentBot
   * Delete an AgentBot from the account
   * @returns any Success
   * @throws ApiError
   */
  public delete({
    accountId,
    id,
  }: {
    /**
     * The numeric ID of the account
     */
    accountId: number;
    /**
     * The ID of the agentbot to be updated
     */
    id: number;
  }): CancelablePromise<any> {
    return __request(this.chatwootAPI, {
      method: 'DELETE',
      url: '/api/v1/accounts/{account_id}/agent_bots/{id}',
      path: {
        account_id: accountId,
        id: id,
      },
      errors: {
        401: `Unauthorized`,
        404: `The agent bot does not exist in the account`,
      },
    });
  }
}
