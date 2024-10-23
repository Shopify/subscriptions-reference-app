import {useNavigation, useSearchParams} from '@remix-run/react';
import {BlockStack, Box, InlineStack, Pagination} from '@shopify/polaris';
import {useEffect} from 'react';
import type {PaginationInfo} from '~/types';

interface TablePaginationProps {
  pagination: PaginationInfo;
}

export function TablePagination({pagination}: TablePaginationProps) {
  const [, setSearchParams] = useSearchParams();
  const {state} = useNavigation();

  useEffect(() => {
    if (state !== 'loading') {
      window.shopify.loading(false);
    }
  }, [state]);

  function handleNextPage() {
    const {startCursor, endCursor} = pagination;

    if (startCursor) {
      window.shopify.loading(true);
      setSearchParams((previousParams) => {
        previousParams.delete('before');
        previousParams.set('after', endCursor);

        return previousParams;
      });
    }
  }

  function handlePreviousPage() {
    const {startCursor, endCursor} = pagination;

    if (endCursor) {
      window.shopify.loading(true);
      setSearchParams((previousParams) => {
        previousParams.delete('after');
        previousParams.set('before', startCursor);

        return previousParams;
      });
    }
  }

  return (
    <InlineStack gap="400" align="center">
      <Box padding="400">
        <BlockStack gap="200" align="center">
          <Pagination
            hasPrevious={pagination.hasPreviousPage && state !== 'loading'}
            onPrevious={handlePreviousPage}
            hasNext={pagination.hasNextPage && state !== 'loading'}
            onNext={handleNextPage}
            accessibilityLabels={{previous: 'Previous', next: 'Next'}}
          />
        </BlockStack>
      </Box>
    </InlineStack>
  );
}
