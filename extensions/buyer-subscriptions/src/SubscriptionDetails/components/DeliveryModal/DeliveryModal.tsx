import {useCallback, useState} from 'react';
import type {Address} from '@shopify/address';
import type {DeliveryOption, UserError} from 'types';
import {Modal} from '@shopify/ui-extensions-react/customer-account';

import {DeliveryMethodSelectModal, AddressModal} from './components';
import {useFetchDeliveryOptions} from './hooks/useFetchDeliveryOptions';
import {DELIVERY_MODAL_ID} from './types';
import {useExtensionApi} from 'foundation/Api';
import {SuccessToastType, useToast} from 'utilities/hooks/useToast';

enum DeliveryModalState {
  AddressInput = 0,
  DeliveryMethodSelect = 1,
}

interface DeliveryModalProps {
  currentAddress: Address;
  subscriptionContractId: string;
  addressModalOpen: boolean;
  refetchSubscriptionContract: () => void;
  onClose: () => void;
}

export function DeliveryModal({
  currentAddress,
  subscriptionContractId,
  addressModalOpen,
  refetchSubscriptionContract,
  onClose,
}: DeliveryModalProps) {
  const {i18n} = useExtensionApi();

  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState<DeliveryModalState>(
    DeliveryModalState.AddressInput,
  );
  const [newAddress, setNewAddress] = useState<Address>(currentAddress);
  const [errors, setErrors] = useState<UserError[]>([]);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [token, setToken] = useState<string>();
  const [selectedDeliveryHandle, setSelectedDeliveryHandle] =
    useState<string>();
  const {showSuccessToast} = useToast();

  const getDeliveryOptions = useFetchDeliveryOptions();

  const handleAddressChange = useCallback((newValue: Partial<Address>) => {
    setNewAddress((cur) => ({...cur, ...newValue}));
  }, []);

  const onModalClose = useCallback(
    (resetAddress = true) => {
      if (currentAddress && resetAddress) {
        setNewAddress(currentAddress);
      }
      setErrors([]);
      onClose();
      setModalState(DeliveryModalState.AddressInput);
    },
    [currentAddress, onClose],
  );

  const onSuccess = useCallback(() => {
    showSuccessToast(SuccessToastType.DeliveryUpdated);
    onModalClose(false);
    refetchSubscriptionContract();
  }, [onModalClose, refetchSubscriptionContract, showSuccessToast]);

  const handleAddressSave = useCallback(async () => {
    setLoading(true);

    const {
      deliveryOptions,
      deliveryOptionsToken,
      errors: deliveryOptionErrors,
    } = await getDeliveryOptions(newAddress, subscriptionContractId);

    setLoading(false);

    if (deliveryOptionErrors.length === 0 && deliveryOptions.length > 0) {
      setDeliveryOptions(deliveryOptions);
      setSelectedDeliveryHandle(deliveryOptions[0].code);
      setModalState(DeliveryModalState.DeliveryMethodSelect);
      setToken(deliveryOptionsToken);
    }

    setErrors(deliveryOptionErrors);
  }, [getDeliveryOptions, newAddress, subscriptionContractId]);

  const modalContent = (() => {
    switch (modalState) {
      case DeliveryModalState.AddressInput:
        return (
          <AddressModal
            address={newAddress}
            addressModalOpen={addressModalOpen}
            errors={errors}
            handleAddressChange={handleAddressChange}
            onSave={handleAddressSave}
            onClose={onModalClose}
            loading={loading}
          />
        );
      case DeliveryModalState.DeliveryMethodSelect:
        return (
          <DeliveryMethodSelectModal
            selectedDeliveryHandle={selectedDeliveryHandle ?? ''}
            address={newAddress}
            deliveryOptionsToken={token}
            deliveryOptions={deliveryOptions}
            subscriptionContractId={subscriptionContractId}
            onSelectionChange={setSelectedDeliveryHandle}
            onClose={onModalClose}
            onSuccess={onSuccess}
          />
        );
    }
  })();

  const modalTitle = i18n.translate(
    modalState === DeliveryModalState.AddressInput
      ? 'addressModal.title'
      : 'deliveryMethodSelectModal.title',
  );

  return (
    <Modal
      id={DELIVERY_MODAL_ID}
      padding
      title={modalTitle}
      onClose={onModalClose}
      data-testid="delivery-modal"
    >
      {modalContent}
    </Modal>
  );
}
