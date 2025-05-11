import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { BaseController } from '../../../common/controllers/base.controller';
import { ResponseDto } from '../../../common/dto/response.dto';
import { ApiFile, Auth } from '../../../decorators';
import { ApiResponseDto } from '../../../decorators/api-response';
import { Role } from '../../role-permission/enums/roles.enum';
import { UpdatePasswordDto } from '../../user/dtos/requests/update-password.dto';
import { UpdateProfileDto } from '../../user/dtos/requests/update-profile.dto';
import { UserDto } from '../../user/dtos/user.dto';
import { UserService } from '../../user/services/user.service';
import { ForgotPasswordRequestDto } from '../dto/request/forgot-password.request.dto';
import { AssistantLoginDto, LoginDto } from '../dto/request/login.dto';
import { ResetPasswordRequestDto } from '../dto/request/reset-password.request.dto';
import { VerifyEmailRequest } from '../dto/request/verify-email-request.dto';
import { VerifyOtpRequest } from '../dto/request/verify-otp-request.dto';
import { LoginPayloadDto } from '../dto/response/login-payload.dto';
import { AuthService } from '../services/auth.service';

@Controller({
  path: 'auth',
  version: '1',
})
@ApiTags('Auth')
export class AuthController extends BaseController {
  constructor(
    private _authService: AuthService,
    private _userService: UserService,
  ) {
    super();
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email password or social' })
  @ApiResponseDto({ type: LoginPayloadDto })
  async login(@Body() dto: LoginDto): Promise<ResponseDto<LoginPayloadDto>> {
    const result = await this._authService.login(dto);
    return this.getResponse(true, result);
  }

  @Get('me')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get profile' })
  @ApiResponseDto({ type: UserDto })
  async getProfile(): Promise<ResponseDto<UserDto>> {
    const result = await this._userService.getProfile();
    return this.getResponse(true, result);
  }

  @Put('me')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiFile({ name: 'file' })
  @ApiOperation({ summary: 'Update profile' })
  @ApiResponseDto({ type: UserDto })
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ResponseDto<UserDto>> {
    const result = await this._userService.updateProfile(dto, file);
    return this.getResponse(true, result);
  }

  @Delete('me')
  @Auth({ roles: [Role.USER] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete profile' })
  @ApiResponseDto({ type: Boolean })
  async deleteProfile(): Promise<ResponseDto<boolean>> {
    const isDeleted = await this._userService.deleteProfile();
    return this.getResponse(true, isDeleted);
  }

  @Put('password')
  @Auth({ roles: [Role.USER] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update password' })
  @ApiResponseDto({ type: Boolean })
  async updatePassword(
    @Body() dto: UpdatePasswordDto,
  ): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._userService.updatePassword(dto);
    return this.getResponse(true, isUpdated);
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Forgot password' })
  @ApiResponseDto({ type: Boolean })
  async forgotPassword(
    @Body() dto: ForgotPasswordRequestDto,
  ): Promise<ResponseDto<boolean>> {
    const isRequested = await this._authService.forgotPassword(dto.email);
    return this.getResponse(true, isRequested);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponseDto({ type: Boolean })
  async resetPassword(
    @Body() dto: ResetPasswordRequestDto,
  ): Promise<ResponseDto<boolean>> {
    const isSuccess = await this._authService.resetPassword(dto);
    return this.getResponse(true, isSuccess);
  }

  @Post('password/otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP reset password' })
  @ApiResponseDto({ type: String })
  async verifyOTP(@Body() dto: VerifyOtpRequest): Promise<ResponseDto<string>> {
    const isRequested = await this._authService.verifyOTPResetPassword(dto);
    return this.getResponse(true, isRequested);
  }

  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email' })
  @ApiResponseDto({ type: Boolean })
  async verifyEmail(
    @Body() dto: VerifyEmailRequest,
  ): Promise<ResponseDto<boolean>> {
    const isVerified = await this._authService.verifyEmail(dto.token);
    return this.getResponse(true, isVerified);
  }

  @Post('email/verify/send')
  @HttpCode(HttpStatus.OK)
  @Auth({ roles: [Role.USER] })
  @ApiOperation({ summary: 'Send verify email' })
  @ApiResponseDto({ type: Boolean })
  async sendVerifyEmail(): Promise<ResponseDto<boolean>> {
    const isSent = await this._authService.handleSendVerifyEmail();
    return this.getResponse(true, isSent);
  }

  @Get('email/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email token' })
  async verifyEmailToken(
    @Query(new ValidationPipe({ transform: true }))
    query: VerifyEmailRequest,
    @Res() res: Response,
  ): Promise<void> {
    await this._authService.handleEmailVerification(res, query);
  }

  @Post('assistant/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email password' })
  @ApiResponseDto({ type: LoginPayloadDto })
  async assistantLogin(
    @Body() dto: AssistantLoginDto,
  ): Promise<ResponseDto<LoginPayloadDto>> {
    const result = await this._authService.assistantLogin(dto);
    return this.getResponse(true, result);
  }
}
