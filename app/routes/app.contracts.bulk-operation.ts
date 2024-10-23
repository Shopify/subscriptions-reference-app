import {json} from '@remix-run/node';
import type {ActionFunctionArgs} from '@remix-run/node';
import i18n from '~/i18n/i18next.server';
import SubscriptionContractPause from '~/graphql/SubscriptionContractPauseMutation';
import SubscriptionContractResume from '~/graphql/SubscriptionContractResumeMutation';
import SubscriptionContractCancel from '~/graphql/SubscriptionContractCancelMutation';
import {authenticate} from '~/shopify.server';
import type {TypedResponseWithToast} from '~/types';
import {performBulkMutation} from '~/utils/bulkOperations';
import {getTranslationKeyFromAction} from '~/utils/helpers/getTranslationKeyFromAction';

const BULK_PAUSE_ACTION = 'bulk-pause';
const BULK_ACTIVATE_ACTION = 'bulk-activate';
const BULK_CANCEL_ACTION = 'bulk-cancel';

// This code is tested in the context of where it is used on the contract list page
// tests are available in the PauseBulkActionModal.test.tsx file
export async function action({
  request,
}: ActionFunctionArgs): Promise<TypedResponseWithToast> {
  const {admin} = await authenticate.admin(request);
  const t = await i18n.getFixedT(request, 'app.contracts');

  const genericBulkOperationError = json({
    toast: {
      isError: true,
      message: t('table.genericActionModal.errorToast'),
    },
  });

  const body = await request.formData();
  const contracts = body.get('contracts');
  const action = body.get('action');

  if (typeof contracts !== 'string') {
    return genericBulkOperationError;
  }

  if (typeof action !== 'string') {
    return genericBulkOperationError;
  }

  const translationKey = getTranslationKeyFromAction(action);

  const contractIds = contracts.split(',');

  const input = contractIds.map((contractId) => ({
    subscriptionContractId: contractId,
  }));

  function getBulkActionMutation(action: string) {
    switch (action) {
      case BULK_PAUSE_ACTION:
        return SubscriptionContractPause;
      case BULK_ACTIVATE_ACTION:
        return SubscriptionContractResume;
      case BULK_CANCEL_ACTION:
        return SubscriptionContractCancel;
      default:
        throw new Error(`Invalid bulk action: ${action}`);
    }
  }

  try {
    const response = await performBulkMutation(
      admin.graphql,
      getBulkActionMutation(action as string),
      input,
    );

    return json({
      toast: {
        isError: false,
        message: t(`${translationKey}.bulkOperationStartedToast`, {
          count: contractIds.length,
        }),
      },
      bulkOperationId: response.bulkOperation.id,
    });
  } catch {
    return json({
      toast: {
        isError: true,
        message: t(`${translationKey}.errorToast`, {
          count: contractIds.length,
        }),
      },
    });
  }
}
