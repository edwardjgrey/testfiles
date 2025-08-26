// src/services/storageService.js - Language and User Preferences Storage
import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  // Storage keys
  static KEYS = {
    USER_LANGUAGE: 'userLanguage',
    USER_ONBOARDING: 'hasSeenOnboarding',
    USER_PREFERENCES: 'userPreferences',
    AUTH_TOKEN: 'authToken',
  };

  // Language persistence
  static async saveLanguage(language) {
    try {
      await AsyncStorage.setItem(this.KEYS.USER_LANGUAGE, language);
      console.log('💾 Language saved:', language);
      return true;
    } catch (error) {
      console.error('❌ Failed to save language:', error);
      return false;
    }
  }

  static async getLanguage() {
    try {
      const language = await AsyncStorage.getItem(this.KEYS.USER_LANGUAGE);
      console.log('📖 Language retrieved:', language || 'none');
      return language;
    } catch (error) {
      console.error('❌ Failed to get language:', error);
      return null;
    }
  }

  // User preferences
  static async saveUserPreferences(preferences) {
    try {
      const preferencesString = JSON.stringify(preferences);
      await AsyncStorage.setItem(this.KEYS.USER_PREFERENCES, preferencesString);
      console.log('💾 User preferences saved');
      return true;
    } catch (error) {
      console.error('❌ Failed to save user preferences:', error);
      return false;
    }
  }

  static async getUserPreferences() {
    try {
      const preferencesString = await AsyncStorage.getItem(this.KEYS.USER_PREFERENCES);
      if (preferencesString) {
        const preferences = JSON.parse(preferencesString);
        console.log('📖 User preferences retrieved');
        return preferences;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get user preferences:', error);
      return null;
    }
  }

  // Onboarding status
  static async saveOnboardingStatus(hasSeenOnboarding) {
    try {
      await AsyncStorage.setItem(this.KEYS.USER_ONBOARDING, hasSeenOnboarding.toString());
      console.log('💾 Onboarding status saved:', hasSeenOnboarding);
      return true;
    } catch (error) {
      console.error('❌ Failed to save onboarding status:', error);
      return false;
    }
  }

  static async getOnboardingStatus() {
    try {
      const status = await AsyncStorage.getItem(this.KEYS.USER_ONBOARDING);
      const hasSeenOnboarding = status === 'true';
      console.log('📖 Onboarding status retrieved:', hasSeenOnboarding);
      return hasSeenOnboarding;
    } catch (error) {
      console.error('❌ Failed to get onboarding status:', error);
      return false;
    }
  }

  // Auth token
  static async saveAuthToken(token) {
    try {
      await AsyncStorage.setItem(this.KEYS.AUTH_TOKEN, token);
      console.log('💾 Auth token saved');
      return true;
    } catch (error) {
      console.error('❌ Failed to save auth token:', error);
      return false;
    }
  }

  static async getAuthToken() {
    try {
      const token = await AsyncStorage.getItem(this.KEYS.AUTH_TOKEN);
      console.log('📖 Auth token retrieved:', token ? 'exists' : 'none');
      return token;
    } catch (error) {
      console.error('❌ Failed to get auth token:', error);
      return null;
    }
  }

  static async removeAuthToken() {
    try {
      await AsyncStorage.removeItem(this.KEYS.AUTH_TOKEN);
      console.log('🗑️ Auth token removed');
      return true;
    } catch (error) {
      console.error('❌ Failed to remove auth token:', error);
      return false;
    }
  }

  // Clear all data (logout/reset)
  static async clearAllData() {
    try {
      await AsyncStorage.multiRemove([
        this.KEYS.AUTH_TOKEN,
        this.KEYS.USER_PREFERENCES
      ]);
      console.log('🗑️ All user data cleared (keeping language and onboarding)');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear user data:', error);
      return false;
    }
  }

  // Complete reset (including language and onboarding)
  static async completeReset() {
    try {
      await AsyncStorage.multiRemove([
        this.KEYS.USER_LANGUAGE,
        this.KEYS.USER_ONBOARDING,
        this.KEYS.USER_PREFERENCES,
        this.KEYS.AUTH_TOKEN
      ]);
      console.log('🗑️ Complete data reset performed');
      return true;
    } catch (error) {
      console.error('❌ Failed to perform complete reset:', error);
      return false;
    }
  }

  // Debug: Get all stored data
  static async getAllStoredData() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const stores = await AsyncStorage.multiGet(keys);
      const data = {};
      
      stores.forEach(([key, value]) => {
        data[key] = value;
      });
      
      console.log('📊 All stored data:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to get all stored data:', error);
      return {};
    }
  }
}

export default StorageService;