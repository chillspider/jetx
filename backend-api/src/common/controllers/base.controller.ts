import { ResponseDto } from '../../common/dto/response.dto';

export class BaseController {
  protected getResponse<T>(
    isSuccess: boolean,
    data: T,
    errors: string[] = [],
  ): ResponseDto<T> {
    return new ResponseDto<T>(data, isSuccess, errors);
  }
}
