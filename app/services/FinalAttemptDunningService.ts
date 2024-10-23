import type pino from 'pino';
import type {SubscriptionBillingCycleScheduleEditInputScheduleEditReason} from 'types/admin.types';
import type {SubscriptionContractWithBillingCycle} from '~/models/SubscriptionContract/SubscriptionContract.server';

import SubscriptionBillingCycleScheduleEdit from '~/graphql/SubscriptionBillingCycleScheduleEditMutation';
import {getContractCustomerId} from '~/models/SubscriptionContract/SubscriptionContract.server';
import {
  OnFailureType,
  type OnFailureTypeType,
} from '~/routes/app.settings._index/validator';
import {unauthenticated} from '~/shopify.server';
import {emailDunningStatus} from '~/utils/finalActionSettings';
import {logger} from '~/utils/logger.server';
import {
  CustomerEmailTemplateName,
  CustomerSendEmailService,
} from './CustomerSendEmailService';
import {
  MerchantEmailTemplateName,
  MerchantSendEmailService,
} from './MerchantSendEmailService';
import {SubscriptionContractCancelService} from './SubscriptionContractCancelService';
import {SubscriptionContractPauseService} from './SubscriptionContractPauseService';

interface FinalAttemptDunningServiceArgs {
  shop: string;
  subscriptionContract: SubscriptionContractWithBillingCycle['subscriptionContract'];
  billingCycleIndex: number;
  onFailure: OnFailureTypeType;
  sendCustomerEmail: boolean;
}

export class FinalAttemptDunningService {
  shop: string;
  subscriptionContract: SubscriptionContractWithBillingCycle['subscriptionContract'];
  billingCycleIndex: number;
  onFailure: OnFailureTypeType;
  log: pino.Logger;
  sendCustomerEmail: boolean;

  constructor({
    shop,
    subscriptionContract,
    billingCycleIndex,
    onFailure,
    sendCustomerEmail,
  }: FinalAttemptDunningServiceArgs) {
    this.shop = shop;
    this.subscriptionContract = subscriptionContract;
    this.billingCycleIndex = billingCycleIndex;
    this.onFailure = onFailure;
    this.sendCustomerEmail = sendCustomerEmail;
    this.log = logger.child({class: 'FinalAttemptDunningService'});
  }

  async run() {
    logger.info('Running FinalAttemptDunningService');

    const customerId = await getContractCustomerId(
      this.shop,
      this.subscriptionContract.id,
    );

    const dunningStatus = emailDunningStatus(this.onFailure);

    const customerTemplateInput = {
      subscriptionContractId: this.subscriptionContract.id,
      subscriptionTemplateName:
        CustomerEmailTemplateName.SubscriptionPaymentFailure,
      dunningStatus,
      billingCycleIndex: this.billingCycleIndex,
    };

    if (this.onFailure == OnFailureType.cancel) {
      await this.cancelSubscriptionContract();
    } else if (this.onFailure == OnFailureType.pause) {
      await this.pauseSubscriptionContract();
    }

    if (this.sendCustomerEmail) {
      await new CustomerSendEmailService().run(
        this.shop,
        customerId,
        customerTemplateInput,
      );
    }

    const merchantTemplateInput = {
      subscriptionContractId: this.subscriptionContract.id,
      subscriptionTemplateName:
        MerchantEmailTemplateName.SubscriptionPaymentFailureMerchant,
      dunningStatus,
    };

    await new MerchantSendEmailService().run(this.shop, merchantTemplateInput);

    const {admin} = await unauthenticated.admin(this.shop);
    if (this.onFailure === 'skip') {
      const response = await admin.graphql(
        SubscriptionBillingCycleScheduleEdit,
        {
          variables: {
            billingCycleInput: {
              contractId: this.subscriptionContract.id,
              selector: {
                index: this.billingCycleIndex,
              },
            },
            input: {
              reason:
                'MERCHANT_INITIATED' as SubscriptionBillingCycleScheduleEditInputScheduleEditReason,
              skip: true,
            },
          },
        },
      );

      const json = await response.json();
      const subscriptionBillingCycleScheduleEdit =
        json.data?.subscriptionBillingCycleScheduleEdit;

      if (!subscriptionBillingCycleScheduleEdit) {
        this.log.error(
          {shopDomain: this.shop},
          'Received invalid response from mutation. Expected property `subscriptionBillingCycleScheduleEdit`, received:',
          json,
        );

        throw new Error(
          'Failed to send call SubscriptionBillingCycleScheduleEdit in FinalAttemptDunningService',
        );
      }
    }
  }

  private async pauseSubscriptionContract() {
    const {admin, session} = await unauthenticated.admin(this.shop);
    await new SubscriptionContractPauseService(
      admin.graphql,
      session.shop,
      this.subscriptionContract.id,
    ).run();
  }

  private async cancelSubscriptionContract() {
    const {admin, session} = await unauthenticated.admin(this.shop);
    await new SubscriptionContractCancelService(
      admin.graphql,
      session.shop,
      this.subscriptionContract.id,
    ).run();
  }
}
