import React from 'react';
import {
  render as rtlRender,
  RenderOptions,
  RenderResult,
} from '@testing-library/preact';
import {I18nTestProvider} from '../mocks/i18n';

interface WrapperProps {
  children: React.ReactNode;
}

/**
 * Custom wrapper that includes all necessary providers for testing
 */
const AllTheProviders = ({children}: WrapperProps) => {
  return <I18nTestProvider>{children}</I18nTestProvider>;
};

/**
 * Custom render utility that automatically wraps components with necessary providers
 *
 * @param ui - The React element to render
 * @param options - Optional render options
 * @returns The render result from @testing-library/preact
 */
export function renderWithContext(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult {
  return rtlRender(ui, {
    wrapper: AllTheProviders,
    ...options,
  });
}

/**
 * Re-export everything from @testing-library/preact including the original render
 */
export * from '@testing-library/preact';
