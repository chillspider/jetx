/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/naming-convention */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { createSelectors } from '@/core/utils';

interface SettingState {
	policyUrl: string;
	companyInfoUrl: string;
	newsUrl: string;
	warrantyPolicyUrl: string;
	privacyPolicyUrl: string;
	refundPolicyUrl: string;
	generalRegulationsUrl: string;
	inspectionPolicyUrl: string;
	shippingPolicyUrl: string;
	productInfoUrl: string;
	transactionConditionsUrl: string;
	paymentPolicyUrl: string;
}

const _useSetting = create<SettingState>()(
	immer<SettingState>((set, get) => ({
		policyUrl: 'https://www.wash24h.com/dieu-khoan-chinh-sach',
		companyInfoUrl: 'https://www.wash24h.com/thong-tin-cong-ty',
		newsUrl: 'https://www.wash24h.com/tin-tuc',

		//!
		warrantyPolicyUrl: 'https://www.wash24h.com/chinh-sach-bao-hanh',
		privacyPolicyUrl: 'https://www.wash24h.com/chinh-sach-bao-mat-thong-tin',
		refundPolicyUrl: 'https://www.wash24h.com/chinh-sach-doi-tra-hoan-tien',
		generalRegulationsUrl: 'https://www.wash24h.com/chinh-sach-hoat-dong-quy-dinh-chung',
		inspectionPolicyUrl: 'https://www.wash24h.com/chinh-sach-kiem-hang',
		shippingPolicyUrl: 'https://www.wash24h.com/chinh-sach-van-chuyen',
		productInfoUrl: 'https://www.wash24h.com/thong-tin-san-pham',
		transactionConditionsUrl: 'https://www.wash24h.com/thong-tin-ve-dieu-kien-giao-dich-chung',
		paymentPolicyUrl: 'https://www.wash24h.com/quy-dinh-va-hinh-thuc-thanh-toan',
	})),
);

export const useAppSetting = createSelectors(_useSetting);
