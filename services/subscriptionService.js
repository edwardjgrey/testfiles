// Updated subscriptionService.js for Basic/Plus/Pro plans
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

  // Get plan benefits for display
  getPlanBenefits(planId) {
    const benefits = {
      basic: [
        '100 transactions per month',
        '1 financial account',
        '5 categories',
        '1 budget & 1 goal',
        'Basic charts and reports'
      ],
      plus: [
        'Unlimited transactions',
        '3 financial accounts',
        'Unlimited categories',
        'Unlimited budgets & goals',
        'AI spending analysis',
        'Data export',
        'Advanced charts',
        'Bill reminders',
        'Investment tracking',
        'Custom categories',
        'Bank sync',
        'Receipt scanning'
      ],
      pro: [
        'Everything in Plus',
        '5 financial accounts',
        'Family sharing (5 members)',
        'Priority support',
        'Advanced AI insights',
        'All premium features'
      ]
    };

    return benefits[planId] || [];
  }

  // Get plan pricing
  getPlanPricing() {
    return {
      basic: { kgs: 0, usd: 0, period: 'Forever' },
      plus: { kgs: 299, usd: 3, period: 'Monthly' },
      pro: { kgs: 499, usd: 6, period: 'Monthly' }
    };
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

  // Show upgrade prompt with plan comparison
  getUpgradePrompt(blockedFeature) {
    const currentPlan = this.getCurrentPlan();
    const recommendedPlan = this.getRecommendedUpgrade();
    
    if (!recommendedPlan) {
      return null;
    }

    const prompts = {
      basic: {
        title: 'Upgrade to Plus',
        message: 'Unlock unlimited transactions, AI analysis, and advanced features',
        price: '299 сом/month',
        features: ['Unlimited transactions', 'AI spending analysis', 'Data export', 'Advanced charts']
      },
      plus: {
        title: 'Upgrade to Pro',
        message: 'Get family sharing, priority support, and all premium features',
        price: '499 сом/month',
        features: ['Family sharing (5 members)', 'Priority support', 'Advanced AI insights', '5 accounts']
      }
    };

    return prompts[currentPlan];
  }

  // Handle subscription errors
  handleSubscriptionError(error) {
    const errorMessages = {
      'USAGE_LIMIT_REACHED': 'You have reached your plan limit. Please upgrade to continue.',
      'FEATURE_NOT_AVAILABLE': 'This feature is not available in your current plan.',
      'SUBSCRIPTION_EXPIRED': 'Your subscription has expired. Please renew to continue.',
      'PAYMENT_FAILED': 'Payment failed. Please update your payment method.',
      'SUBSCRIPTION_CANCELLED': 'Your subscription has been cancelled.'
    };

    return errorMessages[error.code] || error.message || 'An error occurred with your subscription.';
  }

  // Get subscription status badge
  getStatusBadge() {
    if (!this.currentSubscription) {
      return { text: 'No Subscription', color: '#ef4444' };
    }

    const status = this.currentSubscription.subscription_status;
    const planName = this.getCurrentPlan().charAt(0).toUpperCase() + this.getCurrentPlan().slice(1);

    const badges = {
      active: { text: `${planName} Plan`, color: '#10b981' },
      cancelled: { text: 'Cancelled', color: '#f59e0b' },
      expired: { text: 'Expired', color: '#ef4444' },
      trial: { text: `${planName} Trial`, color: '#3b82f6' }
    };

    if (this.isInTrial()) {
      return badges.trial;
    }

    return badges[status] || badges.active;
  }

  // Analytics for subscription usage
  async getSubscriptionAnalytics() {
    try {
      const analytics = await this.getUsageAnalytics();
      
      return {
        ...analytics,
        planEfficiency: this.calculatePlanEfficiency(analytics.usage),
        upgradeRecommendation: this.getUpgradeRecommendation(analytics.usage),
        costSavings: this.calculateCostSavings()
      };
    } catch (error) {
      console.error('Get subscription analytics error:', error);
      return null;
    }
  }

  // Calculate how efficiently user is using their plan
  calculatePlanEfficiency(usage) {
    const features = Object.keys(usage);
    let totalEfficiency = 0;
    let featureCount = 0;

    features.forEach(feature => {
      if (usage[feature].limit !== -1) {
        const efficiency = usage[feature].percentage;
        totalEfficiency += efficiency;
        featureCount++;
      }
    });

    return featureCount > 0 ? totalEfficiency / featureCount : 0;
  }

  // Get personalized upgrade recommendation
  getUpgradeRecommendation(usage) {
    const currentPlan = this.getCurrentPlan();
    
    if (currentPlan === 'pro') {
      return null;
    }

    // Check if user is close to limits
    const highUsageFeatures = Object.keys(usage).filter(feature => 
      usage[feature].percentage > 80 && usage[feature].limit !== -1
    );

    if (highUsageFeatures.length > 0) {
      return {
        reason: 'limit_approaching',
        message: `You're using ${highUsageFeatures.length} feature${highUsageFeatures.length > 1 ? 's' : ''} heavily`,
        recommendedPlan: this.getRecommendedUpgrade(),
        urgency: 'high'
      };
    }

    return null;
  }

  // Calculate potential cost savings
  calculateCostSavings() {
    const currentPlan = this.getCurrentPlan();
    
    if (currentPlan === 'basic') {
      // Calculate savings from manual tracking vs automated features
      return {
        timesSaved: '5 hours/month',
        moneySaved: 'Up to 2000 сом/month',
        features: ['Automated categorization', 'Spending alerts', 'Budget tracking']
      };
    }

    return null;
  }
}

export default new SubscriptionService();