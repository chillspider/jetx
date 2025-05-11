import {
  ClassField,
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
} from '../../../../decorators';
import { UserPayloadDto } from './user-payload.dto';

export class LoginPayloadDto {
  @ClassField(() => UserPayloadDto)
  user!: UserPayloadDto;

  @NumberFieldOptional()
  expiresIn?: number;

  @StringField()
  accessToken!: string;

  @StringFieldOptional()
  refreshToken?: string;
}
