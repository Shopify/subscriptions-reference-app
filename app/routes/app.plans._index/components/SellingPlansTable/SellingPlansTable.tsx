import {useNavigate, useNavigation} from '@remix-run/react';
import {
  Card,
  IndexFilters,
  IndexTable,
  Text,
  useIndexResourceState,
} from '@shopify/polaris';

import {parseGid} from '@shopify/admin-graphql-api-utilities';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  useDeliveryFrequencyFormatter,
  usePricingPolicyFormatter,
  useProductCountFormatter,
} from '~/hooks';
import type {SellingPlanGroupListItem} from '~/types/plans';
import {useSellingPlanGroupsListState} from '../../hooks/useSellingPlanGroupsListState';
import {getSellingPlanGroupIds} from '../../utilities';
import styles from './SellingPlansTable.module.css';
import SellingPlanGroupsDeleteModal from '../SellingPlanGroupsDeleteModal/SellingPlanGroupsDeleteModal';

interface SellingPlanGroupsTableProps {
  sellingPlanGroups: SellingPlanGroupListItem[];
}

export default function SellingPlansTable({
  sellingPlanGroups,
}: SellingPlanGroupsTableProps) {
  const {sellingPlanDeliveryFrequencyText} = useDeliveryFrequencyFormatter();
  const pricingPolicyText = usePricingPolicyFormatter();
  const productCountText = useProductCountFormatter();
  const {t} = useTranslation('app.plans');
  const navigate = useNavigate();
  const {state} = useNavigation();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
    clearSelection,
  } = useIndexResourceState(getSellingPlanGroupIds(sellingPlanGroups));

  const {sortOptions, sortSelected, onSort, mode, setMode} =
    useSellingPlanGroupsListState();

  const sellingPlanGroupRowsMarkup = sellingPlanGroups.map(
    (
      {
        id,
        merchantCode,
        productsCount,
        productVariantsCount,
        products,
        sellingPlans,
        sellingPlansPageInfo,
      },
      index,
    ) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
        accessibilityLabel={id}
        onClick={() => navigate(`${parseGid(id)}`)}
      >
        <IndexTable.Cell className={`${styles.Underline} ${styles.Truncate}`}>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {merchantCode}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {productCountText(products, productsCount, productVariantsCount)}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {sellingPlanDeliveryFrequencyText(sellingPlans, sellingPlansPageInfo)}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {pricingPolicyText(sellingPlans, sellingPlansPageInfo)}
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <>
      <SellingPlanGroupsDeleteModal
        isDeleteModalVisible={isDeleteModalVisible}
        setIsDeleteModalVisible={setIsDeleteModalVisible}
        selectedResources={selectedResources}
        clearSelection={clearSelection}
      />
      <Card padding="0">
        <IndexFilters
          loading={state === 'loading'}
          tabs={[
            {
              id: 'all',
              content: t('table.headings.view'),
            },
          ]}
          selected={0}
          onSelect={() => {}}
          sortOptions={sortOptions}
          sortSelected={sortSelected}
          onSort={onSort}
          mode={mode}
          setMode={setMode}
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
          itemCount={sellingPlanGroups.length}
          selectedItemsCount={
            allResourcesSelected ? 'All' : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          selectable
          headings={[
            {title: t('table.headings.planTitle')},
            {title: t('table.headings.products')},
            {title: t('table.headings.deliveryFrequency')},
            {title: t('table.headings.discount')},
          ]}
          promotedBulkActions={[
            {
              content: t('table.bulkActions.delete', {
                count: selectedResources.length,
              }),
              onAction: () => setIsDeleteModalVisible(true),
            },
          ]}
        >
          {sellingPlanGroupRowsMarkup}
        </IndexTable>
      </Card>
    </>
  );
}
