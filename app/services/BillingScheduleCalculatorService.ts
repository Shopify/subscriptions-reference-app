import type {BillingSchedule} from '@prisma/client';
import type {DateTime} from 'luxon';

/**
 * BillingScheduleCalculatorService
 *
 * Calculates if billing charges or reminders should be run for a shop, according to it's billing schedule timezone
 * and hour.
 *
 * BILLING_CHARGE_DAYS_AGO
 * The number of days we should look back for charging. It should be the recurrning interval of time each billing job
 * runs or more. This is to account for the possibility of a shop's billing schedule being missed. That could happen
 * because of timezone changes, daylight saving time changes, shop uninstall and reinstall, etc.
 *
 */
export class BillingScheduleCalculatorService {
  static BILLING_CHARGE_DAYS_AGO: number = 2;

  public readonly record: BillingSchedule;
  public readonly compareToDate: DateTime;

  /**
   *
   * @param record with a timezone and billing hour
   * @param compareToDate a datetime in UTC to compare with the billing schedule
   */
  constructor(record: BillingSchedule, compareToDate: DateTime) {
    this.record = record;
    this.compareToDate = compareToDate.startOf('hour');
  }

  /**
   * Converts the `compareToDate` UTC datetime to the shop's local timezone and hour
   */
  get timeLocal(): DateTime {
    const {timezone, hour} = this.record;

    return this.compareToDate.setZone(timezone).set({hour}).startOf('hour');
  }

  /**
   * Converts the shop's local billing time to UTC for calculating billing and reminder datetimes and enqueuing jobs
   */
  get timeUtc(): DateTime {
    return this.timeLocal.setZone('utc').startOf('hour');
  }

  /**
   * Calculates the start of the billing window
   */
  get billingStartTimeUtc(): DateTime {
    return this.billingEndTimeUtc.minus({
      day: BillingScheduleCalculatorService.BILLING_CHARGE_DAYS_AGO,
    });
  }

  /**
   * Calculates the end of the billing window
   */
  get billingEndTimeUtc(): DateTime {
    return this.timeLocal.endOf('day').setZone('utc');
  }

  /**
   * Should the shop process billing charges or reminders at the given `compareToDate`?
   */
  isBillable(): boolean {
    return this.timeUtc.equals(this.compareToDate);
  }
}
