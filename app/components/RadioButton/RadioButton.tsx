import type {RadioButtonProps as PolarisRadioButtonProps} from '@shopify/polaris';
import {RadioButton as PolarisRadioButton} from '@shopify/polaris';
import type {GetInputPropsParam} from '@rvf/remix';
import {useFormContext} from '@rvf/remix';

type RadioButtonProps = Omit<PolarisRadioButtonProps, 'autoComplete'> & {
  name: string;
  value: string;
  label: string;
};

export const RadioButton = ({
  name,
  value,
  label,
  ...rest
}: RadioButtonProps) => {
  const form = useFormContext<any>();

  const props: GetInputPropsParam<PolarisRadioButtonProps> = form.getInputProps(
    name,
    {
      ...rest,
      label,
      checked: form.value(name) === value,
      value,
    },
  );

  // getInputProps produces a ref for the element, which isn't allowed for function components
  delete (props as any).ref;

  return (
    <PolarisRadioButton
      {...props}
      // getInputProps creates an onChange handler that doesn't match the Polaris RadioButton onChange signature, so we
      // need to override it.
      onChange={() => form.setValue(name, value)}
    />
  );
};
