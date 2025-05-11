import {
  createMap,
  forMember,
  mapFrom,
  Mapper,
  MappingProfile,
} from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import { InvoiceDto } from '../dtos/invoice.dto';
import { InvoiceBillingDto } from '../dtos/invoice-billing.dto';
import { InvoiceItemDto } from '../dtos/invoice-item.dto';
import { InvoiceProviderDto } from '../dtos/invoice-provider.dto';
import { InvoiceProviderRequestDto } from '../dtos/requests/invoice-provider.request.dto';
import {
  CreateB2bInvoiceRequestDto,
  InvoiceBillingRequestDto,
  InvoiceItemRequestDto,
} from '../dtos/requests/issue-b2b-invoice.request.dto';
import { InvoiceEntity } from '../entities/invoice.entity';
import { InvoiceBillingEntity } from '../entities/invoice-billing.entity';
import { InvoiceItemEntity } from '../entities/invoice-item.entity';
import { InvoiceProviderEntity } from '../entities/invoice-provider.entity';
import { EncryptService } from '../services/encrypt.service';

@Injectable()
export class InvoiceProfile extends AutomapperProfile {
  constructor(
    @InjectMapper() mapper: Mapper,
    private readonly encryptor: EncryptService,
  ) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(mapper, InvoiceBillingEntity, InvoiceBillingDto);
      createMap(mapper, InvoiceBillingDto, InvoiceBillingEntity);
      createMap(
        mapper,
        InvoiceProviderEntity,
        InvoiceProviderDto,
        forMember(
          (d) => d.config,
          mapFrom((s) => {
            delete s.config.password;
            return s.config;
          }),
        ),
      );
      createMap(mapper, InvoiceProviderDto, InvoiceProviderEntity);
      createMap(mapper, InvoiceProviderRequestDto, InvoiceProviderEntity);
      createMap(mapper, InvoiceItemEntity, InvoiceItemDto);
      createMap(mapper, InvoiceItemDto, InvoiceItemEntity);
      createMap(
        mapper,
        InvoiceEntity,
        InvoiceDto,
        forMember(
          (d) => d.data,
          mapFrom((s) => s.data),
        ),
      );
      createMap(mapper, InvoiceDto, InvoiceEntity);
      createMap(mapper, CreateB2bInvoiceRequestDto, InvoiceEntity);
      createMap(mapper, InvoiceBillingRequestDto, InvoiceBillingEntity);
      createMap(mapper, InvoiceItemRequestDto, InvoiceItemEntity);
    };
  }
}
