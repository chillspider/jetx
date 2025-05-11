import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import sharp from 'sharp';

import { NullableType } from '../../common/types/nullable.type';
import { ApiConfigService } from './api-config.service';
import { LoggerService } from './logger.service';

export interface IImageResizeOption {
  width?: number;
  height?: number;
}

@Injectable()
export class AwsS3Service {
  private s3Bucket: string;
  private s3: S3;
  private tempDir = 'temps';
  private compressImageQuality: number;

  constructor(
    public _configService: ApiConfigService,
    private readonly _logger: LoggerService,
  ) {
    this.s3Bucket = this._configService.s3Config.bucket;

    this.s3 = new S3({
      endpoint: this._configService.s3Config.endpoint,
      accessKeyId: this._configService.s3Config.accessKeyId,
      secretAccessKey: this._configService.s3Config.secretAccessKey,
      signatureVersion: 'v2',
      sslEnabled: false,
      s3ForcePathStyle: true,
    });

    this.compressImageQuality =
      this._configService.s3Config.compressImageQuality;
  }

  async uploadFile(
    file: Express.Multer.File,
    path: string,
    resizeOption?: IImageResizeOption,
  ): Promise<S3.ManagedUpload.SendData> {
    const fileBuffer = file.buffer;

    return await this.s3UploadPublic(
      fileBuffer,
      path,
      file.mimetype,
      resizeOption,
    );
  }

  async uploadTempFile(
    file: Express.Multer.File,
    fileName: string,
  ): Promise<NullableType<string>> {
    const fileBuffer = file.buffer;
    const result = await this.s3UploadPublic(
      fileBuffer,
      `${this.tempDir}/${fileName}`,
      file.mimetype,
    );
    if (result?.Key) {
      return result?.Key;
    }

    return null;
  }

  async getFile(path: string) {
    const params: S3.Types.GetObjectRequest = {
      Bucket: this.s3Bucket,
      Key: path,
    };

    try {
      const data = await this.s3.getObject(params).promise();

      return data;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getObject(): Promise<string[]> {
    try {
      const data = await this.s3
        .listObjectsV2({
          Bucket: this.s3Bucket,
          Prefix: 'images/',
        })
        .promise();
      const listImages = (data.Contents || []).map(
        (file) => file.Key?.split('/')[1] || '',
      );

      return (listImages || []).filter((file) => !!file?.length);
    } catch (err) {
      this._logger.error(err);
      return [];
    }
  }

  async deleteObject(path: string): Promise<boolean> {
    try {
      await this.s3
        .deleteObject({
          Bucket: this.s3Bucket,
          Key: path,
        })
        .promise();
    } catch (err) {
      this._logger.error(err);
      return false;
    }

    return true;
  }

  async uploadBase64File(file: string, path: string, mimeType?: string) {
    try {
      const buf = Buffer.from(
        file.replace(/^data:image\/\w+;base64,/, ''),
        'base64',
      );
      return await this.s3UploadPublic(buf, path, mimeType || 'image/png');
    } catch (error) {
      this._logger.error(error);
      throw new Error(error);
    }
  }

  async uploadBuffer(buf: Buffer, path: string) {
    const params = {
      Bucket: this.s3Bucket,
      Key: String(path),
      Body: buf,
      ContentType: 'application/json',
      ContentDisposition: 'inline',
    };

    try {
      const s3Response = await this.s3.upload(params).promise();
      return s3Response;
    } catch (e) {
      this._logger.error(e);
      throw new Error(e);
    }
  }

  async existObject(path: string): Promise<boolean> {
    const params = {
      Bucket: this.s3Bucket,
      Key: path,
    };

    try {
      await this.s3.headObject(params).promise();
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      } else {
        this._logger.error(error);
        throw new Error(error);
      }
    }
  }

  private async s3UploadPublic(
    file: Buffer,
    name: string,
    mimetype: string,
    resizeOption?: IImageResizeOption,
  ) {
    const isImageFile = ['image/png', 'image/jpeg'].includes(mimetype);
    if (isImageFile) {
      file = await sharp(file)
        .jpeg({ quality: this.compressImageQuality })
        .toBuffer();
    }

    if (resizeOption) {
      file = await sharp(file).resize(resizeOption).toBuffer();
    }

    const params = {
      Bucket: this.s3Bucket,
      Key: String(name),
      Body: file,
      ContentType: mimetype,
      ContentDisposition: 'inline',
    };

    try {
      const s3Response = await this.s3.upload(params).promise();
      return s3Response;
    } catch (e) {
      this._logger.error(e);
      throw new Error(e);
    }
  }
}
