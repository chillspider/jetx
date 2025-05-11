import { NextRequest, NextResponse } from "next/server";
import { authRoutes, publicRoutes, Routes } from "./lib/routes";
import { updateSession } from "./actions/auth/auth.action";

export default async function middleware(req: NextRequest) {
	const path = req.nextUrl.pathname;
	const isPublicRoute = publicRoutes.includes(path);
	const isAuthRoute = authRoutes.includes(path);

	const session = await updateSession(req);

	if (session && isAuthRoute) {
		return NextResponse.redirect(new URL(Routes.Home, req.nextUrl));
	}

	if (!isPublicRoute && !session) {
		return NextResponse.redirect(new URL(Routes.Login, req.nextUrl));
	}

	return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
	matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
