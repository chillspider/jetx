export class Routes {
	static Home = "/";
	static Onboard = "/onboard";
	static Kiosk = "/kiosk";
	static KioskOrder = (id: string) => `/kiosk/order/${id}`;
	static Client = "/client";
	static ClientOrder = (sessionId: string, id: string) =>
		`/client/${sessionId}/${id}`;
}

export const kioskProtectedRoutes: string[] = [Routes.Kiosk];
export const kioskPublicRoutes: string[] = [Routes.Onboard];

export const clientProtectedRoutes: string[] = [Routes.Client];
export const clientPublicRoutes: string[] = [];
