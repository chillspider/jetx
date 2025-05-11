/* eslint-disable @typescript-eslint/naming-convention */
import { Injectable } from '@nestjs/common';
import FormData from 'form-data';
import mime from 'mime';
import path from 'path';

import { ImageFile } from '../../common/types/image-file.type';
import { CarModelDto } from '../../modules/car-detector/dtos/car-model.dto';
import { AbstractAPIService } from './abstract-api.service';
import { ApiConfigService } from './api-config.service';
import { LoggerService } from './logger.service';

interface CarAnalysisResponse {
  cars?: Array<{
    car_type: string;
    color: string;
    brand: string;
    plate_number: string;
  }>;
}

@Injectable()
export class DetectorService extends AbstractAPIService {
  constructor(
    private readonly _config: ApiConfigService,
    private readonly _logger: LoggerService,
  ) {
    super();
  }

  protected getBaseUrl(): string {
    return this._config.detector.url;
  }

  private async analyze(formData: FormData): Promise<CarModelDto> {
    const response = await this.http.post<CarAnalysisResponse>(
      this.makeUrl('/analyze-car'),
      formData,
      {
        headers: formData.getHeaders(),
      },
    );

    const car = response?.data?.cars?.[0];
    if (!car) {
      return null;
    }

    const hasAnyValues = Object.values(car).some((value) => !!value);
    if (!hasAnyValues) {
      return null;
    }

    return {
      carType: car.car_type,
      color: car.color,
      brand: car.brand,
      plateNumber: car.plate_number,
    };
  }

  public async analyzeCar(image: Express.Multer.File): Promise<CarModelDto> {
    try {
      const formData = new FormData();
      formData.append('image', image.buffer, {
        filename: image.originalname,
        contentType: image.mimetype,
      });

      return await this.analyze(formData);
    } catch (error) {
      this._logger.error(error);
      return null;
    }
  }

  public async analyzeCarByUrl(url: string): Promise<CarModelDto> {
    if (!url) return null;

    const contentType = mime.lookup(url);
    const filename = path.basename(url);
    const buffer = await this._fetchFileBuffer(url);

    if (!buffer) return null;

    try {
      const formData = new FormData();
      formData.append('image', buffer, {
        filename,
        contentType,
      });

      return await this.analyze(formData);
    } catch (error) {
      this._logger.error(error);
      return null;
    }
  }

  public async analyzeCarByBuffer(image: ImageFile): Promise<CarModelDto> {
    if (!image) return null;

    try {
      const formData = new FormData();
      formData.append('image', image.buffer, {
        filename: image.filename,
        contentType: image.contentType,
      });

      return await this.analyze(formData);
    } catch (error) {
      this._logger.error(error);
      return null;
    }
  }

  private async _fetchFileBuffer(url: string): Promise<Buffer> {
    try {
      const data = await fetch(url);
      return Buffer.from(await data.arrayBuffer());
    } catch (error) {
      this._logger.error(error);
      return null;
    }
  }
}
