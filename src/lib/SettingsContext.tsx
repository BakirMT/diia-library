import * as React from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface Settings {
  currency: string;
  currencySymbol: string;
  fineRate: number;
  gracePeriod: number;
  maxFine: number;
  theme: 'light' | 'dark' | 'system';
  categories: string[];
  libraryName: string;
  libraryAddress: string;
  libraryEmail: string;
  libraryPhone: string;
  libraryWebsite: string;
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹'
};

const defaultSettings: Settings = {
  currency: 'USD',
  currencySymbol: '$',
  fineRate: 0.50,
  gracePeriod: 3,
  maxFine: 20.00,
  theme: 'system',
  categories: ['Fiction', 'Non-Fiction', 'Science', 'History', 'Technology', 'Art', 'Business'],
  libraryName: 'Central City Public Library',
  libraryAddress: '123 Library Way, Knowledge City, ST 12345',
  libraryEmail: 'hello@centralcitylib.org',
  libraryPhone: '(555) 123-4567',
  libraryWebsite: 'https://centralcitylib.org'
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const SettingsContext = React.createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = React.useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('app_settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  React.useEffect(() => {
    const docRef = doc(db, 'settings', 'global');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<Settings>;
        setSettings(prev => {
          // Keep local theme, override rest with remote
          const localTheme = prev.theme;
          const newSettings = { ...defaultSettings, ...data, theme: localTheme };
          localStorage.setItem('app_settings', JSON.stringify(newSettings));
          return newSettings;
        });
      } else {
        // Initialize doc if it doesn't exist (excluding theme which is local)
        const { theme, ...globalSettings } = defaultSettings;
        setDoc(docRef, globalSettings, { merge: true }).catch(console.error);
      }
    }, (error) => {
      console.error("Error fetching settings:", error);
    });

    return () => unsubscribe();
  }, []);

  const updateSettings = React.useCallback(async (newSettings: Partial<Settings>) => {
    // Optimistic update locally
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('app_settings', JSON.stringify(updated));
      return updated;
    });
    
    // Save to Firestore, excluding theme so it doesn't overwrite others' themes
    try {
      const { theme, ...settingsToSave } = newSettings;
      
      // Only save to Firestore if there are global settings to update
      if (Object.keys(settingsToSave).length > 0) {
        const docRef = doc(db, 'settings', 'global');
        await setDoc(docRef, settingsToSave, { merge: true });
      }
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  }, []);

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }
    if (settings.libraryName) {
      document.title = settings.libraryName;
    }
  }, [settings.theme]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => React.useContext(SettingsContext);