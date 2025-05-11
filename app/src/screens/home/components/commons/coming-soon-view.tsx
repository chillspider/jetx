import { Text, useTheme } from '@rneui/themed';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@/components';

const ComingSoonView: React.FC = () => {
	const {
		theme: { colors },
	} = useTheme();

	const { t } = useTranslation();

	return (
		<Box
			px={8}
			py={4}
			borderRadius={20}
			backgroundColor={colors.red2}
			flexDirection="row"
			alignItems="center"
		>
			<Box width={5} height={5} borderRadius={5} backgroundColor={colors.red} mr={4} />
			<Text body2 style={{ color: colors.red }}>
				{t('coming_soon')}
			</Text>
		</Box>
	);
};

export default ComingSoonView;
