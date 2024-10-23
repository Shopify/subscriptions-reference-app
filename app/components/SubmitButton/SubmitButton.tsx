import {Button} from '@shopify/polaris';
import {useFormContext} from '@rvf/remix';

export interface SubmitButtonProps {
  children: React.ReactNode;
}

export const SubmitButton = ({children}) => {
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
