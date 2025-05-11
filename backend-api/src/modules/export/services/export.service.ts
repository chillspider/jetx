import { BadRequestException, Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { Worksheet } from 'exceljs';
import { snakeCase } from 'lodash';
import { DataSource } from 'typeorm';

import { formattedFileName, formattedName } from '../../../common/utils';
import { DEFAULT_TIMEZONE } from '../../../constants/config';
import { W24Error } from '../../../constants/error-code';
import { LoggerService } from '../../../shared/services/logger.service';
import { S3Service } from '../../../shared/services/s3.service';
import { TranslationService } from '../../../shared/services/translation.service';
import { MailService } from '../../mail/services/mail.service';
import { ReferralEntity } from '../../user/entities/referral.entity';
import { ExportReferralRequest } from '../dtos/export-referral.request';
import { ExportRefundRequest } from '../dtos/export-refund.request';
import { IDataSheetExcel } from '../interfaces/data-sheet-excel.interface';
import { IExportReferral } from '../interfaces/export-referral.interface';
import { Excel } from '../utils/excel';

dayjs.extend(utc);
dayjs.extend(timezone);

const EXCEED_THRESHOLD = 30;
const DATE_FORMAT = 'HH:mm DD/MM/YYYY';
const FILENAME_DATE_FORMAT = 'DDMMYYYY';

@Injectable()
export class ExportService {
  constructor(
    private readonly _logger: LoggerService,
    private readonly _dataSource: DataSource,
    private readonly _i18n: TranslationService,
    private readonly _s3: S3Service,
    private readonly _mailService: MailService,
  ) {}

  public async exportReferrals(dto: ExportReferralRequest): Promise<string> {
    try {
      const start = dayjs(dto.start);
      const end = dayjs(dto.end);

      const startUtc = start.utc();
      const endUtc = end.utc();

      if (startUtc.isAfter(endUtc)) {
        throw new BadRequestException(W24Error.InvalidDateRange);
      }

      const diff = endUtc.diff(startUtc, 'days');
      if (diff > EXCEED_THRESHOLD) {
        throw new BadRequestException(
          `date_range_exceeds_${EXCEED_THRESHOLD}_days`,
        );
      }

      const referrals = await this._dataSource
        .getRepository(ReferralEntity)
        .createQueryBuilder('referral')
        .leftJoinAndSelect('referral.referralUser', 'referralUser')
        .leftJoinAndSelect('referral.referredUser', 'referredUser')
        .where('referral.createdAt >= :start', { start: startUtc.toDate() })
        .andWhere('referral.createdAt <= :end', { end: endUtc.toDate() })
        .select([
          'referral.id',
          'referral.referralId',
          'referral.referredId',
          'referral.referralCode',
          'referral.createdAt',
          'referralUser.email',
          'referralUser.lastName',
          'referralUser.firstName',
          'referredUser.email',
          'referredUser.lastName',
          'referredUser.firstName',
        ])
        .orderBy('referral.createdAt', 'ASC')
        .getMany();

      if (!referrals?.length) {
        throw new BadRequestException(W24Error.NotFound('Referral'));
      }

      const data: IExportReferral[] = referrals.map((referral) => {
        return {
          referralId: referral.referralId,
          referralEmail: referral.referralUser.email,
          referralName: formattedName(
            referral.referralUser.firstName,
            referral.referralUser.lastName,
          ),
          referralCode: referral.referralCode,
          referredId: referral.referredId,
          referredEmail: referral.referredUser.email,
          referredName: formattedName(
            referral.referredUser.firstName,
            referral.referredUser.lastName,
          ),
          createdAt: dayjs(referral.createdAt)
            .tz(DEFAULT_TIMEZONE)
            .format(DATE_FORMAT),
        };
      });

      const title = this._i18n.t('common.referralReport.title');

      const excelData: IDataSheetExcel = {
        data,
        title: title,
        column: data.length
          ? Object.keys(data[0]).map((key) =>
              this._i18n.t(`common.referralReport.${key}`),
            )
          : [],
      };

      const startStr = start.format(FILENAME_DATE_FORMAT);
      const endStr = end.format(FILENAME_DATE_FORMAT);
      const fileName = `${formattedFileName(title)}_${startStr}_${endStr}`;

      return this.uploadXlsxToS3([excelData], fileName);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async mailRefundList(dto: ExportRefundRequest): Promise<boolean> {
    try {
      const { emails, refunds } = dto;

      if (!refunds?.length) {
        throw new BadRequestException(W24Error.MissingRequiredField('refunds'));
      }

      if (!emails?.length) {
        throw new BadRequestException(W24Error.InvalidEmail);
      }

      const data = refunds.map((refund, index) => ({
        no: index + 1,
        ...refund,
      }));

      const title = this._i18n.t('common.refund.title');

      const excelData: IDataSheetExcel = {
        data,
        title: title,
        column: Object.keys(data[0]).map((key) =>
          this._i18n.t(`common.refund.${key}`),
        ),
      };

      const fileName = `${formattedFileName(title)}_${dayjs().format(FILENAME_DATE_FORMAT)}.xlsx`;

      const buffer = await this.createExcelBuffer([excelData]);
      const attachment = {
        filename: fileName,
        content: buffer,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };

      return this._mailService.refundList(attachment, emails);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async uploadXlsxToS3(
    data: IDataSheetExcel[],
    name: string,
  ): Promise<string> {
    try {
      const objectKey = `excels/${snakeCase(name)}_${new Date().getTime()}.xlsx`;

      const file = await this.createExcelBuffer(data);
      const uploadResult = await this._s3.uploadXlsx(file, objectKey);

      return uploadResult.Location;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  public async createExcelBuffer(data: IDataSheetExcel[]): Promise<Buffer> {
    const excelSheet = await this.saveDataAsExcel(data);
    const file = await excelSheet.workbook.xlsx.writeBuffer();
    return file as Buffer;
  }

  public async saveDataAsExcel(data: IDataSheetExcel[]) {
    const workbook = new Excel();

    await Promise.all(
      data.map(async (sheet) => {
        const worksheet = await workbook.addWorkSheet({
          title: sheet.title,
        });

        if (sheet.data?.length) {
          await this._addDataToWorksheet(
            workbook,
            worksheet,
            sheet.column,
            sheet.data,
          );
        } else {
          await this._addNoDataToWorksheet(workbook, worksheet);
        }
      }),
    );

    return workbook;
  }

  private async _addDataToWorksheet(
    workbook: Excel,
    worksheet: Worksheet,
    columns: string[],
    data: Array<Record<string, any>>,
  ): Promise<void> {
    await workbook.addHeaderRow(worksheet, columns);

    await Promise.all(
      data.map(async (item) => {
        const rowData: any[] = Object.values(item).map((value) => value);
        await workbook.addRow(worksheet, rowData, {
          bold: false,
          fillColor: 'ffffff',
        });
      }),
    );
  }

  private async _addNoDataToWorksheet(
    workbook: Excel,
    worksheet: Worksheet,
  ): Promise<void> {
    await workbook.addHeaderRow(worksheet, ['Data']);
    await workbook.addRow(worksheet, ['No Data'], {
      bold: true,
      fillColor: 'ffffff',
    });
  }
}
