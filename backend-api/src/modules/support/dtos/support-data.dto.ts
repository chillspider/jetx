import { StringFieldOptional } from '../../../decorators';

export class SupportDataDto {
  @StringFieldOptional()
  supportResponse?: string;

  @StringFieldOptional()
  supportChatUrl?: string;
}
