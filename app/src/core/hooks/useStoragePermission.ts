import { PermissionsAndroid, Platform } from 'react-native';

export async function hasAndroidPermission() {
	if (Platform.OS === 'ios') {
		return true;
	}

	const getCheckPermissionPromise = async () => {
		if (Number(Platform.Version) >= 33) {
			const [hasReadMediaImagesPermission, hasReadMediaVideoPermission] = await Promise.all([
				PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES),
				PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO),
			]);
			return hasReadMediaImagesPermission && hasReadMediaVideoPermission;
		}
		return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
	};

	const hasPermission = await getCheckPermissionPromise();

	if (hasPermission) {
		return true;
	}

	const getRequestPermissionPromise = async () => {
		if (Number(Platform.Version) >= 33) {
			const statuses = await PermissionsAndroid.requestMultiple([
				PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
				PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
			]);
			return (
				statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] ===
					PermissionsAndroid.RESULTS.GRANTED &&
				statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] ===
					PermissionsAndroid.RESULTS.GRANTED
			);
		}
		const status = await PermissionsAndroid.request(
			PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
		);
		return status === PermissionsAndroid.RESULTS.GRANTED;
	};

	return getRequestPermissionPromise();
}
