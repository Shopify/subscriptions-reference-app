import React, {useCallback, useEffect, useState} from 'react';
import {useBlocker} from '@remix-run/react';
import {FormProvider, useForm, type ValidatedFormProps} from '@rvf/remix';
import {SaveBar, useAppBridge} from '@shopify/app-bridge-react';

export function Form(
  props: ValidatedFormProps<any, any, any> & {children: React.ReactNode},
) {
  const shopify = useAppBridge();
  const [defaultValues, setDefaultValues] = useState(props.defaultValues);
  const [isDirty, setIsDirty] = useState(false);

  useBlocker(() => {
    if (isDirty && !form.formState.isSubmitting) {
      shopify.saveBar.leaveConfirmation();
      return true;
    }

    return false;
  });

  const form = useForm({
    method: 'post',
    ...props,
    onSubmitSuccess: () => {
      setDefaultValues(props.defaultValues);
      setIsDirty(false);

      if (props.onSubmitSuccess) {
        props.onSubmitSuccess();
      }
    },
  });
  const [open, setOpen] = useState(false);

  const barId = `form-bar-${props.id}`;

  useEffect(() => {
    if (isDirty && !open) {
      shopify.saveBar.show(barId);
      setOpen(true);
    } else if (!isDirty && open) {
      shopify.saveBar.hide(barId);
      setOpen(false);
    }
  }, [barId, form, isDirty, open, shopify]);

  useEffect(() => {
    form.subscribe.value((values) => {
      Object.entries(values).forEach(([key, value]) => {
        if (defaultValues[key] !== value) {
          setIsDirty(true);
        }
      });
    });
    // We only want to subscribe once, so we don't run this more often than we have to
  }, []);

  const handleReset = useCallback(() => {
    Object.entries(defaultValues).forEach(([key, value]) => {
      form.setValue(key, value);
      setIsDirty(false);
    });
  }, [form, defaultValues]);

  return (
    <FormProvider scope={form.scope()}>
      <form {...form.getFormProps()} onChange={() => setIsDirty(true)}>
        <SaveBar id={barId}>
          <button
            variant="primary"
            loading={form.formState.isSubmitting ? 'true' : undefined}
          ></button>
          <button
            type="button"
            disabled={form.formState.isSubmitting}
            onClick={handleReset}
          ></button>
        </SaveBar>
        {props.children}
      </form>
    </FormProvider>
  );
}
