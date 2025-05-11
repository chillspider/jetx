/* eslint-disable react-native/no-inline-styles */
import { Text } from '@rneui/themed';
import React from 'react';

type Props = {
	content: string;
	onLinkPress?: (url: string) => void;
};
const urlRegex = /(https?:\/\/[^\s]+)/g;

const FeedbackTextRender: React.FC<Props> = ({ content, onLinkPress }) => {
	const parts = content.split(urlRegex);

	return (
		<Text body2 selectable>
			{parts.map((part, index) => {
				if (urlRegex.test(part)) {
					return (
						<Text
							body2
							key={index}
							style={{ color: 'blue', textDecorationLine: 'underline' }}
							onPress={() => {
								onLinkPress?.(part);
							}}
						>
							{part}
						</Text>
					);
				}
				return part;
			})}
		</Text>
	);
};

export default FeedbackTextRender;
