import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { LANGUAGE } from '../../../constants';
import { IMG_PATH } from '../../../constants/config';
import { W24Error } from '../../../constants/error-code';
import { LocalizeService } from '../../../shared/services/localize.service';
import { UploadService } from '../../../shared/services/upload.service';
import { AttentionDto } from '../dtos/attention.dto';
import {
  CreateAttentionDto,
  UpdateAttentionDto,
} from '../dtos/requests/create-attention.dto';
import { AttentionEntity } from '../entities/attention.entity';

@Injectable()
export class AttentionService {
  private _attentionRepository: Repository<AttentionEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    @Inject(LANGUAGE) private readonly lang: string,
    private _dataSource: DataSource,
    private _localizeService: LocalizeService<AttentionEntity>,
    private _upload: UploadService,
  ) {
    this._attentionRepository = this._dataSource.getRepository(AttentionEntity);
  }

  public async create(dto: CreateAttentionDto): Promise<AttentionDto> {
    const entity = this._mapper.map(dto, CreateAttentionDto, AttentionEntity);

    this._localizeService.addTranslations(entity, this.lang);

    const result = await this._attentionRepository.save(entity);
    return this._mapper.map(result, AttentionEntity, AttentionDto);
  }

  public async update(dto: UpdateAttentionDto): Promise<boolean> {
    const entity = await this._attentionRepository.findOneBy({
      id: dto.id,
    });
    if (!entity) throw new BadRequestException(W24Error.NotFound('Attention'));

    let updateEntity = this._mapper.map(
      dto,
      UpdateAttentionDto,
      AttentionEntity,
    );

    updateEntity = this._localizeService.updateTranslations(
      entity,
      updateEntity,
      this.lang,
    );

    await this._attentionRepository.save(updateEntity);
    return true;
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this._attentionRepository.delete(id);
    return !!result?.affected;
  }

  public async getAttention(id: string): Promise<AttentionDto> {
    const entity = await this._attentionRepository.findOneBy({ id });
    if (!entity) throw new BadRequestException(W24Error.NotFound('Attention'));

    this._localizeService.localize(entity, this.lang);

    return this._mapper.map(entity, AttentionEntity, AttentionDto);
  }

  public async getAttentions(): Promise<AttentionDto[]> {
    const entities = await this._attentionRepository.find();
    this._localizeService.localizeArray(entities, this.lang);

    return this._mapper.mapArray(entities, AttentionEntity, AttentionDto);
  }

  private async _uploadImage(file: Express.Multer.File): Promise<string> {
    const result = await this._upload.uploadImage(
      file,
      IMG_PATH.ATTENTION_CUSTOM,
    );
    return result;
  }
}
