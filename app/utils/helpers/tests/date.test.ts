import {DateTime} from 'luxon';
import {describe, expect, it} from 'vitest';
import {SellingPlanInterval} from '~/types';
import {advanceDateTime, formatDate} from '../date';

describe('advanceDateTime', () => {
  it('should advance date time by multiple days', () => {
    const date = DateTime.fromISO('2021-01-01');
    const interval = SellingPlanInterval.Day;
    const intervalCount = 1;
    const numIntervals = 3;
    const advancedDate = advanceDateTime(
      date,
      interval,
      intervalCount,
      numIntervals,
    );
    expect(advancedDate.toFormat('yyyy-MM-dd')).toBe('2021-01-04');
  });

  it('should advance date time by multiple weeks', () => {
    const date = DateTime.fromISO('2021-01-01');
    const interval = SellingPlanInterval.Week;
    const intervalCount = 1;
    const numIntervals = 3;
    const advancedDate = advanceDateTime(
      date,
      interval,
      intervalCount,
      numIntervals,
    );
    expect(advancedDate.toFormat('yyyy-MM-dd')).toBe('2021-01-22');
  });

  it('should advance date time by multiple months', () => {
    const date = DateTime.fromISO('2021-01-01');
    const interval = SellingPlanInterval.Month;
    const intervalCount = 1;
    const numIntervals = 3;
    const advancedDate = advanceDateTime(
      date,
      interval,
      intervalCount,
      numIntervals,
    );
    expect(advancedDate.toFormat('yyyy-MM-dd')).toBe('2021-04-01');
  });

  it('should advance date time by a year', () => {
    const date = DateTime.fromISO('2021-01-01');
    const interval = SellingPlanInterval.Year;
    const intervalCount = 1;
    const numIntervals = 1;
    const advancedDate = advanceDateTime(
      date,
      interval,
      intervalCount,
      numIntervals,
    );
    expect(advancedDate.toFormat('yyyy-MM-dd')).toBe('2022-01-01');
  });

  it('caps the future date at 2 years', () => {
    const date = DateTime.fromISO('2022-01-01');
    const interval = SellingPlanInterval.Year;
    const intervalCount = 1;
    const numIntervals = 5;
    const advancedDate = advanceDateTime(
      date,
      interval,
      intervalCount,
      numIntervals,
    );
    expect(advancedDate.toFormat('yyyy-MM-dd')).toBe('2024-01-01');
  });
});

describe('formatDate', () => {
  it('formats a given date correctly', () => {
    const result = formatDate('2023-04-01', 'en-US');

    expect(result).toBe('April 1, 2023');
  });

  it('formats date based on locale param', () => {
    const result = formatDate('2023-04-01', 'fr-FR');

    expect(result).toBe('1 avril 2023');
  });

  it('applies the specified time zone', () => {
    const result = formatDate('2023-04-01T20:00:00Z', 'en-US', 'Asia/Tokyo');

    // Tokyo is ahead of UTC, so in this case the formatted date is a day ahead of the passed timestamp
    expect(result).toBe('April 2, 2023');
  });
});
