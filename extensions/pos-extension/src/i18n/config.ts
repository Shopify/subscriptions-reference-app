import i18n from 'i18next';
import ShopifyFormat from '@shopify/i18next-shopify';

import cs from '../../locales/cs.json';
import da from '../../locales/da.json';
import de from '../../locales/de.json';
import en from '../../locales/en.default.json';
import es from '../../locales/es.json';
import fi from '../../locales/fi.json';
import fr from '../../locales/fr.json';
import it from '../../locales/it.json';
import ja from '../../locales/ja.json';
import ko from '../../locales/ko.json';
import nb from '../../locales/nb.json';
import nl from '../../locales/nl.json';
import pl from '../../locales/pl.json';
import ptBR from '../../locales/pt-BR.json';
import ptPT from '../../locales/pt-PT.json';
import sv from '../../locales/sv.json';
import th from '../../locales/th.json';
import tr from '../../locales/tr.json';
import zhCN from '../../locales/zh-CN.json';
import zhTW from '../../locales/zh-TW.json';

const resources = {
  cs: {translation: cs},
  da: {translation: da},
  de: {translation: de},
  en: {translation: en},
  es: {translation: es},
  fi: {translation: fi},
  fr: {translation: fr},
  it: {translation: it},
  ja: {translation: ja},
  ko: {translation: ko},
  nb: {translation: nb},
  nl: {translation: nl},
  pl: {translation: pl},
  'pt-BR': {translation: ptBR},
  'pt-PT': {translation: ptPT},
  sv: {translation: sv},
  th: {translation: th},
  tr: {translation: tr},
  'zh-CN': {translation: zhCN},
  'zh-TW': {translation: zhTW},
};

i18n.use(ShopifyFormat.default || ShopifyFormat).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
export type PreactI18n = typeof i18n;
