/* eslint-disable simple-import-sort/imports */
import { AxiosError } from 'axios';
import { createInfiniteQuery, createQuery } from 'react-query-kit';

import { PaginationResponseDto } from '@/models/commons/pagination-response.dto';
import { StationListRequestDto } from '@/models/stations/station-list-request';
import { StationDto } from '@/models/stations/station.dto';
import stationApi from '@/services/station/station-services';

type Response = PaginationResponseDto<StationDto>;
type Variables = StationListRequestDto;

export const useStations = createInfiniteQuery<Response, Variables, AxiosError>({
	queryKey: ['stations'],
	fetcher: async (variables, { pageParam }): Promise<Response> => {
		const res = await stationApi.getStations({
			...variables,
			pageIndex: pageParam,
		});
		return res.data;
	},
	getNextPageParam: lastPage => (lastPage.hasNextPage ? lastPage.pageIndex! + 1 : undefined),
	initialPageParam: 1,
});

export const useStation = createQuery<StationDto, string, AxiosError>({
	queryKey: ['station'],
	fetcher: async (id): Promise<StationDto> => {
		const res = await stationApi.getStation(id);
		return res.data;
	},
});
