export interface IDataBean {
  header: {
    devId: string;
    sign: string;
    timeStamp: string;
  };
  body: string;
}
