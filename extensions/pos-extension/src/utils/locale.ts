import {PreactI18n} from '../i18n/config';

export const getPlural = (i18n: PreactI18n, key: string, count: number) => {
  if (count === 0) return i18n.t(`${key}.none`);
  if (count === 1) return i18n.t(`${key}.singular`, {count});
  return i18n.t(`${key}.plural`, {count});
};
