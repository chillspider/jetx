import { BadRequestException, Injectable } from '@nestjs/common';
import { fromBuffer } from 'file-type';

import { MaybeType } from '../../common/types/maybe.type';
import { IMG_PATH } from '../../constants/config';
import { W24Error } from '../../constants/error-code';
import { FileNotImageException } from '../../exceptions';
import { ApiConfigService } from './api-config.service';
import { GeneratorService } from './generator.service';
import { BaseHttpService } from './http.service';
import { LoggerService } from './logger.service';
import { IImageResizeOption, S3Service } from './s3.service';
import { ValidatorService } from './validator.service';

@Injectable()
export class UploadService {
  constructor(
    private readonly _s3Service: S3Service,
    private readonly _validatorService: ValidatorService,
    private readonly _generatorService: GeneratorService,
    private readonly _configService: ApiConfigService,
    private readonly _logger: LoggerService,
    private readonly _http: BaseHttpService,
  ) {}

  public async uploadImage(
    file: Express.Multer.File,
    prefix: string,
    resizeOption?: IImageResizeOption,
  ): Promise<string> {
    if (file.size > this._configService.s3Config.maxImageSize) {
      throw new BadRequestException(W24Error.InvalidField('Size_Limit'));
    }

    if (!this._validatorService.isImage(file.mimetype)) {
      throw new FileNotImageException();
    }

    const fileName = this._generatorService.fileName(file.mimetype);
    const path = `${IMG_PATH.ROOT}/${prefix}/${fileName}`;

    try {
      const result = await this._s3Service.uploadFile(file, path, resizeOption);
      if (result) {
        return path;
      }

      throw new BadRequestException(W24Error.UnexpectedError);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async uploadImageFromUrl(
    url: string,
    prefix: string,
  ): Promise<MaybeType<string>> {
    const response = await this._http.get<string>(url, {
      responseType: 'arraybuffer',
    });
    const buffer = Buffer.from(response.data, 'utf-8');
    if (!buffer) return;

    const fileType = await fromBuffer(buffer);
    if (!fileType) return;

    if (!this._validatorService.isImage(fileType.mime)) {
      return;
    }

    const fileName = this._generatorService.fileName(fileType.mime);
    const path = `${IMG_PATH.ROOT}/${prefix}/${fileName}`;

    try {
      const result = await this._s3Service.uploadBase64File(
        buffer.toString('base64'),
        path,
        fileType.mime,
      );
      if (result) {
        return path;
      }

      return;
    } catch (error) {
      this._logger.error(error);
      return;
    }
  }

  public async uploadImageFromBuffer(
    buffer: Buffer,
    prefix: string,
  ): Promise<MaybeType<string>> {
    if (!buffer) return;

    const fileType = await fromBuffer(buffer);
    if (!fileType) return;

    if (!this._validatorService.isImage(fileType.mime)) {
      return;
    }

    const fileName = this._generatorService.fileName(fileType.mime);
    const path = `${IMG_PATH.ROOT}/${prefix}/${fileName}`;

    try {
      const result = await this._s3Service.uploadBase64File(
        buffer.toString('base64'),
        path,
        fileType.mime,
      );
      if (result) {
        return path;
      }

      return;
    } catch (error) {
      this._logger.error(error);
      return;
    }
  }

  public async deleteImages(path: string | string[]): Promise<boolean> {
    try {
      if (typeof path === 'string') {
        return this._s3Service.deleteObject(path);
      }

      const result = await Promise.all(
        path.map((e) => this._s3Service.deleteObject(e)),
      );
      return result.every((e) => e);
    } catch (error) {
      this._logger.error(error);
      return false;
    }
  }
}
