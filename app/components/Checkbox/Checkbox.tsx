import {useFormContext} from '@rvf/remix';
import {Checkbox as PolarisCheckbox} from '@shopify/polaris';

type CheckboxProps = {
  name: string;
  label: string;
};

export const Checkbox = ({name, label}: CheckboxProps) => {
  const form = useFormContext<any>();

  return (
    <PolarisCheckbox
      {...form.getInputProps(name, {
        id: name,
        label,
        error: form.error(name) ?? false,
        checked: Boolean(form.value(name)),
        onChange: (checked: boolean) => {
          form.setValue(name, checked ? 'on' : '');
        },
        value: form.value(name) ?? undefined,
      })}
      // getInputProps produces a ref for the element, which isn't allowed for function components
      {...{ref: undefined}}
    />
  );
};
