import { NextRequest, NextResponse } from "next/server";
import {
	clientProtectedRoutes,
	clientPublicRoutes,
	kioskProtectedRoutes,
	kioskPublicRoutes,
	Routes,
} from "./libs/routes";
import {
	ensureClientSession,
	ensureKioskSession,
} from "./actions/auth/auth.action";

export default async function middleware(req: NextRequest) {
	const isNextAction = req.headers.get("Next-Action") && req.method === "POST";
	if (isNextAction) {
		return NextResponse.next(); // Skip middleware for API and server actions
	}

	const path = req.nextUrl.pathname;

	// Determine route type
	const isKioskProtectedRoute = kioskProtectedRoutes.includes(path);
	const isKioskPublicRoute = kioskPublicRoutes.includes(path);

	const isClientProtectedRoute = clientProtectedRoutes.includes(path);
	const isClientPublicRoute = clientPublicRoutes.includes(path);

	// Check sessions
	const [kioskSession, clientSession] = await Promise.all([
		ensureKioskSession(req),
		ensureClientSession(req),
	]);

	const isKioskSession = !!kioskSession.data;
	const isClientSession = !!clientSession.data;

	// Redirect if no session for protected routes
	if (isKioskProtectedRoute && !isKioskSession) {
		return NextResponse.redirect(new URL(Routes.Onboard, req.url));
	}

	if (isKioskPublicRoute && isKioskSession) {
		return NextResponse.redirect(new URL(Routes.Kiosk, req.url));
	}

	if (isClientProtectedRoute && !isClientSession) {
		return NextResponse.redirect(new URL(Routes.Home, req.url));
	}

	if (isClientPublicRoute && isClientSession) {
		return NextResponse.redirect(new URL(Routes.Client, req.url));
	}

	return NextResponse.next();
}

export const config = {
	// Match all pathnames except for
	// - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
	// - … the ones containing a dot (e.g. `favicon.ico`)
	matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
