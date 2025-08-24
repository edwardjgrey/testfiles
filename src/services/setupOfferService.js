// src/services/setupOfferService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import BiometricService from './biometricService';
import SubscriptionService from './subscriptionService';
import SecurityService from './securityService';

class SetupOfferService {
  constructor() {
    this.OFFER_PREFERENCES_KEY = 'setup_offer_preferences';
    this.OFFER_HISTORY_KEY = 'setup_offer_history';
    this.LAST_SHOWN_KEY = 'setup_offer_last_shown';
    this.SESSION_COUNT_KEY = 'app_session_count';
  }

  // Check which setup offers should be shown
  async checkSetupOffers(user) {
    try {
      if (!user || !user.id) {
        console.log('No user provided for setup offer check');
        return null;
      }

      console.log('🔍 Checking setup offers for user:', user.id);

      // Get user preferences for offers
      const preferences = await this.getOfferPreferences(user.id);
      
      // Check if user has disabled certain offers
      if (preferences.neverShow) {
        console.log('User has disabled setup offers');
        return null;
      }

      // Check session count (don't show on every login)
      const shouldShowThisSession = await this.shouldShowInSession(user.id);
      if (!shouldShowThisSession) {
        console.log('Skipping offers this session based on frequency rules');
        return null;
      }

      // Check each type of offer
      const offers = {
        biometric: await this.checkBiometricOffer(user, preferences),
        subscription: await this.checkSubscriptionOffer(user, preferences),
        financial: await this.checkFinancialOffer(user, preferences),
        goals: await this.checkGoalsOffer(user, preferences),
        security: await this.checkSecurityOffer(user, preferences),
      };

      // Count active offers
      const activeOffers = Object.values(offers).filter(offer => offer !== false);
      
      if (activeOffers.length === 0) {
        console.log('No setup offers to show');
        return null;
      }

      console.log(`📋 ${activeOffers.length} setup offers available`);
      
      // Record that we're showing offers
      await this.recordOfferShown(user.id);

      return offers;
    } catch (error) {
      console.error('Error checking setup offers:', error);
      return null;
    }
  }

  // Check if biometric setup should be offered
  async checkBiometricOffer(user, preferences) {
    try {
      // Check if user has disabled biometric offers
      if (preferences.disabledOffers?.includes('biometric')) {
        return false;
      }

      // Check last time biometric was offered
      const lastOffered = preferences.lastOffered?.biometric;
      if (lastOffered && this.wasRecentlyOffered(lastOffered, 7)) { // Don't offer again within 7 days
        return false;
      }

      // Check if biometric is available and not set up
      const biometricInfo = await BiometricService.getBiometricInfo(user.id);
      
      if (biometricInfo.available && !biometricInfo.isSetup) {
        console.log('✅ Biometric offer: Available and not setup');
        return {
          type: 'biometric',
          priority: 2,
          data: biometricInfo
        };
      }

      return false;
    } catch (error) {
      console.error('Error checking biometric offer:', error);
      return false;
    }
  }

  // Check if subscription upgrade should be offered
  async checkSubscriptionOffer(user, preferences) {
    try {
      // Check if user has disabled subscription offers
      if (preferences.disabledOffers?.includes('subscription')) {
        return false;
      }

      // Check last time subscription was offered
      const lastOffered = preferences.lastOffered?.subscription;
      if (lastOffered && this.wasRecentlyOffered(lastOffered, 3)) { // Don't offer again within 3 days
        return false;
      }

      // Get current subscription and usage
      const subscription = await SubscriptionService.getCurrentSubscription();
      
      // Only offer upgrades to basic plan users
      if (subscription?.plan_id !== 'basic') {
        return false;
      }

      const usage = await SubscriptionService.getUsageAnalytics();
      
      // Check usage thresholds
      const shouldOffer = this.shouldOfferUpgrade(usage, subscription);
      
      if (shouldOffer) {
        console.log('✅ Subscription offer: High usage detected');
        return {
          type: 'subscription',
          priority: 3,
          data: {
            currentPlan: subscription,
            usage: usage,
            reason: shouldOffer.reason
          }
        };
      }

      return false;
    } catch (error) {
      console.error('Error checking subscription offer:', error);
      return false;
    }
  }

  // Check if financial setup should be offered
  async checkFinancialOffer(user, preferences) {
    try {
      // Check if user has disabled financial offers
      if (preferences.disabledOffers?.includes('financial')) {
        return false;
      }

      // Check if financial data exists
      const financialData = await AsyncStorage.getItem(`financial_data_${user.id}`);
      
      if (!financialData) {
        console.log('✅ Financial offer: No financial data found');
        return {
          type: 'financial',
          priority: 4,
          data: {}
        };
      }

      // Check if financial data is incomplete
      const data = JSON.parse(financialData);
      if (!data.monthlyIncome || !data.currency) {
        console.log('✅ Financial offer: Incomplete financial data');
        return {
          type: 'financial',
          priority: 4,
          data: data
        };
      }

      return false;
    } catch (error) {
      console.error('Error checking financial offer:', error);
      return false;
    }
  }

