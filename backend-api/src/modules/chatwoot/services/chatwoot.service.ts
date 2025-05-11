import { Injectable } from '@nestjs/common';

import { ApiConfigService } from '../../../shared/services/api-config.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { SupportDto } from '../../support/dtos/support.dto';
import { UserDto } from '../../user/dtos/user.dto';
import ChatwootClient, { extended_contact } from '../client';

@Injectable()
export class ChatwootService {
  private readonly _client: ChatwootClient;
  private readonly _accountId: number;

  constructor(
    private readonly _config: ApiConfigService,
    private readonly _logger: LoggerService,
  ) {
    this._client = new ChatwootClient({
      config: {
        basePath: this._config.chatwoot.baseUrl,
        with_credentials: true,
        credentials: 'include',
        token: this._config.chatwoot.token,
      },
    });
    this._accountId = this._config.chatwoot.accountId;
  }

  public async buildContactUrl(
    support: SupportDto,
    user: UserDto,
  ): Promise<string> {
    const contact = await this.updateContactAttributes(support, user);
    if (!contact) return null;

    return this.contactUrl(contact.id);
  }

  // ! Contact
  public async updateContactAttributes(
    support: SupportDto,
    user: UserDto,
  ): Promise<extended_contact> {
    try {
      const result = await this._client.contacts.search({
        accountId: this._accountId,
        q: user.email,
      });

      const contactData = {
        name: user.fullName || user.email,
        email: user.email,
        custom_attributes: {
          userId: user.id,
          supportId: support.nflowId,
          orderId: support.orderId,
        },
      };

      if (result?.payload?.length) {
        const matchedContact = result?.payload.find(
          (c) => c.identifier === user.email,
        );

        if (matchedContact) {
          await this._client.contacts.update({
            accountId: this._accountId,
            id: matchedContact.id,
            data: contactData,
          });

          return matchedContact;
        }
      }

      const contact = await this._client.contacts.create({
        accountId: this._accountId,
        data: {
          identifier: user.email,
          inbox_id: this._config.chatwoot.inboxId,
          ...contactData,
        },
      });
      return contact?.payload?.contact;
    } catch (error) {
      this._logger.error(error);
      return null;
    }
  }

  private contactUrl(contactId: number): string {
    return `${this._config.chatwoot.baseUrl}/app/accounts/${this._accountId}/contacts/${contactId}`;
  }
}
