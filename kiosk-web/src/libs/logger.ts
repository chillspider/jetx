import pino from "pino";
import { isProduction } from "./helpers";

export const logger = pino({
	level: isProduction ? "info" : "debug",
	browser: {
		asObject: true,
		write: (o) => {
			console.log(JSON.stringify(o));
		},
	},
	// Configure for both environments without worker threads
	transport: {
		target: isProduction ? "pino" : "pino-pretty",
		options: {
			colorize: !isProduction,
			translateTime: "SYS:standard",
			ignore: "pid,hostname",
		},
	},
});
