import { BadRequestException, Injectable } from '@nestjs/common';

import { IMG_PATH } from '../../../constants/config';
import { LoggerService } from '../../../shared/services/logger.service';
import { UploadService } from '../../../shared/services/upload.service';

@Injectable()
export class NflowResourceService {
  constructor(
    private readonly _upload: UploadService,
    private readonly _logger: LoggerService,
  ) {}

  public async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
    try {
      const tasks = files.map((file) =>
        this._upload.uploadImage(file, IMG_PATH.IMAGES),
      );
      const urls = await Promise.all(tasks);
      return urls;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }
}
