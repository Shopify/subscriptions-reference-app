import {describe, expect, it, vi, beforeEach} from 'vitest';
import {renderHook} from '@testing-library/react';
import {useLoaderData, useActionData} from '@remix-run/react';
import {toast} from '~/utils/toast';

import {mockShopify} from '#/setup-app-bridge';
import {useToasts} from '../useToasts';

vi.mock('@remix-run/react', async (originalImport) => {
  const original: any = await originalImport();
  return {
    ...original,
    useLoaderData: vi.fn(),
    useActionData: vi.fn(),
  };
});

describe('useToasts', () => {
  beforeEach(() => {
    vi.mocked(useLoaderData).mockReturnValue(undefined);
    vi.mocked(useActionData).mockReturnValue(undefined);
  });

  it('should skip rendering if there is no toast data', async () => {
    // When
    renderHook(() => useToasts());

    // Then
    expect(mockShopify.toast.show).not.toHaveBeenCalledTimes(1);
  });

  it('should render toasts from loader data', async () => {
    // Given
    vi.mocked(useLoaderData).mockReturnValue(toast('loader message'));

    // When
    renderHook(() => useToasts());

    // Then
    expect(mockShopify.toast.show).toHaveBeenCalledTimes(1);
    expect(mockShopify.toast.show).toHaveBeenCalledWith('loader message', {
      isError: false,
    });
  });

  it('should render toasts from action data', async () => {
    // Given
    vi.mocked(useActionData).mockReturnValue(toast('action message'));

    // When
    renderHook(() => useToasts());

    // Then
    expect(mockShopify.toast.show).toHaveBeenCalledTimes(1);
    expect(mockShopify.toast.show).toHaveBeenCalledWith('action message', {
      isError: false,
    });
  });

  it('should render toasts from fetcher data', async () => {
    // Given
    const {
      result: {
        current: {showToasts},
      },
      rerender,
    } = renderHook(() => useToasts());

    expect(mockShopify.toast.show).not.toHaveBeenCalledTimes(1);

    // When
    showToasts(toast('data message'));
    rerender();

    // Then
    expect(mockShopify.toast.show).toHaveBeenCalledTimes(1);
    expect(mockShopify.toast.show).toHaveBeenCalledWith('data message', {
      isError: false,
    });
  });

  it('should pass toast options through', () => {
    // Given
    vi.mocked(useLoaderData).mockReturnValue(
      toast('loader message', {isError: true}),
    );

    // When
    renderHook(() => useToasts());

    // Then
    expect(mockShopify.toast.show).toHaveBeenCalledTimes(1);
    expect(mockShopify.toast.show).toHaveBeenCalledWith('loader message', {
      isError: true,
    });
  });

  it('should ignore other properties in the data', () => {
    // Given
    vi.mocked(useLoaderData).mockReturnValue({
      otherProp: true,
      ...toast('loader message'),
    });

    // When
    renderHook(() => useToasts());

    // Then
    expect(mockShopify.toast.show).toHaveBeenCalledTimes(1);
    expect(mockShopify.toast.show).toHaveBeenCalledWith('loader message', {
      isError: false,
    });
  });

  it('can show loader or action toast more than once', () => {
    // Given
    vi.mocked(useLoaderData).mockReturnValue(toast('loader message'));

    // When
    const {
      result: {
        current: {showToasts},
      },
      rerender,
    } = renderHook(() => useToasts());

    // Then
    expect(mockShopify.toast.show).toHaveBeenCalledTimes(1);
    expect(mockShopify.toast.show).toHaveBeenCalledWith('loader message', {
      isError: false,
    });

    // When a fetcher shows a toast and then unsets the data
    showToasts(toast('data message'));
    rerender();
    showToasts(undefined);
    rerender();

    // Then
    expect(mockShopify.toast.show).toHaveBeenCalledTimes(3);
    expect(mockShopify.toast.show).toHaveBeenNthCalledWith(2, 'data message', {
      isError: false,
    });
    expect(mockShopify.toast.show).toHaveBeenNthCalledWith(
      3,
      'loader message',
      {isError: false},
    );
  });
});
