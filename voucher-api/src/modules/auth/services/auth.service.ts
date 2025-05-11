import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserPayloadDto } from '../dto/response/user-payload.dto';
import { TokenPayloadDto } from '../dto/token-payload.dto';

@Injectable()
export class AuthService {
  constructor(private _jwtService: JwtService) {}

  public async _generateTokenPayload(
    payload: UserPayloadDto,
  ): Promise<TokenPayloadDto> {
    const token: string = await this._jwtService.signAsync({ ...payload });

    return new TokenPayloadDto({
      accessToken: token,
    });
  }
}
