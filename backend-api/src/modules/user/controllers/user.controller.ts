import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/controllers/base.controller';
import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { ResponseDto } from '../../../common/dto/response.dto';
import { Auth, UUIDParam } from '../../../decorators';
import {
  ApiPageResponse,
  ApiResponseDto,
} from '../../../decorators/api-response';
import { AssistantLoginDto } from '../../auth/dto/request/login.dto';
import { Role } from '../../role-permission/enums/roles.enum';
import { SubmitReferralRequest } from '../dtos/requests/submit-referral.request.dto';
import { UpdateDeviceTokenRequest } from '../dtos/requests/update-device-token.request';
import { UserDto } from '../dtos/user.dto';
import { UserService } from '../services/user.service';

@Controller({
  path: 'users',
  version: '1',
})
@ApiTags('Users')
export class UserController extends BaseController {
  constructor(private userService: UserService) {
    super();
  }

  @Get()
  @Auth({ roles: [Role.SA] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get users list' })
  @ApiPageResponse({ type: UserDto })
  async getUsers(
    @Query(new ValidationPipe({ transform: true }))
    query: PaginationRequestDto,
  ): Promise<ResponseDto<PaginationResponseDto<UserDto>>> {
    const result = await this.userService.getUsers(query);
    return this.getResponse(true, result);
  }

  @Get(':id')
  @Auth({ roles: [Role.SA] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get users detail' })
  @ApiResponseDto({ type: UserDto })
  async getUser(
    @UUIDParam('id') userId: string,
  ): Promise<ResponseDto<UserDto>> {
    const result = await this.userService.getUser(userId);
    return this.getResponse(true, result);
  }

  @Post('register-device')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register device token' })
  @ApiResponseDto({ type: Boolean })
  async registerDeviceToken(
    @Body() dto: UpdateDeviceTokenRequest,
  ): Promise<ResponseDto<boolean>> {
    const isSuccess = await this.userService.registerDeviceToken(dto.token);
    return this.getResponse(true, isSuccess);
  }

  @Post('remove-device')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove device token' })
  @ApiResponseDto({ type: Boolean })
  async removeDeviceToken(
    @Body() dto: UpdateDeviceTokenRequest,
  ): Promise<ResponseDto<boolean>> {
    const isSuccess = await this.userService.removeDeviceToken(dto.token);
    return this.getResponse(true, isSuccess);
  }

  @Post('submit-referral')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit referral' })
  @ApiResponseDto({ type: Boolean })
  async submitReferral(
    @Body() dto: SubmitReferralRequest,
  ): Promise<ResponseDto<boolean>> {
    const isSuccess = await this.userService.submitReferralCode(dto);
    return this.getResponse(true, isSuccess);
  }

  @Post('general-referrals')
  @Auth({ roles: [Role.SA] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate referral code for users' })
  @ApiResponseDto({ type: Boolean })
  async generateReferral(): Promise<ResponseDto<boolean>> {
    await this.userService.generateReferralCodeUsers();
    return this.getResponse(true, true);
  }

  @Post('assistant')
  @Auth({ roles: [Role.SA] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create assistant user' })
  @ApiResponseDto({ type: UserDto })
  async createAssistantUser(
    @Body() dto: AssistantLoginDto,
  ): Promise<ResponseDto<UserDto>> {
    const result = await this.userService.createAssistantUser(dto);
    return this.getResponse(true, result);
  }
}
