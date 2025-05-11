import { zodResolver } from '@hookform/resolvers/zod';
import { Button, makeStyles, Text } from '@rneui/themed';
import { isNil } from 'ramda';
import React, { useMemo, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import * as z from 'zod';

import { Box } from '@/components';
import { PickerImage } from '@/components/image-picker/image-picker';
import { ControlledMultiImagePicker } from '@/components/image-picker/multi-image-picker';
import ControlledInput from '@/components/input/controlled-input';
import { useOrderHistory } from '@/core/hooks/useOrderHistory';
import { useAuth } from '@/core/store/auth';
import { OrderDto } from '@/models/order/order.dto';

import { ControlledOrderSelect } from '../components/order-controlled-select';
import { useCreateSupport } from '../hooks/createSupport';

const schema = z.object({
	name: z.string().min(1),
	email: z.string().email(),
	phone: z.string().optional(),
	order: z.string().optional(),
	title: z.string().optional(),
	content: z.string().min(1),
	images: z.array(z.string()).optional(),
});

export type FormType = z.infer<typeof schema>;

type Props = {
	jumpToHistoryTab?: () => void;
};

const CreateSupportTicketScreen: React.FC<Props> = ({ jumpToHistoryTab }) => {
	const [images, setImages] = useState<PickerImage[]>([]);
	const { t } = useTranslation();
	const { user } = useAuth();

	const { handleSubmit, control, formState, reset } = useForm<FormType>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: user?.fullName ?? '',
			email: user?.email,
			phone: user?.phone ?? '',
		},
	});

	const {
		data: orderPages,
		fetchNextPage,
		hasNextPage,
	} = useOrderHistory({
		variables: {
			pageSize: 50,
			pageIndex: 1,
			order: 'DESC',
		},
	});

	const orders = useMemo<OrderDto[]>(() => {
		return orderPages?.pages.flatMap(page => page.data || []) ?? [];
	}, [orderPages]);

	const { bottom } = useSafeAreaInsets();

	const styles = useStyles();

	const mutation = useCreateSupport({
		onError: () => {
			Toast.show({
				type: 'error',
				text1: t('notificationTitle'),
				text2: t('networkError'),
			});
		},
		onSuccess: () => {
			Toast.show({
				type: 'success',
				text1: t('notificationTitle'),
				text2: t('support.requestSuccess'),
			});

			jumpToHistoryTab?.();
			reset();
			setImages([]);
		},
	});

	const onSubmit: SubmitHandler<FormType> = data => {
		mutation.mutate({
			customerEmail: data.email,
			customerName: data.name,
			customerPhone: data.phone,
			orderId: data.order,
			title: data.title,
			content: data.content,
			images,
		});
	};

	if (isNil(user)) {
		return <Box />;
	}

	return (
		<View style={styles.container}>
			<KeyboardAwareScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				<ControlledInput
					control={control}
					name="name"
					placeholder={t('support.namePlaceholder')}
					label={`${t('support.name')}*`}
				/>
				<Box height={4} />
				<ControlledInput
					control={control}
					name="email"
					readOnly
					disabled
					placeholder={t('support.emailPlaceholder')}
					label={`${t('support.email')}*`}
					keyboardType="email-address"
				/>
				<Box height={4} />
				<ControlledInput
					control={control}
					name="phone"
					placeholder={t('support.phoneNumberPlaceholder')}
					label={`${t('support.phoneNumber')}`}
					keyboardType="phone-pad"
				/>
				<Box height={4} />
				<ControlledOrderSelect
					control={control}
					name="order"
					label={t('support.orderNumber')}
					placeholder={t('support.orderNumberPlaceholder')}
					orders={orders}
					onEndReached={() => {
						if (hasNextPage) {
							fetchNextPage();
						}
					}}
				/>
				<Box height={4} />
				<ControlledInput
					control={control}
					name="title"
					placeholder={t('support.titlePlaceholder')}
					label={t('support.titleInput')}
				/>
				<Box height={4} />
				<ControlledInput
					control={control}
					name="content"
					placeholder={t('support.contentPlaceholder')}
					label={`${t('support.content')}*`}
					multiline
					numberOfLines={5}
					style={styles.contentInput}
				/>
				<Box height={24} />
				<Text>{t('support.image')}</Text>
				<Box height={8} />
				<ControlledMultiImagePicker
					control={control}
					name="images"
					images={images}
					maxLength={5}
					itemSize={{ width: 114, height: 114 }}
					onChanged={s => {
						setImages(s);
					}}
				/>

				<Box height={36} />
			</KeyboardAwareScrollView>
			<View style={[styles.bottomView, { paddingBottom: bottom + 12 }]}>
				<Button
					title={t('support.sent')}
					onPress={handleSubmit(onSubmit)}
					disabled={mutation.isPending || !formState.isValid}
					loading={mutation.isPending}
				/>
			</View>
		</View>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	container: {
		flex: 1,
	},
	bottomView: {
		backgroundColor: colors.white,
		paddingHorizontal: 16,
		paddingTop: 8,
	},
	contentInput: {
		height: 150,
	},
}));

export default CreateSupportTicketScreen;
