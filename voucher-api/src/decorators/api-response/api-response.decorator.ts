import type { Type } from '@nestjs/common';
import { applyDecorators } from '@nestjs/common';
import type { ApiResponseOptions } from '@nestjs/swagger';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

import { ResponseDto } from '../../common/dto/response.dto';

export function ApiResponseDto<T extends Type>(options: {
  type: T;
  description?: string;
}): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(ResponseDto<T>),
    ApiExtraModels(options.type),
    ApiOkResponse({
      description: options.description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto<T>) },
          {
            properties: {
              data: {
                $ref: getSchemaPath(options.type),
              },
            },
          },
        ],
      },
    } as ApiResponseOptions | undefined),
  );
}
