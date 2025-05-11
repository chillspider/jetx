import React from 'react';

import { StationDto } from '@/models/stations/station.dto';

import StationItemView from './station-item-view';

type Props = {
	onClose?: () => void;
	onOpenMap?: () => void;
	data?: StationDto | undefined;
};

const StationDetailView: React.FC<Props> = ({ onClose, data, onOpenMap }) => {
	if (!data) return <></>;
	return <StationItemView data={data} isDetail onClose={onClose} onOpenMap={onOpenMap} />;
};

export default StationDetailView;
