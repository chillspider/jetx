import { OrderStatusEnum } from "@/models/order.dto";
import { isBrowser } from "@/utils/ssr";
import { env } from "next-runtime-env";

export function isNumber(value: unknown): value is number {
	return typeof value === "number" && !isNaN(value);
}

export function formatCountdownTime(seconds: number) {
	const minutes = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function safeJsonParse<T>(value: string): T | null {
	try {
		return JSON.parse(value);
	} catch (_) {
		return null;
	}
}

export function formatCurrency(value: number) {
	return new Intl.NumberFormat("vi-VN", {
		style: "currency",
		currency: "VND",
	}).format(value);
}

export function isOrderFinalized(status: OrderStatusEnum) {
	return [
		OrderStatusEnum.COMPLETED,
		OrderStatusEnum.CANCELED,
		OrderStatusEnum.FAILED,
		OrderStatusEnum.REFUNDED,
		OrderStatusEnum.ABNORMAL_STOP,
		OrderStatusEnum.SELF_STOP,
		OrderStatusEnum.REJECTED,
		OrderStatusEnum.UNKNOWN,
	].includes(status);
}

export const OrderStatusHelper: Record<
	OrderStatusEnum,
	{ message: string; isError: boolean }
> = {
	[OrderStatusEnum.DRAFT]: {
		message:
			"Mở ứng dụng ngân hàng hoặc Ví quét mã QR trên máy kiosk để thanh toán",
		isError: false,
	},
	[OrderStatusEnum.PENDING]: {
		message: "Đang chờ bật máy...",
		isError: false,
	},
	[OrderStatusEnum.PROCESSING]: {
		message: "Đang rửa...",
		isError: false,
	},
	[OrderStatusEnum.COMPLETED]: {
		message: "Đã rửa xong",
		isError: false,
	},
	[OrderStatusEnum.CANCELED]: {
		message: "Đã bị huỷ",
		isError: true,
	},
	[OrderStatusEnum.FAILED]: {
		message: "Đã thất bại",
		isError: true,
	},
	[OrderStatusEnum.REFUNDED]: {
		message: "Đã hoàn tiền",
		isError: true,
	},
	[OrderStatusEnum.ABNORMAL_STOP]: {
		message: "Đã gặp sự cố",
		isError: true,
	},
	[OrderStatusEnum.SELF_STOP]: {
		message: "Đã tự dừng",
		isError: true,
	},
	[OrderStatusEnum.REJECTED]: {
		message: "Đã bị từ chối",
		isError: true,
	},
	[OrderStatusEnum.UNKNOWN]: {
		message: "Không xác định",
		isError: true,
	},
};

export function createQRCodeUrl(data: string) {
	if (!data || data.startsWith("http")) return data;

	let baseUrl = "";

	if (!isBrowser) {
		baseUrl = env("NEXT_PUBLIC_BASE_URL");
	} else {
		baseUrl = window.location.origin;
	}

	return `${baseUrl}/client/${data}`;
}

export const isProduction = env("NEXT_PUBLIC_ENV") === "production";
