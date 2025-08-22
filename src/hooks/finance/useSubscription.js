// src/hooks/finance/useSubscription.js
import { useState, useEffect } from 'react';
import SubscriptionService from '../../services/subscriptionService';

export const useSubscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  // Plan limits based on subscription
  const PLAN_LIMITS = {
    basic: {
      transactions: 150,
      accounts: 2,
      categories: 3,
      budgets: 2,
      goals: 2,
      recurringTransactions: 2,
      subscriptionTracking: 2,
      spendingLimits: 1
    },
    plus: {
      transactions: -1, // unlimited
      accounts: -1,
      categories: -1,
      budgets: -1,
      goals: -1,
      recurringTransactions: -1,
      subscriptionTracking: -1,
      spendingLimits: -1
    },
    pro: {
      transactions: -1,
      accounts: 5,
      categories: -1,
      budgets: -1,
      goals: -1,
      recurringTransactions: -1,
      subscriptionTracking: -1,
      spendingLimits: -1
    }
  };

  // Features available by plan
  const PLAN_FEATURES = {
    basic: {
      aiInsights: false,
      receiptScanning: false,
      dataExport: false,
      advancedAnalytics: false,
      taxTracking: false,
      sharedBudgets: false,
      prioritySupport: false,
      calendarIntegration: false,
      weatherInsights: false,
      priceComparison: false
    },
    plus: {
      aiInsights: true,
      receiptScanning: true,
      dataExport: true,
      advancedAnalytics: true,
      taxTracking: false,
      sharedBudgets: false,
      prioritySupport: false,
      calendarIntegration: false,
      weatherInsights: false,
      priceComparison: false
    },
    pro: {
      aiInsights: true,
      receiptScanning: true,
      dataExport: true,
      advancedAnalytics: true,
      taxTracking: true,
      sharedBudgets: true,
      prioritySupport: true,
      calendarIntegration: true,
      weatherInsights: true,
      priceComparison: true
    }
  };

  // Load subscription data
  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const subscriptionData = await SubscriptionService.getCurrentSubscription();
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Load subscription error:', error);
      // Default to basic plan if error
      setSubscription({
        plan_id: 'basic',
        transactions_used: 0,
        accounts_used: 0,
        budgets_used: 0,
        goals_used: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Get current plan
  const currentPlan = subscription?.plan_id || 'basic';

  // Get plan limits
  const planLimits = PLAN_LIMITS[currentPlan];

  // Get current usage
  const usage = {
    transactions: subscription?.transactions_used || 0,
    accounts: subscription?.accounts_used || 0,
    budgets: subscription?.budgets_used || 0,
    goals: subscription?.goals_used || 0
  };

  // Get plan features
  const features = PLAN_FEATURES[currentPlan];

  // Check if user can perform an action
  const canPerformAction = (action) => {
    const limit = planLimits[action];
    const currentUsage = usage[action] || 0;

    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true, remaining: Infinity };
    }

    const allowed = currentUsage < limit;
    const remaining = Math.max(0, limit - currentUsage);

    return { allowed, remaining, limit };
  };

  // Track usage
  const trackUsage = async (action, count = 1) => {
    try {
      await SubscriptionService.incrementUsage(action, count);
      // Update local state
      setSubscription(prev => ({
        ...prev,
        [`${action}_used`]: (prev[`${action}_used`] || 0) + count
      }));
    } catch (error) {
      console.error('Track usage error:', error);
    }
  };

  // Check if should show upgrade prompt
  const shouldShowUpgradePrompt = (action) => {
    if (currentPlan !== 'basic') return false;
    
    const { allowed, remaining, limit } = canPerformAction(action);
    
    // Show prompt if at limit or close to limit
    return !allowed || (remaining <= limit * 0.2);
  };

  return {
    // Subscription data
    subscription,
    currentPlan,
    planLimits,
    usage,
    features,
    loading,
    
    // Actions
    canPerformAction,
    trackUsage,
    loadSubscription,
    
    // Helpers
    shouldShowUpgradePrompt
  };
};