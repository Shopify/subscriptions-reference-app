import {useNavigate} from '@remix-run/react';
import {parseGid} from '@shopify/admin-graphql-api-utilities';
import {
  EmptySearchResult,
  IndexFilters,
  IndexTable,
  Text,
} from '@shopify/polaris';
import type {SelectionType} from '@shopify/polaris/build/ts/src/utilities/use-index-resource-state';
import {useTranslation} from 'react-i18next';
import {StatusBadge} from '~/components';
import {useDeliveryFrequencyFormatter, useProductCountFormatter} from '~/hooks';
import type {SubscriptionContractListItem} from '~/types/contracts';
import {useContractListState} from '../../hooks/useContractListState';
import styles from './ContractsTable.module.css';
import { formatStatus } from '~/utils/helpers/contracts';
import {formatPrice} from '~/utils/helpers/money';

export interface ContractsTableProps {
  contracts: SubscriptionContractListItem[];
  selectedResources: string[];
  allResourcesSelected: boolean;
  handleSelectionChange: (
    selectionType: SelectionType,
    isSelecting: boolean,
    selection?: string | [number, number],
  ) => void;
  }

export function ContractsTable({
  contracts,
  selectedResources,
  allResourcesSelected,
  handleSelectionChange,
  }: ContractsTableProps) {
  const {t, i18n} = useTranslation('app.contracts');
  const locale = i18n.language;
  const navigate = useNavigate();
  const productCountFormatter = useProductCountFormatter();
  const {deliveryFrequencyText} = useDeliveryFrequencyFormatter();

  const {
    filtersMode,
    setFiltersMode,
    selectedTab,
    selectedTabKey,
    handleTabSelect,
    tabs,
    listLoading,
    sortOptions,
    onSort,
    sortSelected,
  } = useContractListState();

  
  const emptyStateMarkup = (
    <EmptySearchResult
      title={t('table.emptyState.title')}
      description={t('table.emptyState.description', {
        status: t(`table.tabs.${selectedTabKey}`),
      })}
      withIllustration
    />
  );

  const contractRowsMarkup = contracts?.map((contract, index) => (
    <IndexTable.Row
      key={contract.id}
      id={contract.id}
      position={index}
      selected={selectedResources.includes(contract.id)}
      onClick={() => navigate(`/app/contracts/${parseGid(contract.id)}`)}
    >
      <IndexTable.Cell className={styles.Underline}>
        <Text fontWeight="bold" as="span">
          {parseGid(contract.id)}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>{contract.customer?.displayName}</IndexTable.Cell>
      <IndexTable.Cell>
        {productCountFormatter(contract.lines, contract.lineCount)}
      </IndexTable.Cell>
      <IndexTable.Cell>
        {formatPrice({
          amount: contract.totalPrice?.amount,
          currency: contract.totalPrice?.currencyCode,
          locale,
        })}
      </IndexTable.Cell>
      <IndexTable.Cell>
        {deliveryFrequencyText(contract.deliveryPolicy)}
      </IndexTable.Cell>
      <IndexTable.Cell>
        <StatusBadge status={formatStatus(contract.status)} />
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <>
      <IndexFilters
        loading={listLoading}
        tabs={tabs}
        selected={selectedTab}
        onSelect={(selectedTabIndex) => handleTabSelect(selectedTabIndex)}
        mode={filtersMode}
        setMode={setFiltersMode}
        sortOptions={sortOptions}
        onSort={onSort}
        sortSelected={sortSelected}
        onQueryChange={() => {}}
        onQueryClear={() => {}}
        cancelAction={{
          onAction: () => {},
          disabled: false,
          loading: false,
        }}
        canCreateNewView={false}
        filters={[]}
        onClearAll={() => {}}
        hideFilters
        hideQueryField
      />
      <IndexTable
        resourceName={{
          singular: t('table.resourceName.singular'),
          plural: t('table.resourceName.plural'),
        }}
        itemCount={contracts?.length}
        headings={[
          {title: t('table.headings.contract')},
          {title: t('table.headings.customer')},
          {title: t('table.headings.product')},
          {title: t('table.headings.price')},
          {title: t('table.headings.deliveryFrequency')},
          {title: t('table.headings.status')},
        ]}
        selectedItemsCount={
          allResourcesSelected ? 'All' : selectedResources.length
        }
        onSelectionChange={handleSelectionChange}
        emptyState={emptyStateMarkup}
              >
        {contractRowsMarkup}
      </IndexTable>
    </>
  );
}