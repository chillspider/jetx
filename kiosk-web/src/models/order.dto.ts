/* eslint-disable @typescript-eslint/no-explicit-any */
import { AbstractDto } from "./abstract.dto";

export enum OrderStatusEnum {
	DRAFT = "draft",
	COMPLETED = "completed",
	CANCELED = "canceled",
	FAILED = "failed",
	REFUNDED = "refunded",
	PENDING = "pending",
	PROCESSING = "processing",
	ABNORMAL_STOP = "abnormal_stop",
	SELF_STOP = "self_stop",
	REJECTED = "rejected",
	UNKNOWN = "unknown",
}

export enum PaymentMethod {
	CASH = "cash",
	CREDIT = "credit",
	QR = "qr",
	TOKEN = "token",
	QRPAY = "qrpay",
	VOUCHER_PAID = "voucher_paid",
	VOUCHER_FREE = "voucher_free",
}

export enum PaymentProvider {
	GPay = "gpay",
}

export enum ClientType {
	IOS = 2,
	ANDROID = 3,
	H5 = 5,
}

export class OrderMetaData {
	stationId?: string;
	stationName?: string;
	stationAddress?: string;
	vehicleId?: string;
	vehicleName?: string;
	vehicleNumberPlate?: string;
	startTime?: Date;
	estEndTime?: Date;
	endTime?: Date;
	clientType?: ClientType;
	shopId?: string;
	packageId?: string;
	packageSku?: string;
	packageName?: string;
}

export enum OrderTypeEnum {
	DEFAULT = "default",
	TOKENIZE = "tokenize",
	FNB = "fnb",
	PACKAGE = "package",
}

export enum ProductTypeEnum {
	WASHING = "washing",
	FNB = "fnb",
	PACKAGE = "package",
}

export enum WashMode {
	QUICK = 333,
	STANDARD = 329,
	PREMIUM = 330,
}

export enum WashStatus {
	START = "START",
	COMPLETE = "COMPLETE",
	ALARM = "ALARM",
	STOP = "STOP",
	REFUND = "REFUND",
}

export enum AlarmType {
	FAULT = 1,
	WARNING = 2,
}

export interface IAlarmItem {
	alarmType: AlarmType;
	alarmCode: string;
	alarmName: string;
	alarmDesc: string;
	alarmReason: string;
}

export class InvoicePackageDto {
	name: string;
	unit: string;
	total: number;
}

export class OrderItemMetaData {
	mode?: WashMode;
	modeId?: string;
	modeName?: string;
	deviceId?: string;
	deviceNo?: string;
	deviceName?: string;
	stationId?: string;
	stationName?: string;
	stationAddress?: string;
	lat?: number;
	lng?: number;
	washStatus?: WashStatus;
	startTime?: Date;
	estEndTime?: Date;
	endTime?: Date;
	alarmList?: IAlarmItem[];
	packageInvoiceInfo?: InvoicePackageDto[];
	photo?: string;
}

export class OrderItemDto extends AbstractDto {
	orderId: string;
	productId: string;
	productName: string;
	qty?: number;
	originPrice: number;
	price: number;
	discountAmount?: number;
	discountIds: string[];
	total: number;
	taxAmount?: number;
	productType?: ProductTypeEnum;
	data?: OrderItemMetaData;
	photo?: string;
}

export enum TransactionStatus {
	DRAFT = "draft",
	FAILED = "failed",
	PENDING = "pending",
	SUCCEEDED = "succeeded",
	CANCELED = "canceled",
	REFUNDED = "refunded",
}

export class OrderTransactionDto extends AbstractDto {
	orderId: string;
	transactionId: string;
	status: TransactionStatus;
	amount: number;
	paymentMethod?: PaymentMethod;
	paymentProvider?: PaymentProvider;
	data?: Record<string, string | Date | any>;
	incrementId: number;
}

export class OrderDto extends AbstractDto {
	incrementId: number;
	customerId?: string;
	customerName?: string;
	customerEmail?: string;
	customerPhone?: string;
	note?: string;
	subTotal?: number;
	grandTotal: number;
	itemQuantity: number;
	discountAmount: number;
	taxAmount?: number;
	status: OrderStatusEnum;
	discountIds: string[];
	paymentMethod: PaymentMethod;
	paymentProvider: PaymentProvider;
	data?: OrderMetaData;
	type?: OrderTypeEnum;
	extraFee?: number;
	orderItems: OrderItemDto[];
	orderTransactions: OrderTransactionDto[];
}
