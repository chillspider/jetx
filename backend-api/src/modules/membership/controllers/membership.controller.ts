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
import { Role } from '../../role-permission/enums/roles.enum';
import { MembershipDto } from '../dtos/membership.dto';
import {
  CreateMembershipDto,
  UpdateMembershipDto,
} from '../dtos/requests/create-membership.dto';
import { CreateUserMembershipDto } from '../dtos/requests/create-user-membership.dto';
import { UserMembershipDto } from '../dtos/user-membership.dto';
import { MembershipService } from '../services/membership.service';

@Controller({
  path: 'memberships',
  version: '1',
})
@ApiTags('Memberships')
export class MembershipController extends BaseController {
  constructor(private readonly _membershipService: MembershipService) {
    super();
  }

  @Get()
  @Auth({ roles: [Role.SA] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get memberships list' })
  @ApiPageResponse({ type: MembershipDto })
  async getMemberships(
    @Query(new ValidationPipe({ transform: true }))
    query: PaginationRequestDto,
  ): Promise<ResponseDto<PaginationResponseDto<MembershipDto>>> {
    const result = await this._membershipService.getMemberships(query);
    return this.getResponse(true, result);
  }

  @Post()
  @Auth({ roles: [Role.SA] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a membership' })
  @ApiResponseDto({ type: MembershipDto })
  async createMembership(
    @Body() request: CreateMembershipDto,
  ): Promise<ResponseDto<MembershipDto>> {
    const result = await this._membershipService.create(request);
    return this.getResponse(true, result);
  }

  @Put()
  @Auth({ roles: [Role.SA] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update membership' })
  @ApiResponseDto({ type: Boolean })
  async updateMembership(
    @Body() request: UpdateMembershipDto,
  ): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._membershipService.update(request);
    return this.getResponse(true, isUpdated);
  }

  @Get(':id')
  @Auth({ roles: [Role.SA] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get membership by id' })
  @ApiResponseDto({ type: MembershipDto })
  async getMember(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<MembershipDto>> {
    const result = await this._membershipService.getMembership(id);
    return this.getResponse(true, result);
  }

  @Delete(':id')
  @Auth({ roles: [Role.SA] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete membership' })
  @ApiResponseDto({ type: Boolean })
  async deleteMembership(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._membershipService.delete(id);
    return this.getResponse(true, isUpdated);
  }

  @Post('user')
  @Auth({ roles: [Role.SA] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create user membership' })
  @ApiResponseDto({ type: UserMembershipDto })
  async createUserMembership(
    @Body() request: CreateUserMembershipDto,
  ): Promise<ResponseDto<UserMembershipDto>> {
    const result = await this._membershipService.createUserMembership(request);
    return this.getResponse(true, result);
  }
}
