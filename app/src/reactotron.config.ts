/* eslint-disable @typescript-eslint/no-unsafe-call */
import reactotronZustand from 'reactotron-plugin-zustand';
import Reactotron, { ReactotronReactNative } from 'reactotron-react-native';
import mmkvPlugin from 'reactotron-react-native-mmkv';
import { QueryClientManager, reactotronReactQuery } from 'reactotron-react-query';

import config from '../app.json';
import { queryClient } from './app';
import { storage } from './core/storage';
import { useAuth } from './core/store/auth';
import { useAppSetting } from './core/store/setting';

const queryClientManager = new QueryClientManager({
	queryClient,
});

Reactotron.configure({
	name: config.name,
	onDisconnect: () => {
		queryClientManager.unsubscribe();
	},
})
	.useReactNative()
	.use(mmkvPlugin<ReactotronReactNative>({ storage }))
	.use(
		reactotronZustand({
			stores: [
				{
					name: 'auth',
					store: useAuth,
				},
				{
					name: 'setting',
					store: useAppSetting,
				},
			],
		}),
	)
	.use(reactotronReactQuery(queryClientManager))
	.connect();
