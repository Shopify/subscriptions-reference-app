import {reactExtension} from '@shopify/ui-extensions-react/admin';
import PurchaseOptionsActionExtension from './PurchaseOptionsActionExtension';
import AdminExtensionContext from 'foundation/AdminExtensionContext';
import {EXTENSION_TARGET_PRODUCT} from './consts';

export default reactExtension(EXTENSION_TARGET_PRODUCT, () => (
  <AdminExtensionContext.Provider value={EXTENSION_TARGET_PRODUCT}>
    <PurchaseOptionsActionExtension />
  </AdminExtensionContext.Provider>
));
