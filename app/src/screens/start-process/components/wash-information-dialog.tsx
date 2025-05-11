import { makeStyles } from '@rneui/themed';
import { Modal, ModalProps, View } from 'react-native';

import { OrderDto } from '@/models/order/order.dto';

import OrderDetailView from './order-detail-view';

type Props = Partial<ModalProps> & {
	onClose?: () => void;
	order?: OrderDto | undefined;
	isVisible?: boolean;
};

const WashInformationDialog: React.FC<Props> = ({ onClose, isVisible, order, ...props }) => {
	const styles = useStyles();

	return (
		<View>
			<Modal
				{...props}
				animationType="fade"
				visible={isVisible}
				transparent
				onRequestClose={onClose}
			>
				<View style={styles.modal}>
					<OrderDetailView order={order} onClose={onClose} />
				</View>
			</Modal>
		</View>
	);
};

const useStyles = makeStyles(() => ({
	modal: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.3)',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 16,
	},
}));

export default WashInformationDialog;
