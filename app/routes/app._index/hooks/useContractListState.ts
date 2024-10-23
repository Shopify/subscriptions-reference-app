import {useLocation, useNavigation, useSearchParams} from '@remix-run/react';
import {
  useSetIndexFiltersMode,
  type IndexFiltersProps,
  type TabProps,
} from '@shopify/polaris';
import {useTranslation} from 'react-i18next';
import {clearPaginationParams} from '~/utils/pagination';
import {ContractsSortKey, SORT_ORDER_PARAM} from '../utilities';

const INVENTORY_ERROR_KEY = 'inventoryError';
const TAB_KEYS = ['all', 'active', 'paused', 'cancelled', INVENTORY_ERROR_KEY];
const SAVED_VIEW_PARAM = 'savedView';

function getTabIndexFromParam(param: string): number {
  if (!param) return 0;

  return TAB_KEYS.indexOf(param);
}

function getSortSelectedFromParam(param: string | null): string[] {
  const defaultSort = `${ContractsSortKey.CREATED_AT} desc`;
  if (!param) return [defaultSort];
  const [sortKeyParam, sortDirectionParam] = param.split(' ');

  const sortKeyValid =
    sortKeyParam &&
    Object.values(ContractsSortKey).some((key) => key === sortKeyParam);

  const sortDirectionValid =
    sortDirectionParam && ['asc', 'desc'].includes(sortDirectionParam);

  return sortKeyValid && sortDirectionValid ? [param] : [defaultSort];
}

export function useContractListState(hasContractsWithInventoryError: boolean) {
  const {t} = useTranslation('app.contracts');
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const {state, location: navigationLocation} = useNavigation();
  const {mode, setMode} = useSetIndexFiltersMode();

  const selectedTab = getTabIndexFromParam(
    searchParams.get(SAVED_VIEW_PARAM) ?? '',
  );

  const sortOptions: IndexFiltersProps['sortOptions'] = [
    {
      label: t('table.sort.sortByPurchasedDateLabel'),
      value: `${ContractsSortKey.CREATED_AT} asc`,
      directionLabel: t('table.sort.oldestFirstDirectionLabel'),
    },
    {
      label: t('table.sort.sortByPurchasedDateLabel'),
      value: `${ContractsSortKey.CREATED_AT} desc`,
      directionLabel: t('table.sort.newestFirstDirectionLabel'),
    },
    {
      label: t('table.sort.sortByUpdatedDateLabel'),
      value: `${ContractsSortKey.UPDATED_AT} asc`,
      directionLabel: t('table.sort.oldestFirstDirectionLabel'),
    },
    {
      label: t('table.sort.sortByUpdatedDateLabel'),
      value: `${ContractsSortKey.UPDATED_AT} desc`,
      directionLabel: t('table.sort.newestFirstDirectionLabel'),
    },
  ];

  const sortSelected = getSortSelectedFromParam(
    searchParams.get(SORT_ORDER_PARAM),
  );

  function onSort(value: string[]) {
    // Keep existing url params for filtering, but clear pagination params
    setSearchParams((params) => {
      clearPaginationParams(params);
      params.set(SORT_ORDER_PARAM, value[0].toLowerCase());
      return params;
    });
  }

  const listLoading =
    state === 'loading' && location.pathname === navigationLocation?.pathname;

  const filteredTabs = TAB_KEYS.filter((key) => {
    if (key == INVENTORY_ERROR_KEY && !hasContractsWithInventoryError) {
      return false;
    }
    return true;
  });

  const tabs: TabProps[] = filteredTabs.map((key) => {
    return {
      id: key,
      content: t(`table.tabs.${key}`),
    };
  });

  function handleTabSelect(tabIndex: number) {
    setSearchParams((params) => {
      clearPaginationParams(params);

      if (tabIndex !== 0) {
        params.set(SAVED_VIEW_PARAM, tabs[tabIndex].id);
      } else {
        // Clear the saved view param if we're on the "all" tab
        params.delete(SAVED_VIEW_PARAM);
      }

      return params;
    });
  }

  return {
    filtersMode: mode,
    setFiltersMode: setMode,
    tabs,
    selectedTab,
    selectedTabKey: tabs[selectedTab].id,
    handleTabSelect,
    listLoading,
    sortOptions,
    sortSelected,
    onSort,
  };
}
