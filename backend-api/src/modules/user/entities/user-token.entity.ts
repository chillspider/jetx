import { AutoMap } from '@automapper/classes';
import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { PaymentProvider } from '../../payment/enums/payment-method.enum';

@Entity({ name: 'user_tokens', synchronize: false })
export class UserTokenEntity extends AbstractEntity {
  @Column({ nullable: true })
  @AutoMap()
  accountBrand?: string;

  @Column({ nullable: true })
  @AutoMap()
  accountSource?: string;

  @Column({ nullable: true })
  @AutoMap()
  accountNumber?: string;

  @Column({ nullable: true })
  @AutoMap()
  accountName?: string;

  @Column()
  @AutoMap()
  token: string;

  @Column()
  @AutoMap()
  paymentProvider: PaymentProvider;

  @Column({ default: false })
  @AutoMap()
  isDefault: boolean;
}
