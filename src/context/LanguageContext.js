import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../constants/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './AuthContext';
import API from '../api/api';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [lang, setLang] = useState('en');

  // 1. Initial load from local storage
  useEffect(() => {
    const loadLang = async () => {
      try {
        const savedLang = await AsyncStorage.getItem('user_language');
        if (savedLang) {
          setLang(savedLang);
        }
      } catch (e) {
        console.error('Failed to load language', e);
      }
    };
    loadLang();
  }, []);

  // 2. Sync with user object from AuthContext
  useEffect(() => {
    if (user?.preferred_language) {
      if (user.preferred_language !== lang) {
        console.log(`🔄 Syncing app language to user preference: ${user.preferred_language}`);
        setLang(user.preferred_language);
        AsyncStorage.setItem('user_language', user.preferred_language);
      }
    } else {
      // If no user is logged in, default back to English for Login/Register screens
      if (lang !== 'en') {
        console.log("👤 No user logged in, resetting to English");
        setLang('en');
        AsyncStorage.removeItem('user_language');
      }
    }
  }, [user]);

  const changeLanguage = async (newLang) => {
    try {
      setLang(newLang);
      await AsyncStorage.setItem('user_language', newLang);

      // Optionally sync back to server if logged in
      if (user) {
        try {
          await API.post('/api/users/update-language', { language: newLang });
          console.log('✅ Language updated on backend');
        } catch (backendErr) {
          console.log('Backend language sync failed', backendErr.message);
        }
      }
    } catch (e) {
      console.error('Failed to save language', e);
    }
  };

  const t = (key) => {
    if (!key) return '';
    const cleanKey = key.toLowerCase().trim().replace(/ /g, '_');
    return translations[lang]?.[cleanKey] || 
           translations[lang]?.[key] || 
           translations['en']?.[cleanKey] || 
           translations['en']?.[key] || 
           key;
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);

