import { BadRequestException, Injectable } from '@nestjs/common';
import mime from 'mime';
import { v1 as uuid } from 'uuid';

import { W24Error } from '../../constants/error-code';

@Injectable()
export class GeneratorService {
  public uuid(): string {
    return uuid();
  }

  /**
   * Generates a unique file name for the given file.
   * @param file - The file object.
   * @returns The generated file name.
   * @throws BadRequestException if the file extension is invalid or missing.
   */
  public fileName(mimeType: string): string {
    const ext = mime.extension(mimeType);

    if (!ext?.length) {
      throw new BadRequestException(W24Error.InvalidField('File_Extension'));
    }

    return this.uuid() + '.' + ext;
  }
}
