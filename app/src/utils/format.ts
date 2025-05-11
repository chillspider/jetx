export const displayPrice = (price = 0, currencySymbol = 'VND'): string => {
	return `${price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ${currencySymbol}`;
};
