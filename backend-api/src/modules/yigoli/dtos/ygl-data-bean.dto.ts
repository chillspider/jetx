import { ClassField, StringField } from '../../../decorators';

export class DataBeanHeader {
  @StringField()
  devId: string;

  @StringField()
  sign: string;

  @StringField()
  timeStamp: string;
}

export class DataBeanDto {
  @ClassField(() => DataBeanHeader)
  header: DataBeanHeader;

  @StringField()
  body: string;
}
