/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserDto } from "@/models/user.dto";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const formatUserName = (user: UserDto) => {
	return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
};

export const extractFirstChars = (name: string): string => {
	if (!name.trim()) return ""; // Handle empty or whitespace-only input

	const nameArray = name.trim().split(/\s+/); // Split by spaces and remove empty parts

	return nameArray
		.slice(0, 2)
		.map((word) => word.charAt(0))
		.join("")
		.toUpperCase();
};

// Function to convert base64 to Blob with PNG content type
export const base64ToBlob = (
	base64String: string,
	contentType = "image/png"
) => {
	// Remove data URL prefix if it exists (e.g., "data:image/png;base64,")
	const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");

	// Convert base64 to binary
	const byteCharacters = atob(base64Data);
	const byteNumbers = new Array(byteCharacters.length);

	for (let i = 0; i < byteCharacters.length; i++) {
		byteNumbers[i] = byteCharacters.charCodeAt(i);
	}

	const byteArray = new Uint8Array(byteNumbers);
	return new Blob([byteArray], { type: contentType });
};

export const objectToFormData = (obj: Record<string, any>): FormData => {
	const formData = new FormData();
	buildFormData(formData, obj, "");
	return formData;
};

// Helper function to recursively build the FormData
function buildFormData(formData: FormData, obj: any, prefix: string) {
	// Skip null or undefined values
	if (obj === null || obj === undefined) {
		return;
	}

	// Handle Blob (includes File, since File extends Blob)
	if (obj instanceof Blob) {
		formData.append(prefix, obj);
	}
	// Handle arrays
	else if (Array.isArray(obj)) {
		obj.forEach((item, index) => {
			buildFormData(formData, item, `${prefix}[${index}]`);
		});
	}
	// Handle nested objects
	else if (typeof obj === "object") {
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				// Build the key prefix: top-level keys stand alone, nested keys use bracket notation
				const newPrefix = prefix ? `${prefix}[${key}]` : key;
				buildFormData(formData, obj[key], newPrefix);
			}
		}
	}
	// Handle primitive values (string, number, boolean)
	else {
		formData.append(prefix, String(obj));
	}
}
