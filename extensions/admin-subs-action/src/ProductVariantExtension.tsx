import {reactExtension} from '@shopify/ui-extensions-react/admin';
import PurchaseOptionsActionExtension from './PurchaseOptionsActionExtension';
import AdminExtensionContext from 'foundation/AdminExtensionContext';
import {EXTENSION_TARGET_PRODUCT_VARIANT} from './consts';

export default reactExtension(EXTENSION_TARGET_PRODUCT_VARIANT, () => (
  <AdminExtensionContext.Provider value={EXTENSION_TARGET_PRODUCT_VARIANT}>
    <PurchaseOptionsActionExtension />
  </AdminExtensionContext.Provider>
));
