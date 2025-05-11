import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/controllers/base.controller';
import { ResponseDto } from '../../../common/dto/response.dto';
import { ApiResponseDto } from '../../../decorators/api-response';
import { LoginPayloadDto } from '../../auth/dto/response/login-payload.dto';
import { NflowTokenRequestDto } from '../dtos/requests/nflow-token.request.dto';
import { NflowAuthService } from '../services/nflow-auth.service';

@Controller({
  path: 'nflow/auth',
  version: '1',
})
@ApiTags('Nflow APIs')
export class NflowAuthController extends BaseController {
  constructor(private readonly _authService: NflowAuthService) {
    super();
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get access token for Nflow' })
  @ApiResponseDto({ type: LoginPayloadDto })
  public async getAccessToken(
    @Body() dto: NflowTokenRequestDto,
  ): Promise<ResponseDto<LoginPayloadDto>> {
    const res = await this._authService.getAccessToken(dto);
    return this.getResponse(true, res);
  }
}
