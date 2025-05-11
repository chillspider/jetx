import { useQueryClient } from '@tanstack/react-query';
import { head, isNotEmpty, isNotNil } from 'ramda';
import {
	createContext,
	PropsWithChildren,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react';

import { usePaymentMethod } from '@/core/hooks/start-process/usePaymentMethod';
import { BBCategoryDto } from '@/models/bitebolt/bb-category.dto';
import { BBProductDto } from '@/models/bitebolt/bb-product.dto';
import { OrderDto } from '@/models/order/order.dto';
import { PaymentMethodModel } from '@/models/payment/payment-method-model';
import { StationDto } from '@/models/stations/station.dto';

import { useCategories, useProducts } from '../hooks/useFnbOrders';

type FnbOrderItem = {
	product: BBProductDto;
	quantity: number;
};

type FnbOrderContextType = {
	products: BBProductDto[];
	categories: BBCategoryDto[];
	shopId?: string | undefined;
	categoryId?: string | undefined;
	filter?: string | undefined;
	items: FnbOrderItem[];
	order?: OrderDto | undefined;
	station?: StationDto | undefined;
	paymentMethods: PaymentMethodModel[];
	washOrderId?: string | undefined;
	method?: PaymentMethodModel | undefined;

	setCategoryId: (categoryId: string | undefined) => void;
	setFilter: (filter: string | undefined) => void;
	setShopId: (shopId: string) => void;
	addItem: (product: BBProductDto) => void;
	removeItem: (product: BBProductDto) => void;
	removeAllItems: () => void;
	minusItem: (product: BBProductDto) => void;
	setOrder: (order: OrderDto) => void;
	setStation: (station: StationDto) => void;
	setWashOrderId: (washOrderId: string | undefined) => void;
	setPaymentMethod: (method: PaymentMethodModel) => void;
	reset: () => void;
};

export const FnbOrderContext = createContext<FnbOrderContextType | string>(
	'useFnbOrderContext should be used inside FnbOrderProvider',
);

export const FnbOrderProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const queryClient = useQueryClient();

	const [shopId, setShopId] = useState<string | undefined>(undefined);
	const [filter, setFilter] = useState<string | undefined>(undefined);
	const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
	const [order, setOrder] = useState<OrderDto | undefined>(undefined);
	const [station, setStation] = useState<StationDto | undefined>(undefined);
	const [items, setItems] = useState<FnbOrderItem[]>([]);
	const [method, setPaymentMethod] = useState<PaymentMethodModel>();
	const [washOrderId, setWashOrderId] = useState<string | undefined>(undefined);

	const { data: methods, refetch: refetchPaymentMethods } = usePaymentMethod({
		variables: { type: 'fnb' },
		enabled: false,
	});

	const { data, refetch: refetchProducts } = useProducts({
		variables: { shopId: shopId || '', filter, categoryId },
		enabled: false,
	});

	const { data: categories, refetch: refetchCategories } = useCategories({
		variables: shopId || '',
		enabled: false,
	});

	useEffect(() => {
		if (isNotNil(methods) && isNotEmpty(methods)) {
			const defaultMethod = methods.find(e => e.isDefault === true);
			setPaymentMethod(defaultMethod || head(methods));
		}
	}, [methods]);

	useEffect(() => {
		if (isNotNil(shopId) && isNotEmpty(shopId)) {
			refetchProducts();
			refetchCategories();
			refetchPaymentMethods();
		}
	}, [refetchProducts, refetchCategories, shopId, refetchPaymentMethods]);

	useEffect(() => {
		if (isNotNil(shopId) && isNotEmpty(shopId)) {
			refetchProducts();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [categoryId, filter, refetchProducts]);

	const updateShopId = useCallback(
		(id: string) => {
			if (id === shopId) return;
			setShopId(id);
		},
		[shopId],
	);

	const addItem = useCallback((product: BBProductDto) => {
		setItems(prevItems => {
			const existingItem = prevItems.find(item => item.product.id === product.id);
			if (existingItem) {
				return prevItems.map(item =>
					item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
				);
			}
			return [...prevItems, { product, quantity: 1 }];
		});
	}, []);

	const minusItem = useCallback((product: BBProductDto) => {
		setItems(prevItems => {
			const existingItem = prevItems.find(item => item.product.id === product.id);
			if (!existingItem) return prevItems;

			if (existingItem.quantity === 1) {
				return prevItems.filter(item => item.product.id !== product.id);
			}

			return prevItems.map(item =>
				item.product.id === product.id ? { ...item, quantity: item.quantity - 1 } : item,
			);
		});
	}, []);

	const removeItem = useCallback((product: BBProductDto) => {
		setItems(prevItems => prevItems.filter(item => item.product.id !== product.id));
	}, []);

	const removeAllItems = useCallback(() => {
		setItems([]);
	}, []);

	const reset = useCallback(() => {
		setShopId(undefined);
		setFilter(undefined);
		setCategoryId(undefined);
		setItems([]);
		setOrder(undefined);
		setStation(undefined);
		setWashOrderId(undefined);

		queryClient.removeQueries({ queryKey: ['bb-products'] });
	}, [queryClient]);

	const value: FnbOrderContextType = {
		products: data || [],
		categories: categories || [],
		shopId,
		filter,
		categoryId,
		items,
		order,
		station,
		paymentMethods: methods || [],
		method,
		washOrderId,
		setWashOrderId,
		setPaymentMethod,
		setOrder,
		setStation,
		setShopId: updateShopId,
		setFilter,
		setCategoryId,
		addItem,
		removeItem,
		removeAllItems,
		minusItem,
		reset,
	};

	return <FnbOrderContext.Provider {...{ value, children }} />;
};

export const useFnbOrderContext = () => {
	const c = useContext(FnbOrderContext);

	if (typeof c === 'string') {
		throw Error(c);
	}

	return c;
};
