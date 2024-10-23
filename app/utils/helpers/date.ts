import type {DateTime} from 'luxon';
import type {SellingPlanInterval} from 'types/admin.types';
import {useShopInfo} from '~/context/ShopContext';

/**
 * Calculates the future date based on the interval and interval count up to a cap of 3 years
 * @param date the start date
 * @param interval DAY | WEEK | MONTH | YEAR
 * @param intervalCount the frequency of the interval
 * @param numIntervals how many intervals to advance
 * @returns
 */
export function advanceDateTime(
  date: DateTime,
  interval: SellingPlanInterval,
  intervalCount: number,
  numIntervals: number,
): DateTime {
  const intervalType = (interval.toLocaleLowerCase() + 's') as
    | 'days'
    | 'weeks'
    | 'months'
    | 'years';

  // three years out (exclusive) is the max that upcoming billing cycles can be loaded
  const twoYearsFromNextCycle = date.plus({years: 2});
  const futureDate = date.plus({[intervalType]: intervalCount * numIntervals});

  return futureDate > twoYearsFromNextCycle
    ? twoYearsFromNextCycle
    : futureDate;
}

export function formatDate(
  date: string,
  locale: string,
  timeZone?: string,
): string {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone,
  });
}

export function useFormatDate() {
  const {ianaTimezone} = useShopInfo();

  return (date: string, locale: string) => {
    return formatDate(date, locale, ianaTimezone);
  };
}
