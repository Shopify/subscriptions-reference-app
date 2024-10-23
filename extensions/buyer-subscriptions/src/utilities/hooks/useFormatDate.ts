import {isSameYear} from '@shopify/dates';
import {useExtensionApi} from 'foundation/Api';

export function useFormatDate() {
  const {i18n} = useExtensionApi();

  /**
   * Formats the date by hiding the year if the date is within the same year
   */
  function formatDate(date: string) {
    const dateToFormat = new Date(date);
    return isSameYear(dateToFormat, new Date())
      ? i18n.formatDate(dateToFormat, {
          month: 'short',
          day: 'numeric',
        })
      : i18n.formatDate(dateToFormat, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
  }

  return formatDate;
}
