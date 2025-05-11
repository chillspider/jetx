import { Request } from 'express';
import { RequestContext } from 'nestjs-request-context';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { SoftRemoveEvent } from 'typeorm/subscriber/event/SoftRemoveEvent';

import { getUtcNow } from '../common/utils';
import { UserPayloadDto } from '../modules/auth/dto/response/user-payload.dto';

@EventSubscriber()
export class EntitySubscriber implements EntitySubscriberInterface {
  /**
   * Called before post insertion.
   */
  beforeInsert(event: InsertEvent<any>) {
    const user = this._currentUser();

    if (event?.entity) {
      event.entity.createdAt = getUtcNow();

      if (user && !event.entity.createdBy) {
        event.entity.createdBy = user?.id;
      }
    }
  }

  /**
   * Called before entity update.
   */
  beforeUpdate(event: UpdateEvent<any>) {
    const user = this._currentUser();
    if (event.entity) {
      event.entity.updatedAt = getUtcNow();

      if (user && !event.entity.updatedBy) {
        event.entity.updatedBy = user?.id;
      }
    }
  }

  /**
   * Called before entity removal.
   */
  beforeSoftRemove(event: SoftRemoveEvent<any>) {
    const user = this._currentUser();
    if (event.entity && !event.entity.deletedBy && user) {
      event.entity.deletedBy = user.id;
    }
  }

  private _currentUser(): UserPayloadDto | null {
    const req: Request = RequestContext.currentContext?.req;
    if (req?.user) {
      return req?.user as UserPayloadDto;
    }
    return null;
  }
}
