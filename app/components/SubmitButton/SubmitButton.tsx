import {Button} from '@shopify/polaris';
import {useIsSubmitting} from 'remix-validated-form';
import {useFormContext} from '@rvf/remix';

export interface SubmitButtonProps {
  children: React.ReactNode;
}

export const SubmitButton = ({children}) => {
  const isSubmitting = useIsSubmitting();

  return (
    <Button
      submit
      variant="primary"
      disabled={isSubmitting}
      loading={isSubmitting}
    >
      {children}
    </Button>
  );
};

export const RvfSubmitButton = ({children}) => {
  const form = useFormContext();

  return (
    <Button
      submit
      variant="primary"
      disabled={form.formState.isSubmitting}
      loading={form.formState.isSubmitting}
    >
      {children}
    </Button>
  );
};
