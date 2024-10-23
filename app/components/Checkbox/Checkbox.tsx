import {useFormContext} from '@rvf/remix';
import {Checkbox as PolarisCheckbox} from '@shopify/polaris';
import {useControlField, useField} from 'remix-validated-form';

type TextFieldProps = {
  name: string;
  label: string;
};

export const Checkbox = ({name, label}: TextFieldProps) => {
  const {error, getInputProps} = useField(name);
  const [value, setValue] = useControlField<string>(name);

  function handleChange(checked: boolean) {
    setValue(checked ? 'on' : '');
  }

  return (
    <PolarisCheckbox
      {...getInputProps({
        id: name,
        label,
        error,
        checked: Boolean(value),
        onChange: handleChange,
        value: value,
      })}
    />
  );
};

export const RvfCheckbox = ({name, label}: TextFieldProps) => {
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
