/* eslint-disable max-classes-per-file */
export class BBOrderTypeRequestDto {
	dineIn!: boolean;
	toGo!: boolean;
	orderDefault!: string;
}

export class BBShopSetting {
	isCountGuest?: boolean;
	hasTicketNumber?: boolean;
	isActive!: boolean;
	orderType!: BBOrderTypeRequestDto;
	isAlcoholDistribution!: boolean;
	payNow!: boolean;
	ipWhitelist?: string[];
	isCheckIpWhitelist?: boolean;
}

export class BBShopDto {
	id!: string;
	stateId!: string;
	cityId!: string;
	postalCode!: string;
	name!: string;
	orderingAddress!: string;
	phoneNumber!: string;
	setting?: BBShopSetting;
	country?: string;
	state?: string;
	city?: string;
	district?: string;
	ward?: string;
	// location!: Location;
	isPriceIncludedTax?: boolean;
	timeZone?: string;
}
