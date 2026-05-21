import { useEffect } from 'react';
import { TOptions } from 'i18next';
import { useRecoilValue } from 'recoil';
import { useTranslation } from 'react-i18next';
import { resources } from '~/locales/i18n';
import store from '~/store';

export type TranslationKeys = keyof typeof resources.en.sma;

export default function useSmaLocalize() {
  const lang = useRecoilValue(store.lang);
  const { t, i18n } = useTranslation('sma');

  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  return (phraseKey: TranslationKeys, options?: TOptions) => t(phraseKey, options);
}
