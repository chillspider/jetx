import {
  createMap,
  forMember,
  mapFrom,
  Mapper,
  MappingProfile,
} from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import { toUtc } from '../../../common/utils';
import { B2bVoucherDto } from '../dtos/b2b-voucher.dto';
import { B2bVoucherCodeDto } from '../dtos/b2b-voucher-code.dto';
import { CreateB2bVoucherDto } from '../dtos/requests/create-b2b-voucher.dto';
import { B2bVoucherEntity } from '../entities/b2b-voucher.entity';
import { B2bVoucherCodeEntity } from '../entities/b2b-voucher-code.entity';
import { B2bVoucherInvoiceEntity } from '../entities/b2b-voucher-invoice.entity';

@Injectable()
export class B2bVoucherProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(mapper, B2bVoucherEntity, B2bVoucherDto);
      createMap(mapper, B2bVoucherDto, B2bVoucherEntity);
      createMap(
        mapper,
        CreateB2bVoucherDto,
        B2bVoucherEntity,
        forMember(
          (d) => d.validity,
          mapFrom((s) => ({
            excludeTimes: (s.excludeTime || []).map((e) => ({
              ...e,
              start: toUtc(e.start),
              end: toUtc(e.end),
            })),
            washModes: s.washModes || [],
          })),
        ),
        forMember(
          (d) => d.startAt,
          mapFrom((s) => toUtc(s.startAt)),
        ),
        forMember(
          (d) => d.endAt,
          mapFrom((s) => toUtc(s.endAt)),
        ),
        forMember(
          (d) => d.invoice,
          mapFrom((s) => {
            if (
              !s.invoiceTaxCode ||
              !s.invoiceName ||
              !s.invoiceCompanyName ||
              !s.invoiceAddress ||
              !s.invoiceItems?.length
            ) {
              return null;
            }

            return {
              code: s.invoiceTaxCode,
              name: s.invoiceName,
              billingName: s.invoiceCompanyName,
              address: s.invoiceAddress,
              items: s.invoiceItems || [],
            } as B2bVoucherInvoiceEntity;
          }),
        ),
      );
      createMap(mapper, B2bVoucherCodeEntity, B2bVoucherCodeDto);
      createMap(mapper, B2bVoucherCodeDto, B2bVoucherCodeEntity);
    };
  }
}
