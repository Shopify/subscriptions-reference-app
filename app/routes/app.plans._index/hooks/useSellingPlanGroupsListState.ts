import {useSearchParams} from '@remix-run/react';
import {useSetIndexFiltersMode, type IndexFiltersProps} from '@shopify/polaris';
import {useTranslation} from 'react-i18next';
import {clearPaginationParams} from '~/utils/pagination';
import {
  SORT_ORDER_PARAM,
  SellingPlanGroupsSortKey,
  getSortSelectedFromParam,
} from '../utilities';

export function useSellingPlanGroupsListState() {
  const {t} = useTranslation('app.plans');
  const [searchParams, setSearchParams] = useSearchParams();
  const sortSelected = getSortSelectedFromParam(
    searchParams.get(SORT_ORDER_PARAM) ?? '',
  );
  const {mode, setMode} = useSetIndexFiltersMode();

  const sortOptions: IndexFiltersProps['sortOptions'] = [
    {
      label: t(`table.sort.${SellingPlanGroupsSortKey.CREATED_AT}.label`),
      value: `${SellingPlanGroupsSortKey.CREATED_AT} asc`,
      directionLabel: t(
        `table.sort.${SellingPlanGroupsSortKey.CREATED_AT}.ascendingLabel`,
      ),
    },
    {
      label: t(`table.sort.${SellingPlanGroupsSortKey.CREATED_AT}.label`),
      value: `${SellingPlanGroupsSortKey.CREATED_AT} desc`,
      directionLabel: t(
        `table.sort.${SellingPlanGroupsSortKey.CREATED_AT}.descendingLabel`,
      ),
    },
    {
      label: t(`table.sort.${SellingPlanGroupsSortKey.UPDATED_AT}.label`),
      value: `${SellingPlanGroupsSortKey.UPDATED_AT} asc`,
      directionLabel: t(
        `table.sort.${SellingPlanGroupsSortKey.UPDATED_AT}.ascendingLabel`,
      ),
    },
    {
      label: t(`table.sort.${SellingPlanGroupsSortKey.UPDATED_AT}.label`),
      value: `${SellingPlanGroupsSortKey.UPDATED_AT} desc`,
      directionLabel: t(
        `table.sort.${SellingPlanGroupsSortKey.UPDATED_AT}.descendingLabel`,
      ),
    },
  ];

  const onSort = (value: string[]) => {
    setSearchParams((params) => {
      clearPaginationParams(params);
      params.set(SORT_ORDER_PARAM, value[0].toLowerCase());
      return params;
    });
  };

  return {
    sortSelected,
    onSort,
    sortOptions,
    mode,
    setMode,
  };
}
