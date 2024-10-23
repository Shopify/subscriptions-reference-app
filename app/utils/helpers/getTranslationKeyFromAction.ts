export function getTranslationKeyFromAction(action: string) {
  switch (action) {
    case 'bulk-pause':
      return 'table.pauseBulkActionModal';
    case 'bulk-activate':
      return 'table.activateBulkActionModal';
    case 'bulk-cancel':
      return 'table.cancelBulkActionModal';
    default:
      throw new Error(`Invalid bulk action: ${action}`);
  }
}
