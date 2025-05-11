export enum InvoiceCode01Type {
  C = 'C', // thể hiện hóa đơn điện tử có mã của cơ quan thuế
  K = 'K', // thể hiện hóa đơn điện tử không có mã
}

export enum InvoiceCode02Type {
  T = 'T', // Áp dụng đối với hóa đơn điện tử do các doanh nghiệp, tổ chức, hộ, cá nhân kinh doanh đang ký sử dụng với cơ quan thuế;
  D = 'D', // Áp dụng đối với hóa đơn bán tài sản công và hóa đơn bán hàng dự trữ quốc gia hoặc hóa đơn điện tử đặc thù không nhất thiết phải có một số tiêu thức do các doanh nghiệp, tổ chức đăng ký sử dụng;
  L = 'L', // Áp dụng đối với hóa đơn điện tử của cơ quan thuế cấp theo từng lần phát sinh;
  M = 'M', // Áp dụng đối với hóa đơn điện tử được khởi tạo từ máy tính tiền;
}

export interface ITransactionLog {
  log(type: string, action: string, objectId: string, data: any): void;
}

export interface IEasyInvoiceConfig {
  env: 'production' | 'development';
  transactionLog?: ITransactionLog;
}

export interface IEasyInvoiceOptions {
  config: IEasyInvoiceConfig;
}
