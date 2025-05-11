import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import appleSigninAuth from 'apple-signin-auth';
import { isEmail } from 'class-validator';
import dayjs from 'dayjs';
import { Response } from 'express';
import { OAuth2Client } from 'google-auth-library';

import { NullableType } from '../../../common/types/nullable.type';
import {
  formattedName,
  generateHash,
  getUtcNow,
  validateHash,
} from '../../../common/utils';
import { EVENT } from '../../../constants';
import { W24Error } from '../../../constants/error-code';
import { UserNotFoundException } from '../../../exceptions';
import { ApiConfigService } from '../../../shared/services/api-config.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { OtpService } from '../../../shared/services/otp.service';
import { TranslationService } from '../../../shared/services/translation.service';
import { ActionActivityEnum } from '../../activity-logs/enums/action-activity.enum';
import { EmailTemplate } from '../../mail/enums/email-template.enum';
import { MailService } from '../../mail/services/mail.service';
import { MailHelperService } from '../../mail/services/mail-helper.service';
import { Role } from '../../role-permission/enums/roles.enum';
import { RolePermissionService } from '../../role-permission/services/role-permission.service';
import { UserDto } from '../../user/dtos/user.dto';
import { UserEntity } from '../../user/entities/user.entity';
import { UserStatus } from '../../user/enums/user-status.enum';
import { UserType } from '../../user/enums/user-type.enum';
import { UserService } from '../../user/services/user.service';
import { AuthCacheService } from '../cache/auth-cache.service';
import { OtpSession } from '../dto/otp-session.dto';
import { AssistantLoginDto, LoginDto } from '../dto/request/login.dto';
import { ResetPasswordRequestDto } from '../dto/request/reset-password.request.dto';
import { UserRegisterDto } from '../dto/request/user-register.dto';
import { VerifyEmailRequest } from '../dto/request/verify-email-request.dto';
import { VerifyOtpRequest } from '../dto/request/verify-otp-request.dto';
import { LoginPayloadDto } from '../dto/response/login-payload.dto';
import { UserPayloadDto } from '../dto/response/user-payload.dto';
import { TokenPayloadDto } from '../dto/token-payload.dto';
import { AuthProvider } from '../enums/auth-provider.enum';
import { OTPSessionEnum } from '../enums/otp-session.enum';
import { ISocial } from '../interfaces/social.interface';

