import React from 'react';
import {vi} from 'vitest';

// Mock components for POS UI extensions
export const MockIcon = (props: any) => (
  <div data-testid="radio-icon" {...props} />
);

export const MockStack = ({children, ...props}: any) => (
  <div {...props}>{children}</div>
);

export const MockText = ({children, ...props}: any) => (
  <div {...props}>{children}</div>
);

export const MockSelectable = ({children, onPress, ...props}: any) => (
  <div data-testid="selectable" {...props} onClick={onPress}>
    {children}
  </div>
);

/**
 * Mock UI extension components for POS extension tests.
 * This function should be called at the beginning of test files that use POS UI components.
 *
 * IMPORTANT: Make sure to import this before any components in test files or it will not get called.
 *
 * Example usage:
 * ```typescript
 * import {mockUiExtensionComponents} from '../../tests/mocks/components';
 *
 * // Call this before any component imports
 * mockUiExtensionComponents();
 *
 * import {PlanItem} from '../PlanItem';
 * ```
 */
export function mockUiExtensionComponents() {
  vi.mock('@shopify/ui-extensions-react/point-of-sale', () => ({
    Icon: MockIcon,
    Stack: MockStack,
    Text: MockText,
    Selectable: MockSelectable,
  }));
}
