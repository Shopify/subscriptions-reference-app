import {Box, InlineStack, Layout, Page} from '@shopify/polaris';

import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  TypedResponse,
} from '@remix-run/node';
import {json} from '@remix-run/node';
import {useLoaderData} from '@remix-run/react';
import {useTranslation} from 'react-i18next';
import type {ValidationErrorResponseData} from '@rvf/remix';
import {validationError} from '@rvf/remix';
import {Form} from '~/components/Form';
import {SubmitButton} from '~/components/SubmitButton';
import i18n from '~/i18n/i18next.server';
import type {WithToast} from '~/types';
import {
  loadSettingsMetaobject,
  updateSettingsMetaobject,
} from '../../models/Settings/Settings.server';
import {authenticate} from '../../shopify.server';
import {BillingFailureSettings} from './components/BillingFailureSettings';
import {getSettingsValidator, useSettingsValidator} from './validator';
import {useToasts} from '~/hooks';
import {toast} from '~/utils/toast';

export const handle = {
  i18n: 'app.settings',
};

export const loader = async ({request}: LoaderFunctionArgs) => {
  const {admin} = await authenticate.admin(request);

  const settings = await loadSettingsMetaobject(admin.graphql);
  return json({settings});
};

export async function action({
  request,
}: ActionFunctionArgs): Promise<
  TypedResponse<WithToast<Partial<ValidationErrorResponseData>>>
> {
  const {admin} = await authenticate.admin(request);

  const formData = await request.formData();
  const t = await i18n.getFixedT(request, 'app.settings');
  const validator = getSettingsValidator(t);
  const validationResult = await validator.validate(formData);

  if (validationResult.error) {
    return validationError(validationResult.error);
  }

  const {userErrors} = await updateSettingsMetaobject(
    admin.graphql,
    validationResult.data,
  );

  if (userErrors && userErrors.length > 0) {
    return json(toast(userErrors[0].message, {isError: true}));
  }

  return json(toast(t('actions.updateSuccess')));
}

export default function SettingsIndex() {
  const {settings} = useLoaderData<typeof loader>();
  const inventoryEnabled = true;
  useToasts();

  const {t} = useTranslation('app.settings');
  const validator = useSettingsValidator(t);

  return (
    <Page title={t('title')}>
      <Box paddingBlockEnd="400">
        <Form validator={validator} defaultValues={settings}>
          <input type="hidden" value={settings.id} name="id" />
          <Layout>
            <Layout.Section>
              <BillingFailureSettings
                inventoryEnabled={inventoryEnabled}
                settings={settings}
              />
            </Layout.Section>

            <Layout.Section>
              <InlineStack align="end" gap="200">
                <SubmitButton>{t('saveButtonText')}</SubmitButton>
              </InlineStack>
            </Layout.Section>
          </Layout>
        </Form>
      </Box>
    </Page>
  );
}
