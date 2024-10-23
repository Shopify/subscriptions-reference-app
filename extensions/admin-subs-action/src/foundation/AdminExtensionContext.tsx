import {useContext, createContext} from 'react';
import type {PurchaseOptionExtensionTarget} from './api';
import {EXTENSION_TARGET_PRODUCT} from 'src/consts';

const AdminExtensionContext = createContext<PurchaseOptionExtensionTarget>(
  EXTENSION_TARGET_PRODUCT,
);

export const useExtensionTarget = () => {
  const context = useContext(AdminExtensionContext);
  if (!context) {
    throw new Error(
      'useExtensionTarget must be used within an ExtensionTargetProvider',
    );
  }
  return context;
};

export default AdminExtensionContext;