  // Check if goals setup should be offered
  async checkGoalsOffer(user, preferences) {
    try {
      // Check if user has disabled goals offers
      if (preferences.disabledOffers?.includes('goals')) {
        return false;
      }

      // Check if goals data exists
      const goalsData = await AsyncStorage.getItem(`goals_data_${user.id}`);
      
      if (!goalsData) {
        console.log('✅ Goals offer: No goals set');
        return {
          type: 'goals',
          priority: 5,
          data: {}
        };
      }

      // Check if user has any active goals
      const data = JSON.parse(goalsData);
      if (!data.goals || data.goals.length === 0) {
        console.log('✅ Goals offer: No active goals');
        return {
          type: 'goals',
          priority: 5,
          data: data
        };
      }

      return false;
    } catch (error) {
      console.error('Error checking goals offer:', error);
      return false;
    }
  }

  // Check if security setup should be offered
  async checkSecurityOffer(user, preferences) {
    try {
      // Check if user has disabled security offers
      if (preferences.disabledOffers?.includes('security')) {
        return false;
      }

      // Check if PIN is set up
      SecurityService.setCurrentUser(user.id);
      const hasPinSetup = await SecurityService.isPinSetup(user.id);
      
      if (!hasPinSetup) {
        console.log('✅ Security offer: No PIN setup');
        return {
          type: 'security',
          priority: 1, // Highest priority
          data: {}
        };
      }

      return false;
    } catch (error) {
      console.error('Error checking security offer:', error);
      return false;
    }
  }

  // Determine if subscription upgrade should be offered based on usage
  shouldOfferUpgrade(usage, subscription) {
    if (!usage || !subscription) return false;

    // Check transaction usage
    if (usage.transactions_percentage > 80) {
      return {
        should: true,
        reason: 'high_transaction_usage',
        percentage: usage.transactions_percentage
      };
    }

    // Check if approaching account limit
    if (subscription.max_accounts > 0 && usage.accounts_used >= subscription.max_accounts - 1) {
      return {
        should: true,
        reason: 'approaching_account_limit',
        used: usage.accounts_used,
        limit: subscription.max_accounts
      };
    }

    // Check if frequently hitting category limits
    if (subscription.max_categories > 0 && usage.categories_used >= subscription.max_categories) {
      return {
        should: true,
        reason: 'category_limit_reached',
        used: usage.categories_used,
        limit: subscription.max_categories
      };
    }

    // Check if user is actively using the app (high engagement)
    if (usage.daily_active_days > 20 && subscription.plan_id === 'basic') {
      return {
        should: true,
        reason: 'high_engagement',
        activeDays: usage.daily_active_days
      };
    }

    return false;
  }

  // Check if an offer was recently shown
  wasRecentlyOffered(lastOfferedDate, dayThreshold) {
    if (!lastOfferedDate) return false;
    
    const lastDate = new Date(lastOfferedDate);
    const now = new Date();
    const daysDiff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    
    return daysDiff < dayThreshold;
  }

  // Check if we should show offers in this session
  async shouldShowInSession(userId) {
    try {
      // Get session count
      const sessionCountKey = `${this.SESSION_COUNT_KEY}_${userId}`;
      const sessionCountStr = await AsyncStorage.getItem(sessionCountKey);
      const sessionCount = sessionCountStr ? parseInt(sessionCountStr) : 0;
      
      // Increment session count
      await AsyncStorage.setItem(sessionCountKey, (sessionCount + 1).toString());
      
      // Don't show on first session after account creation
      if (sessionCount < 2) {
        return false;
      }
      
      // Show every 3rd session for basic users
      const subscription = await SubscriptionService.getCurrentSubscription();
      if (subscription?.plan_id === 'basic') {
        return sessionCount % 3 === 0;
      }
      
      // Show every 5th session for other users
      return sessionCount % 5 === 0;
    } catch (error) {
      console.error('Error checking session frequency:', error);
      return true; // Default to showing
    }
  }

  // Get user's offer preferences
  async getOfferPreferences(userId) {
    try {
      const key = `${this.OFFER_PREFERENCES_KEY}_${userId}`;
      const prefsStr = await AsyncStorage.getItem(key);
      
      if (!prefsStr) {
        return {
          disabledOffers: [],
          lastOffered: {},
          neverShow: false
        };
      }
      
      return JSON.parse(prefsStr);
    } catch (error) {
      console.error('Error getting offer preferences:', error);
      return {
        disabledOffers: [],
        lastOffered: {},
        neverShow: false
      };
    }
  }

