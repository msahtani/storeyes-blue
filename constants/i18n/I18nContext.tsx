import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

import enTranslations from './translations/en.json';
import frTranslations from './translations/fr.json';

export type Language = 'fr' | 'en';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'app_language';

const translations = {
  fr: frTranslations,
  en: enTranslations,
};

/**
 * Get nested translation value by dot-notation key
 * Example: t('home.camera.title') => translations.fr.home.camera.title
 */
const getNestedValue = (obj: any, path: string): string => {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return path; // Return key if not found
    }
  }
  
  return typeof value === 'string' ? value : path;
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');
  const [isReady, setIsReady] = useState(false);

  // Load saved language preference on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);
        if (savedLanguage === 'fr' || savedLanguage === 'en') {
          setLanguageState(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      } finally {
        setIsReady(true);
      }
    };
    
    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const t = (key: string): string => {
    const translation = translations[language];
    return getNestedValue(translation, key);
  };

  // Don't render children until language is loaded
  if (!isReady) {
    return null;
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

