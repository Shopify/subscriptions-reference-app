import {mountComponentWithRemixStub} from '#/test-utils';
import {useSearchParams} from '@remix-run/react';
import {screen} from '@testing-library/react';
import type {ReactElement} from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {TablePagination} from './TablePagination';

/* Mock shopify AppBridge object on the window property */
const shopifyMock = {
  loading: vi.fn(),
};

vi.stubGlobal('shopify', shopifyMock);

function RenderSearchParams() {
  const [searchParams] = useSearchParams();

  return <span>{searchParams.toString()}</span>;
}

function mountWithSearchParams(component: ReactElement) {
  return mountComponentWithRemixStub(
    <>
      <RenderSearchParams />
      {component}
    </>,
  );
}

describe('TablePagination', () => {
  const pagination = {
    hasNextPage: true,
    hasPreviousPage: false,
    startCursor: 'start',
    endCursor: 'end',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the pagination controls', async () => {
    mountWithSearchParams(<TablePagination pagination={pagination} />);

    expect(screen.getByLabelText('Previous')).toBeInTheDocument();
    expect(screen.getByLabelText('Next')).toBeInTheDocument();
  });

  it('updates search params when calling clicking previous and next buttons', async () => {
    mountWithSearchParams(
      <TablePagination
        pagination={{
          hasNextPage: true,
          hasPreviousPage: true,
          startCursor: 'start',
          endCursor: 'end',
        }}
      />,
    );

    screen.getByLabelText('Next').click();
    expect(await screen.findByText('after=end')).toBeInTheDocument();

    screen.getByLabelText('Previous').click();
    expect(await screen.findByText('before=start')).toBeInTheDocument();

    // check that after param is no longer present
    expect(screen.queryByText('after=')).not.toBeInTheDocument();

    // check that before param is cleared when clicking next after clicking previous
    screen.getByLabelText('Next').click();
    expect(screen.queryByText('before=')).not.toBeInTheDocument();
  });

  it('renders disabled pagination buttons when there are no other pages', async () => {
    mountWithSearchParams(
      <TablePagination
        pagination={{
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'start',
          endCursor: 'end',
        }}
      />,
    );

    expect(
      screen.getByLabelText('Previous').getAttribute('aria-disabled'),
    ).toBeTruthy();

    expect(
      screen.getByLabelText('Next').getAttribute('aria-disabled'),
    ).toBeTruthy();
  });

  it('calls window.shopify.loading when clicking next button', async () => {
    mountWithSearchParams(
      <TablePagination
        pagination={{
          hasNextPage: true,
          hasPreviousPage: true,
          startCursor: 'start',
          endCursor: 'end',
        }}
      />,
    );

    screen.getByLabelText('Next').click();
    expect(window.shopify.loading).toHaveBeenCalledWith(true);
  });

  it('calls window.shopify.loading when clicking previous button', async () => {
    mountWithSearchParams(
      <TablePagination
        pagination={{
          hasNextPage: true,
          hasPreviousPage: true,
          startCursor: 'start',
          endCursor: 'end',
        }}
      />,
    );

    screen.getByLabelText('Previous').click();
    expect(window.shopify.loading).toHaveBeenCalledWith(true);
  });
});