@Injectable()
export class AuthService {
  private _google: OAuth2Client;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    @Inject(REQUEST) private readonly _req: any,
    private _jwtService: JwtService,
    private _configService: ApiConfigService,
    private _userService: UserService,
    private _roleService: RolePermissionService,
    private _cacheService: AuthCacheService,
    private _otpService: OtpService,
    private _mailService: MailService,
    private _logger: LoggerService,
    private _emitter: EventEmitter2,
    private _mailHelper: MailHelperService,
    private _translateService: TranslationService,
  ) {
    this._google = new OAuth2Client(_configService.googleConfig);
  }

  public async login(dto: LoginDto): Promise<LoginPayloadDto> {
    const { provider, token, email, password } = dto;

    // ! Login with email and password
    if (provider === AuthProvider.email) {
      if (!email || !password) {
        throw new BadRequestException(W24Error.InvalidCredentials);
      }

      return this._getEmailUser(email, password);
    }

    if (!token) {
      throw new BadRequestException(W24Error.InvalidCredentials);
    }

    // ! Login with social provider
    let socialData: ISocial;

    switch (provider) {
      case AuthProvider.apple:
        socialData = await this._getAppleUser(dto);
        break;
      case AuthProvider.google:
        socialData = await this._getGoogleUser(token);
        break;
      default:
        throw new BadRequestException(W24Error.InvalidProvider);
    }

    if (!socialData) throw new UserNotFoundException();

    return this._validateSocialLogin(socialData, provider);
  }

  public async register(dto: UserRegisterDto): Promise<LoginPayloadDto> {
    const user = await this._userService.create(dto, [Role.USER]);
    if (!user) throw new BadRequestException(W24Error.UnexpectedError);

    await this.sendVerifyEmail(user);
    return this.generateLoginResponse(user);
  }

  private async _validateSocialLogin(
    socialData: ISocial,
    authProvider: AuthProvider,
  ): Promise<LoginPayloadDto> {
    let user = await this._findUserBySocialData(socialData, authProvider);

    if (!user && socialData.id) {
      user = await this._createUserFromSocialData(socialData, authProvider);
    }

    if (!user) {
      throw new UserNotFoundException();
    }

    return this.generateLoginResponse(user);
  }

  private async _getAppleUser(dto: LoginDto): Promise<ISocial> {
    try {
      if (!dto.token) {
        throw new BadRequestException(W24Error.InvalidCredentials);
      }

      const data = await appleSigninAuth.verifyIdToken(dto.token, {
        audience: this._configService.appleConfig.appAudience,
      });

      if (!data) {
        throw new BadRequestException(W24Error.InvalidToken);
      }

      return {
        id: data.sub,
        email: data.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
      };
    } catch (error) {
      throw new BadRequestException(W24Error.InvalidToken);
    }
  }

  private async _getGoogleUser(token: string): Promise<ISocial> {
    try {
      const ticket = await this._google.verifyIdToken({
        idToken: token,
      });
      const data = ticket.getPayload();

      if (!data) {
        throw new BadRequestException(W24Error.InvalidToken);
      }

      return {
        id: data.sub,
        email: data.email,
        firstName: data.given_name,
        lastName: data.family_name,
        avatar: data.picture,
      };
    } catch (error) {
      throw new BadRequestException(W24Error.InvalidToken);
    }
  }

  private async _getEmailUser(
    email: string,
    password: string,
  ): Promise<LoginPayloadDto> {
    const user = await this._userService.getValidatedUser({ email });
    if (!user) {
      throw new BadRequestException(W24Error.UnsupportedEmailRegister);

      // ! Register user if not found
      // return this.register({ email, password, firstName: '', lastName: '' });
    }

    if (!user.password) {
      throw new BadRequestException(W24Error.InvalidCredentials);
    }

    const isValidPassword = await validateHash(password, user.password);
    if (!isValidPassword) {
      throw new BadRequestException(W24Error.InvalidCredentials);
    }

    return this.generateLoginResponse(user);
  }

  private async _findUserBySocialData(
    socialData: ISocial,
    provider: AuthProvider,
  ): Promise<UserEntity | null> {
    const { id: socialId, email } = socialData;

    let user = await this._userService.getValidatedUser({ socialId, provider });

    if (!user && socialData.email) {
      user = await this._userService.getValidatedUser({ email });

      if (user) {
        // Update user with socialId and provider if not already set
        await this._updateUserSocialId(user, socialId, provider);
      }
    }

    return user;
  }

  private async _updateUserSocialId(
    user: UserEntity,
    socialId: string,
    provider: AuthProvider,
  ): Promise<void> {
    if (user.socialId !== socialId || user.provider !== provider) {
      await this._userService.update(user.id, {
        socialId,
        provider,
      });
    }
  }

  private async _createUserFromSocialData(
    socialData: ISocial,
    authProvider: AuthProvider,
  ): Promise<NullableType<UserEntity>> {
    const isApple = authProvider === AuthProvider.apple;

    const user = await this._userService.create(
      {
        email: socialData.email,
        firstName: socialData.firstName,
        lastName: socialData.lastName,
        socialId: socialData.id,
        provider: authProvider,
        avatar: socialData.avatar,
        status: isApple ? UserStatus.ACTIVE : UserStatus.INACTIVE,
      },
      [Role.USER],
    );

    if (user) {
      if (user.status === UserStatus.ACTIVE) {
        this._emitter.emit(EVENT.USER.VERIFIED, user.id);
      } else {
        await this.sendVerifyEmail(user);
      }
    }

    return user;
  }

  public async generateLoginResponse(
    user: UserEntity,
  ): Promise<LoginPayloadDto> {
    const userPayload = this._mapper.map(user, UserEntity, UserPayloadDto);
    const tokenData = await this._generateTokenPayload(userPayload);

    return {
      user: userPayload,
      ...tokenData,
    };
  }

  private async _generateTokenPayload(
    payload: UserPayloadDto,
  ): Promise<TokenPayloadDto> {
    if (payload.roles?.length) {
      const permissions = await this._roleService.getPermissions(payload.roles);
      const rights = [
        ...new Set(
          (permissions || []).map((item) => `${item.groupCode}_${item.code}`),
        ),
      ];

      payload.rights = rights;
    }

    const token = await this._jwtService.signAsync({ ...payload });

    return new TokenPayloadDto({
      accessToken: token,
    });
  }

  public async forgotPassword(email: string): Promise<boolean> {
    // Check if the user has session forgot password
    const isRequested = await this._getOtpSession(email, OTPSessionEnum.FORGOT);
    if (isRequested) {
      throw new BadRequestException(W24Error.TooManyRequests);
    }

    const user = await this._userService.getValidatedUser({ email });
    if (!user) {
      throw new UserNotFoundException();
    }

    const isSocialProvider = this._isSocialProvider(user.provider);
    if (isSocialProvider) {
      throw new BadRequestException(W24Error.UnsupportedSocialPasswordReset);
    }

    const dto = this._mapper.map(user, UserEntity, UserDto);

    // Generate OTP forgot password session and send email
    const { secret, otp } = this._generationOtpSession(OTPSessionEnum.FORGOT);
    await this._cacheService.setOtpSession({
      name: email,
      type: OTPSessionEnum.FORGOT,
      key: secret,
    });

    const hasEmailBeenSent = await this._mailService.forgotPassword({
      email,
      otp,
      user: dto.fullName ?? '',
    });

    if (!hasEmailBeenSent) {
      await this._cacheService.deleteOtpSession(email, OTPSessionEnum.FORGOT);
    }

    return hasEmailBeenSent;
  }

  public async resetPassword(dto: ResetPasswordRequestDto): Promise<boolean> {
    const { email, password, secret } = dto;

    // Get reset password session
    const session = await this._getOtpSession(email, OTPSessionEnum.RESET);

    const key = session?.key;
    if (!key) {
      throw new BadRequestException(W24Error.InvalidAuthCredentials);
    }

    const user = await this._userService.getValidatedUser({ email });
    if (!user) {
      throw new UserNotFoundException();
    }

    // Verify reset password session
    const isValidOtp = this._verifyOtp(OTPSessionEnum.RESET, key, secret);
    if (!isValidOtp) {
      throw new BadRequestException(W24Error.SessionExpired);
    }

    // Reset user password
    const isUpdated = await this._userService.update(user.id, {
      password: generateHash(password),
    });
    if (!isUpdated) {
      throw new BadRequestException(W24Error.UnexpectedError);
    }

    this._emitter.emit(EVENT.ACTIVITY_LOG, {
      objectId: user.id,
      action: ActionActivityEnum.UserChangePassword,
    });

    // Delete reset password session
    await this._cacheService.deleteOtpSession(dto.email, OTPSessionEnum.RESET);
    return true;
  }

  public async verifyOTPResetPassword(dto: VerifyOtpRequest): Promise<string> {
    // Get forgot password session
    const session = await this._getOtpSession(dto.email, OTPSessionEnum.FORGOT);

    const secret = session?.key;
    if (!secret) {
      throw new BadRequestException(W24Error.InvalidAuthCredentials);
    }

    const isValidOtp = this._verifyOtp(OTPSessionEnum.FORGOT, dto.otp, secret);
    if (!isValidOtp) {
      throw new BadRequestException(W24Error.InvalidOTP);
    }

    // Delete forgot password session
    await this._cacheService.deleteOtpSession(dto.email, OTPSessionEnum.FORGOT);

    // Generate reset password session
    const { secret: secretToReset, otp } = this._generationOtpSession(
      OTPSessionEnum.RESET,
    );
    await this._cacheService.setOtpSession({
      name: dto.email,
      type: OTPSessionEnum.RESET,
      key: otp,
    });

    return secretToReset;
  }

  private async _getOtpSession(
    email: string,
    type: OTPSessionEnum,
  ): Promise<Promise<OtpSession>> {
    const otpSession = await this._cacheService.getOtpSession(email, type);
    if (!otpSession) return;

    const { key, date } = otpSession;
    if (!key || !date) {
      await this._cacheService.deleteOtpSession(email, type);
      return;
    }

    // Check if the secret is expired
    const duration = dayjs(getUtcNow()).diff(dayjs(date), 'second');
    const expiredTime = this._cacheService.expiredTime(type);

    // If the secret is expired, delete it
    if (duration > expiredTime) {
      await this._cacheService.deleteOtpSession(email, type);
      return;
    }

    return otpSession;
  }

  private _generationOtpSession(type: OTPSessionEnum): {
    secret: string;
    otp: string;
  } {
    const step = this._cacheService.expiredTime(type);

    const secret = this._otpService.generateSecretKey();
    const otp = this._otpService.generateOtp(secret, step);

    return { secret, otp };
  }

  private _verifyOtp(
    type: OTPSessionEnum,
    otp: string,
    secret: string,
  ): boolean {
    const step = this._cacheService.expiredTime(type);
    return this._otpService.verifyOtp(otp, secret, step);
  }

  private _isSocialProvider(provider?: AuthProvider): boolean {
    provider ??= AuthProvider.email;
    return [AuthProvider.apple, AuthProvider.google].includes(provider);
  }

  public async createVerifyEmailSession(email: string): Promise<string> {
    try {
      // Validate email format
      if (!isEmail(email)) {
        throw new BadRequestException(W24Error.InvalidEmail);
      }

      const user = await this._userService.getValidatedUser({ email });
      if (!user) {
        throw new UserNotFoundException();
      }

      if (user.status !== UserStatus.INACTIVE) {
        throw new BadRequestException(W24Error.EmailAlreadyVerified);
      }

      // Generate OTP verify email session
      const { secret, otp } = this._generationOtpSession(
        OTPSessionEnum.VERIFY_EMAIL,
      );
      await this._cacheService.setOtpSession({
        name: secret,
        type: OTPSessionEnum.VERIFY_EMAIL,
        key: otp,
        extra: { email },
      });

      return secret;
    } catch (error) {
      this._logger.error(error);
      return null;
    }
  }

  public async verifyEmail(token: string): Promise<boolean> {
    const session = await this._getOtpSession(
      token,
      OTPSessionEnum.VERIFY_EMAIL,
    );
    if (!session) {
      throw new BadRequestException(W24Error.SessionExpired);
    }

    const { key: otp, email } = session;
    if (!otp || !email) {
      throw new BadRequestException(W24Error.InvalidToken);
    }

    // Verify session
    const isValidOtp = this._verifyOtp(OTPSessionEnum.VERIFY_EMAIL, otp, token);
    if (!isValidOtp) {
      throw new BadRequestException(W24Error.SessionExpired);
    }

    // Update user status to ACTIVE
    const user = await this._userService.getValidatedUser({ email });
    if (!user) {
      throw new UserNotFoundException();
    }

    if (user.status === UserStatus.INACTIVE) {
      const isUpdated = await this._userService.update(user.id, {
        status: UserStatus.ACTIVE,
      });
      if (!isUpdated) {
        throw new BadRequestException(W24Error.UnexpectedError);
      }

      this._emitter.emit(EVENT.ACTIVITY_LOG, {
        objectId: user.id,
        action: ActionActivityEnum.UserChangeStatus,
        value: { status: UserStatus.ACTIVE },
      });
      this._emitter.emit(EVENT.USER.VERIFIED, user.id);
    }

    return true;
  }

  public async sendMailSupportConfirmation(email: string): Promise<boolean> {
    try {
      const user = await this._userService.findOne({ email });
      if (!user) {
        throw new UserNotFoundException();
      }

      const dto = this._mapper.map(user, UserEntity, UserDto);

      let verifyEmailToken: string = null;
      if (user.status === UserStatus.INACTIVE) {
        verifyEmailToken = await this.createVerifyEmailSession(email);
      }

      return this._mailService.supportConfirmation({
        email,
        user: dto.fullName ?? '',
        verifyEmailToken,
      });
    } catch (error) {
      this._logger.error(error);
      return false;
    }
  }

  public async handleEmailVerification(
    res: Response,
    req: VerifyEmailRequest,
  ): Promise<void> {
    let isVerified = false;

    try {
      isVerified = await this.verifyEmail(req.token);
    } catch (error) {
      this._logger.error(error);
    }

    try {
      const [
        title,
        successTitle,
        successDescription,
        failureTitle,
        failureDescription,
      ] = this._translateService.translates(
        [
          { key: 'common.emailVerification.title' },
          {
            key: 'common.emailVerification.successTitle',
          },
          {
            key: 'common.emailVerification.successDescription',
          },
          {
            key: 'common.emailVerification.failureTitle',
          },
          {
            key: 'common.emailVerification.failureDescription',
          },
        ],
        req.lang,
      );

      const context = {
        title,
        successTitle,
        successDescription,
        failureTitle,
        failureDescription,
        success: isVerified,
      };

      const html = await this._mailHelper.buildTemplate(
        EmailTemplate.VerifyEmailResult,
        context,
        false,
      );

      res.setHeader('Content-Type', 'text/html');
      res.status(HttpStatus.OK).send(html);
    } catch (error) {
      this._logger.error(error);
      res.status(HttpStatus.BAD_REQUEST).send();
    }
  }

  public async handleSendVerifyEmail(): Promise<boolean> {
    try {
      const id = this._req?.user?.id;
      if (!id) {
        throw new ForbiddenException();
      }

      const user = await this._userService.findOne({
        id,
        type: UserType.CLIENT,
      });
      if (!user) {
        throw new UserNotFoundException();
      }

      if (user.status !== UserStatus.INACTIVE) {
        throw new BadRequestException(W24Error.EmailAlreadyVerified);
      }

      // Check if the user has already sent the verify email
      const session = await this._cacheService.getVerifySession(user.email);
      if (session) {
        throw new BadRequestException(W24Error.TooManyRequests);
      }

      return this.sendVerifyEmail(user);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  private async sendVerifyEmail(user: UserEntity): Promise<boolean> {
    try {
      if (
        user.status !== UserStatus.INACTIVE ||
        user.type !== UserType.CLIENT
      ) {
        return false;
      }

      // Generate verify email session
      const token = await this.createVerifyEmailSession(user.email);
      if (!token) return false;

      // Set verify email session
      await this._cacheService.setVerifySession(user.email, token);

      return this._mailService.verifyEmail({
        email: user.email,
        user: formattedName(user.firstName, user.lastName),
        token,
      });
    } catch (error) {
      this._logger.error(error);
      return false;
    }
  }

  public async assistantLogin(
    dto: AssistantLoginDto,
  ): Promise<LoginPayloadDto> {
    const user = await this._userService.getValidatedUser({
      email: dto.email,
    });
    if (!user) {
      throw new BadRequestException(W24Error.InvalidAuthCredentials);
    }

    const roles = (user.userRoles || []).map((role) => role.roleId);
    if (!roles.includes(Role.ASSISTANT)) {
      throw new BadRequestException(W24Error.InvalidAuthCredentials);
    }

    if (!user.password) {
      throw new BadRequestException(W24Error.InvalidCredentials);
    }

    const isValidPassword = await validateHash(dto.password, user.password);
    if (!isValidPassword) {
      throw new BadRequestException(W24Error.InvalidCredentials);
    }

    return this.generateLoginResponse(user);
  }
}
