import { BadRequestException, Injectable } from '@nestjs/common';

import { validateHash } from '../../../common/utils';
import { W24Error } from '../../../constants/error-code';
import { LoggerService } from '../../../shared/services/logger.service';
import { LoginPayloadDto } from '../../auth/dto/response/login-payload.dto';
import { AuthService } from '../../auth/services/auth.service';
import { UserType } from '../../user/enums/user-type.enum';
import { UserService } from '../../user/services/user.service';
import { NflowTokenRequestDto } from '../dtos/requests/nflow-token.request.dto';

@Injectable()
export class NflowAuthService {
  constructor(
    private readonly _userService: UserService,
    private readonly _authService: AuthService,
    private readonly _logger: LoggerService,
  ) {}

  public async getAccessToken(
    dto: NflowTokenRequestDto,
  ): Promise<LoginPayloadDto> {
    try {
      const user = await this._userService.findOne({
        email: dto.username,
        type: UserType.ADMIN,
      });
      if (!user) {
        throw new BadRequestException(W24Error.NotFound('User'));
      }

      if (!user.password) {
        throw new BadRequestException(W24Error.InvalidCredentials);
      }

      const isValidPassword = await validateHash(dto.password, user.password);
      if (!isValidPassword) {
        throw new BadRequestException(W24Error.InvalidCredentials);
      }

      return this._authService.generateLoginResponse(user);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }
}
