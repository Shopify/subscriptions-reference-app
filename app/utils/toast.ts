import type {Toast, ResponseWithToast} from '~/types';

type ToastOptions = Omit<Toast, 'message'>;

export function toast(
  message: string,
  opts: ToastOptions = {},
): ResponseWithToast {
  const options = {isError: false, ...opts};

  return {toast: {message, ...options}};
}
