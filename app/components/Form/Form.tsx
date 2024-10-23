import {useCallback, useEffect} from 'react';
import {useBlocker} from '@remix-run/react';
import {FormProvider, useForm} from '@rvf/remix';
import type {ValidatedFormProps} from '@rvf/remix';
import {SaveBar, useAppBridge} from '@shopify/app-bridge-react';
import {compareValues} from '~/utils/helpers/compareValues';

export function Form(
  props: ValidatedFormProps<any, any, any> & {children: React.ReactNode},
) {
  const barId = `form-bar-${props.id}`;
  const defaultValues = props.defaultValues;
  const shopify = useAppBridge();

  useBlocker(() => {
    if (form.formState.isDirty && !form.formState.isSubmitting) {
      shopify.saveBar.leaveConfirmation();
      return true;
    }

    return false;
  });

  const form = useForm({
    method: 'post',
    ...props,
    resetAfterSubmit: true,
    onSubmitSuccess: () => form.resetForm(props.defaultValues),
    onSubmitFailure: () => form.resetForm(props.defaultValues),
  });

  useEffect(() => {
    if (form.formState.isDirty) {
      shopify.saveBar.show(barId);
    } else {
      shopify.saveBar.hide(barId);
    }
  }, [barId, form, shopify]);

  useEffect(() => {
    if (!defaultValues) return;

    const unsubscribeFns = Object.entries(defaultValues).map(
      ([key, defaultValue]) =>
        form.subscribe.value(key, (value: any) => {
          if (compareValues(value, defaultValue)) {
            // If the form is clean, we want to hide the save bar, so we reset the form to the default values
            form.resetField(key, defaultValue);
          } else {
            // Sometimes RVF doesn't mark the field as dirty when it should, so we do it manually here
            form.setDirty(key, true);
          }
        }),
    );

    return () => {
      unsubscribeFns.forEach((unsubscribe) => unsubscribe());
    };
  }, [form, defaultValues]);

  const handleReset = useCallback(() => {
    form.resetForm(defaultValues);
  }, [form, defaultValues]);

  return (
    <FormProvider scope={form.scope()}>
      <form {...form.getFormProps()}>
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
