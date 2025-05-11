"use server";

/**
 * Encrypts the given data using the Web Crypto API.
 */
export async function encrypt(data: string, secret: string): Promise<string> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret.padEnd(32, "0").slice(0, 32)), // Ensure 32 bytes
		{ name: "AES-GCM" },
		false,
		["encrypt"]
	);
	const iv = crypto.getRandomValues(new Uint8Array(12)); // 12-byte IV for AES-GCM
	const encrypted = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		key,
		encoder.encode(data)
	);
	return JSON.stringify({
		iv: Array.from(iv),
		encrypted: Buffer.from(encrypted).toString("base64"),
	});
}

/**
 * Decrypts the given data using the Web Crypto API.
 */
export async function decrypt<T>(data: string, secret: string): Promise<T> {
	const { iv, encrypted } = JSON.parse(data);
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret.padEnd(32, "0").slice(0, 32)), // Ensure 32 bytes
		{ name: "AES-GCM" },
		false,
		["decrypt"]
	);
	const decrypted = await crypto.subtle.decrypt(
		{ name: "AES-GCM", iv: new Uint8Array(iv) },
		key,
		Buffer.from(encrypted, "base64")
	);
	return JSON.parse(new TextDecoder().decode(decrypted)) as T;
}
