import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DataSource, Repository } from 'typeorm';

import { ApiConfigService } from '../../../shared/services/api-config.service';
import { OrderTypeEnum } from '../../order/enums/order-type.enum';
import { UserTokenDto } from '../../user/dtos/user-token.dto';
import { UserTokenEntity } from '../../user/entities/user-token.entity';
import { PaymentMethodModel } from '../dtos/payment-method-model';
import { GetPaymentMethodRequest } from '../dtos/requests/get-payment-method.request';
import { PaymentMethod, PaymentProvider } from '../enums/payment-method.enum';

@Injectable()
export class PaymentService {
  private _userTokenRepository: Repository<UserTokenEntity>;

  constructor(
    @Inject(REQUEST) private readonly _req: any,
    @InjectMapper() private readonly _mapper: Mapper,
    private _dataSource: DataSource,
    private readonly _configService: ApiConfigService,
  ) {
    this._userTokenRepository = this._dataSource.getRepository(UserTokenEntity);
  }

  public async getPaymentMethods(
    query: GetPaymentMethodRequest,
  ): Promise<PaymentMethodModel[]> {
    const userId = this._req?.user?.id;
    if (!userId) throw new ForbiddenException();

    const configMethods = this._configMethods();
    const methods: PaymentMethodModel[] = [];
    const type = query?.type || OrderTypeEnum.DEFAULT;

    const addPaymentMethods = (
      method: PaymentMethod,
      providers: PaymentProvider[] = [],
      allowedTypes: OrderTypeEnum[] = [],
    ) => {
      const isTypeAllowed = allowedTypes.includes(type) || !allowedTypes.length;

      if (configMethods.includes(method) && isTypeAllowed) {
        if (providers.length) {
          providers.forEach((provider) => {
            methods.push({ method, provider });
          });
        } else {
          methods.push({ method });
        }
      }
    };

    // ! Static QR method
    addPaymentMethods(
      PaymentMethod.QR,
      [PaymentProvider.GPay],
      [OrderTypeEnum.DEFAULT],
    );

    // ! Dynamic QR method
    addPaymentMethods(
      PaymentMethod.QRPAY,
      [PaymentProvider.GPay],
      [OrderTypeEnum.PACKAGE, OrderTypeEnum.FNB],
    );

    // ! Tokenize method
    const allowedTokenizeTypes = [
      OrderTypeEnum.PACKAGE,
      OrderTypeEnum.FNB,
      OrderTypeEnum.DEFAULT,
    ];
    if (
      configMethods.includes(PaymentMethod.CREDIT) &&
      allowedTokenizeTypes.includes(type)
    ) {
      const userTokens = await this._userTokenRepository.findBy({
        createdBy: userId,
      });
      const tokens = this._mapper.mapArray(
        userTokens,
        UserTokenEntity,
        UserTokenDto,
      );

      tokens.forEach((token) => {
        methods.push({
          method: PaymentMethod.TOKEN,
          provider: token.paymentProvider,
          token: token,
          isDefault: token.isDefault,
        });
      });
    }

    // ! Credit method
    addPaymentMethods(PaymentMethod.CREDIT, Object.values(PaymentProvider), []);

    // ! Cash method
    addPaymentMethods(
      PaymentMethod.CASH,
      [],
      [OrderTypeEnum.PACKAGE, OrderTypeEnum.FNB, OrderTypeEnum.DEFAULT],
    );

    return methods;
  }

  public checkPaymentMethod(method: PaymentMethod): boolean {
    const configMethods = this._configMethods();
    return configMethods.includes(method);
  }

  private _configMethods(): PaymentMethod[] {
    const configs = this._configService.paymentMethods;

    return Object.values(PaymentMethod).filter((method) => {
      return configs.includes(method);
    });
  }
}
