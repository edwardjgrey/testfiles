// Frontend Subscription Service
// Create this file: src/services/subscriptionService.js

import ApiService from './apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SubscriptionService {
  constructor() {
    this.currentSubscription = null;
    this.subscriptionPlans = null;
  }

  // Get all available subscription plans
  async getPlans(language = 'en') {
    try {
      const response = await ApiService.makeRequest(`/subscriptions/plans?language=${language}`);
      this.subscriptionPlans = response.plans;
      return response.plans;
    } catch (error) {
      console.error('Get plans error:', error);
      throw error;
    }
  }

  // Get user's current subscription
  async getCurrentSubscription() {
    try {
      const response = await ApiService.makeRequest('/subscriptions/current');
      this.currentSubscription = response.subscription;
      
      // Cache subscription data
      await AsyncStorage.setItem('userSubscription', JSON.stringify(response.subscription));
      
      return response.subscription;
    } catch (error) {
      console.error('Get current subscription error:', error);
      // Try to get cached data if API fails
      const cached = await AsyncStorage.getItem('userSubscription');
      if (cached) {
        this.currentSubscription = JSON.parse(cached);
        return this.currentSubscription;
      }
      throw error;
    }
  }

  // Check if user can perform an action
  async checkLimit(feature) {
    try {
      const response = await ApiService.makeRequest('/subscriptions/check-limit', {
        method: 'POST',
        body: JSON.stringify({ feature })
      });
      return response;
    } catch (error) {
      console.error('Check limit error:', error);
      return { allowed: false, error: 'Failed to check limit' };
    }
  }

  // Increment usage counter when user performs an action
  async incrementUsage(feature, count = 1) {
    try {
      const response = await ApiService.makeRequest('/subscriptions/increment-usage', {
        method: 'POST',
        body: JSON.stringify({ feature, count })
      });
      return response;
    } catch (error) {
      console.error('Increment usage error:', error);
      throw error;
    }
  }

  // Change subscription plan
  async changePlan(newPlanId, paymentMethodId = null) {
    try {
      const response = await ApiService.makeRequest('/subscriptions/change-plan', {
        method: 'POST',
        body: JSON.stringify({ newPlanId, paymentMethodId })
      });
      
      // Refresh subscription data
      await this.getCurrentSubscription();
      
      return response;
    } catch (error) {
      console.error('Change plan error:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(reason = '') {
    try {
      const response = await ApiService.makeRequest('/subscriptions/cancel', {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      
      // Refresh subscription data
      await this.getCurrentSubscription();
      
      return response;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }

  // Get usage analytics
  async getUsageAnalytics() {
    try {
      const response = await ApiService.makeRequest('/subscriptions/usage');
      return response;
    } catch (error) {
      console.error('Get usage analytics error:', error);
      throw error;
    }
  }

  // Check if user has access to a specific feature
  hasFeatureAccess(featureName) {
    if (!this.currentSubscription) {
      return false;
    }
    return this.currentSubscription[featureName] || false;
  }

  // Check if user is at limit for a feature
  isAtLimit(featureName) {
    if (!this.currentSubscription) {
      return true;
    }

    const limit = this.currentSubscription[`max_${featureName}`];
    const usage = this.currentSubscription[`${featureName}_used`];

    // -1 means unlimited
    if (limit === -1) {
      return false;
    }

    return usage >= limit;
  }

  // Get remaining usage for a feature
  getRemainingUsage(featureName) {
    if (!this.currentSubscription) {
      return 0;
    }

    const limit = this.currentSubscription[`max_${featureName}`];
    const usage = this.currentSubscription[`${featureName}_used`];

    // -1 means unlimited
    if (limit === -1) {
      return Infinity;
    }

    return Math.max(0, limit - usage);
  }

  // Get usage percentage for a feature
  getUsagePercentage(featureName) {
    if (!this.currentSubscription) {
      return 100;
    }

    const limit = this.currentSubscription[`max_${featureName}`];
    const usage = this.currentSubscription[`${featureName}_used`];

    // -1 means unlimited
    if (limit === -1) {
      return 0;
    }

    return (usage / limit) * 100;
  }

  // Get user's current plan
  getCurrentPlan() {
    return this.currentSubscription?.plan_id || 'basic';
  }

  // Check if user is on basic plan
  isBasicPlan() {
    return this.getCurrentPlan() === 'basic';
  }

  // Check if user is on plus plan
  isPlusPlan() {
    return this.getCurrentPlan() === 'plus';
  }

  // Check if user is on pro plan
  isProPlan() {
    return this.getCurrentPlan() === 'pro';
  }

  // Get plan display name
  getPlanDisplayName(language = 'en') {
    if (!this.currentSubscription) {
      return 'Basic';
    }
    return this.currentSubscription.plan_name || 'Basic';
  }

  // Check if subscription is active
  isSubscriptionActive() {
    return this.currentSubscription?.subscription_status === 'active';
  }

  // Check if subscription is cancelled
  isSubscriptionCancelled() {
    return this.currentSubscription?.subscription_status === 'cancelled';
  }

  // Check if user is in trial period
  isInTrial() {
    if (!this.currentSubscription?.trial_end) {
      return false;
    }
    return new Date(this.currentSubscription.trial_end) > new Date();
  }

  // Get days remaining in trial
  getTrialDaysRemaining() {
    if (!this.isInTrial()) {
      return 0;
    }
    
    const trialEnd = new Date(this.currentSubscription.trial_end);
    const now = new Date();
    const diffTime = trialEnd - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  // Get subscription renewal date
  getRenewalDate() {
    return this.currentSubscription?.current_period_end;
  }

  // Format currency based on user's preference
  formatPrice(amount, currency = 'KGS') {
    const formatters = {
      KGS: (amt) => `${amt} сом`,
      USD: (amt) => `${amt}`,
      EUR: (amt) => `€${amt}`,
      RUB: (amt) => `${amt} ₽`
    };
    
    return formatters[currency] ? formatters[currency](amount) : `${amount} ${currency}`;
  }

  // Get recommended upgrade plan
  getRecommendedUpgrade() {
    const currentPlan = this.getCurrentPlan();
    
    if (currentPlan === 'basic') {
      return 'plus';
    } else if (currentPlan === 'plus') {
      return 'pro';
    }
    
    return null;
  }

  // Clear cached subscription data
  async clearCache() {
    this.currentSubscription = null;
    this.subscriptionPlans = null;
    await AsyncStorage.removeItem('userSubscription');
  }

  // Validate subscription action before performing
  async validateAction(action, featureName = null) {
    try {
      // Refresh subscription data
      await this.getCurrentSubscription();

      const validations = {
        create_transaction: () => this.checkLimit('max_transactions'),
        create_budget: () => this.checkLimit('max_budgets'),
        create_goal: () => this.checkLimit('max_goals'),
        create_account: () => this.checkLimit('max_accounts'),
        create_category: () => this.checkLimit('max_categories'),
        export_data: () => ({ allowed: this.hasFeatureAccess('has_export') }),
        ai_analysis: () => ({ allowed: this.hasFeatureAccess('has_ai_analysis') }),
        advanced_charts: () => ({ allowed: this.hasFeatureAccess('has_advanced_charts') }),
        bill_reminders: () => ({ allowed: this.hasFeatureAccess('has_bill_reminders') }),
        investment_tracking: () => ({ allowed: this.hasFeatureAccess('has_investment_tracking') }),
        family_sharing: () => ({ allowed: this.hasFeatureAccess('has_family_sharing') }),
        custom_categories: () => ({ allowed: this.hasFeatureAccess('has_custom_categories') }),
        bank_sync: () => ({ allowed: this.hasFeatureAccess('has_bank_sync') }),
        receipt_scanning: () => ({ allowed: this.hasFeatureAccess('has_receipt_scanning') })
      };

      if (validations[action]) {
        return await validations[action]();
      }

      return { allowed: true };
    } catch (error) {
      console.error('Validate action error:', error);
      return { allowed: false, error: 'Validation failed' };
    }
  }

  // Perform action with automatic usage tracking
  async performAction(action, featureName, additionalData = {}) {
    try {
      // Validate first
      const validation = await this.validateAction(action, featureName);
      
      if (!validation.allowed) {
        return {
          success: false,
          error: validation.error,
          upgradeRequired: true,
          currentPlan: this.getCurrentPlan(),
          recommendedPlan: this.getRecommendedUpgrade()
        };
      }

      // Increment usage if it's a countable action
      const countableActions = ['create_transaction', 'create_budget', 'create_goal', 'create_account', 'create_category'];
      
      if (countableActions.includes(action)) {
        await this.incrementUsage(featureName, 1);
      }

      return {
        success: true,
        action,
        featureName,
        data: additionalData
      };
    } catch (error) {
      console.error('Perform action error:', error);
      return {
        success: false,
        error: error.message || 'Action failed'
      };
    }
  }
}

export default new SubscriptionService();