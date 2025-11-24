export type AsyncState<TData, TError = string> =
  | {status: 'idle'}
  | {status: 'loading'}
  | {status: 'error'; error: TError}
  | {status: 'success'; data: TData};

export const isLoading = <TData, TError = string>(
  state: AsyncState<TData, TError>,
): state is {status: 'loading'} => state.status === 'loading';

export const isError = <TData, TError = string>(
  state: AsyncState<TData, TError>,
): state is {status: 'error'; error: TError} => state.status === 'error';

export const isSuccess = <TData, TError = string>(
  state: AsyncState<TData, TError>,
): state is {status: 'success'; data: TData} => state.status === 'success';

export const isIdle = <TData, TError = string>(
  state: AsyncState<TData, TError>,
): state is {status: 'idle'} => state.status === 'idle';

export const createIdleState = <TData, TError = string>(): AsyncState<
  TData,
  TError
> => ({status: 'idle'});

export const createLoadingState = <TData, TError = string>(): AsyncState<
  TData,
  TError
> => ({status: 'loading'});

export const createErrorState = <TData, TError = string>(
  error: TError,
): AsyncState<TData, TError> => ({status: 'error', error});

export const createSuccessState = <TData, TError = string>(
  data: TData,
): AsyncState<TData, TError> => ({status: 'success', data});
