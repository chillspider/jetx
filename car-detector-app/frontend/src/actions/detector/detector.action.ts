"use server";

import managementApi from "@/services/management/management.service";
import { actionClient } from "../safe-action";
import { z } from "zod";

export const getOrderByDeviceId = actionClient
	.schema(
		z.object({
			deviceId: z.string(),
		})
	)
	.action(async ({ parsedInput }) => {
		const res = await managementApi.getOrderByDeviceId(parsedInput.deviceId);
		return res?.data;
	});

const schemaCreateCarDetector = z.object({
	req: z.object({
		orderId: z.string(),
		deviceId: z.string(),
		customerId: z.string(),
		car: z.object({
			carType: z.string().optional(),
			color: z.string().optional(),
			brand: z.string().optional(),
			plateNumber: z.string().optional(),
		}),
	}),
	image: z.string(),
});

export const createCarDetector = actionClient
	.schema(schemaCreateCarDetector)
	.action(async ({ parsedInput }) => {
		const res = await managementApi.createCarDetector(
			parsedInput.req,
			parsedInput.image
		);
		return !!res?.data;
	});

const schemaAnalyzeCar = z.object({
	image: z.string(),
});

export const analyzeCar = actionClient
	.schema(schemaAnalyzeCar)
	.action(async ({ parsedInput }) => {
		const res = await managementApi.analyzeCar(parsedInput.image);
		return res?.data;
	});