  // Save user's offer preferences
  async saveOfferPreferences(userId, preferences) {
    try {
      const key = `${this.OFFER_PREFERENCES_KEY}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving offer preferences:', error);
    }
  }

  // Record that an offer was shown
  async recordOfferShown(userId, offerType = null) {
    try {
      // Update last shown timestamp
      const lastShownKey = `${this.LAST_SHOWN_KEY}_${userId}`;
      await AsyncStorage.setItem(lastShownKey, new Date().toISOString());
      
      // Update offer-specific timestamp if provided
      if (offerType) {
        const preferences = await this.getOfferPreferences(userId);
        preferences.lastOffered = preferences.lastOffered || {};
        preferences.lastOffered[offerType] = new Date().toISOString();
        await this.saveOfferPreferences(userId, preferences);
      }
      
      // Record in history
      await this.recordOfferHistory(userId, offerType, 'shown');
    } catch (error) {
      console.error('Error recording offer shown:', error);
    }
  }

  // Record offer interaction history
  async recordOfferHistory(userId, offerType, action) {
    try {
      const key = `${this.OFFER_HISTORY_KEY}_${userId}`;
      const historyStr = await AsyncStorage.getItem(key);
      const history = historyStr ? JSON.parse(historyStr) : [];
      
      history.push({
        type: offerType,
        action: action,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 50 entries
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }
      
      await AsyncStorage.setItem(key, JSON.stringify(history));
    } catch (error) {
      console.error('Error recording offer history:', error);
    }
  }

  // User accepted an offer
  async acceptOffer(userId, offerType) {
    await this.recordOfferHistory(userId, offerType, 'accepted');
  }

  // User declined an offer
  async declineOffer(userId, offerType) {
    await this.recordOfferHistory(userId, offerType, 'declined');
  }

  // User chose to be reminded later
  async remindLater(userId, offerType, daysToWait = 3) {
    try {
      const preferences = await this.getOfferPreferences(userId);
      preferences.remindAfter = preferences.remindAfter || {};
      
      const remindDate = new Date();
      remindDate.setDate(remindDate.getDate() + daysToWait);
      preferences.remindAfter[offerType] = remindDate.toISOString();
      
      await this.saveOfferPreferences(userId, preferences);
      await this.recordOfferHistory(userId, offerType, 'remind_later');
    } catch (error) {
      console.error('Error setting remind later:', error);
    }
  }

  // User chose never to see an offer type
  async neverShowOffer(userId, offerType) {
    try {
      const preferences = await this.getOfferPreferences(userId);
      preferences.disabledOffers = preferences.disabledOffers || [];
      
      if (!preferences.disabledOffers.includes(offerType)) {
        preferences.disabledOffers.push(offerType);
      }
      
      await this.saveOfferPreferences(userId, preferences);
      await this.recordOfferHistory(userId, offerType, 'never_show');
    } catch (error) {
      console.error('Error disabling offer:', error);
    }
  }

  // User chose never to see any offers
  async disableAllOffers(userId) {
    try {
      const preferences = await this.getOfferPreferences(userId);
      preferences.neverShow = true;
      
      await this.saveOfferPreferences(userId, preferences);
      await this.recordOfferHistory(userId, 'all', 'disabled_all');
    } catch (error) {
      console.error('Error disabling all offers:', error);
    }
  }

  // Re-enable offers (e.g., from settings)
  async enableOffers(userId, offerType = null) {
    try {
      const preferences = await this.getOfferPreferences(userId);
      
      if (offerType) {
        // Enable specific offer type
        preferences.disabledOffers = preferences.disabledOffers?.filter(
          type => type !== offerType
        ) || [];
      } else {
        // Enable all offers
        preferences.neverShow = false;
        preferences.disabledOffers = [];
      }
      
      await this.saveOfferPreferences(userId, preferences);
    } catch (error) {
      console.error('Error enabling offers:', error);
    }
  }

  // Get offer statistics for analytics
  async getOfferStats(userId) {
    try {
      const historyKey = `${this.OFFER_HISTORY_KEY}_${userId}`;
      const historyStr = await AsyncStorage.getItem(historyKey);
      const history = historyStr ? JSON.parse(historyStr) : [];
      
      const stats = {
        totalShown: 0,
        accepted: 0,
        declined: 0,
        remindLater: 0,
        byType: {}
      };
      
      history.forEach(entry => {
        if (entry.action === 'shown') stats.totalShown++;
        if (entry.action === 'accepted') stats.accepted++;
        if (entry.action === 'declined') stats.declined++;
        if (entry.action === 'remind_later') stats.remindLater++;
        
        if (!stats.byType[entry.type]) {
          stats.byType[entry.type] = {
            shown: 0,
            accepted: 0,
            declined: 0
          };
        }
        
        if (entry.action === 'shown') stats.byType[entry.type].shown++;
        if (entry.action === 'accepted') stats.byType[entry.type].accepted++;
        if (entry.action === 'declined') stats.byType[entry.type].declined++;
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting offer stats:', error);
      return null;
    }
  }

  // Clear all offer data (for testing or user request)
  async clearOfferData(userId) {
    try {
      const keys = [
        `${this.OFFER_PREFERENCES_KEY}_${userId}`,
        `${this.OFFER_HISTORY_KEY}_${userId}`,
        `${this.LAST_SHOWN_KEY}_${userId}`,
        `${this.SESSION_COUNT_KEY}_${userId}`
      ];
      
      await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
      console.log('✅ Cleared all offer data for user:', userId);
    } catch (error) {
      console.error('Error clearing offer data:', error);
    }
  }
}

export default new SetupOfferService();