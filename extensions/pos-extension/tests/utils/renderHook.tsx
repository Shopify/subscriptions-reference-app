import {
  renderHook as rtlRenderHook,
  RenderHookOptions,
  RenderHookResult,
} from '@testing-library/preact';

/**
 * Custom renderHook utility that automatically wraps components with necessary providers
 *
 * @param hook - The hook to render
 * @param options - Optional render options
 * @returns The render result from @testing-library/preact
 */
export function renderHookWithContext<TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, 'wrapper'>,
): RenderHookResult<TResult, TProps> {
  return rtlRenderHook(hook, {
    ...options,
  });
}

/**
 * Re-export the original renderHook for cases where providers aren't needed
 */
export {renderHook} from '@testing-library/preact';
