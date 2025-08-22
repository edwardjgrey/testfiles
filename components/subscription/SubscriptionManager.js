// Subscription Manager Component
// Create this file: src/components/subscription/SubscriptionManager.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, colors } from '../../styles/globalStyles';
import { translations } from '../../utils/translations';
import SubscriptionService from '../../services/subscriptionService';

const { width } = Dimensions.get('window');

const SubscriptionManager = ({ language, onClose }) => {
  const t = translations[language];
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [usageData, setUsageData] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      const [subscription, plans, usage] = await Promise.all([
        SubscriptionService.getCurrentSubscription(),
        SubscriptionService.getPlans(language),
        SubscriptionService.getUsageAnalytics()
      ]);

      setCurrentSubscription(subscription);
      setAvailablePlans(plans);
      setUsageData(usage);
    } catch (error) {
      console.error('Load subscription data error:', error);
      Alert.alert('Error', 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (plan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  const confirmUpgrade = async () => {
    if (!selectedPlan) return;

    try {
      setUpgradeLoading(true);
      
      const result = await SubscriptionService.changePlan(selectedPlan.plan_id);
      
      if (result.success) {
        Alert.alert(
          'Success!',
          `Successfully upgraded to ${selectedPlan.name} plan`,
          [{ text: 'OK', onPress: () => {
            setShowUpgradeModal(false);
            loadSubscriptionData();
          }}]
        );
      }
    } catch (error) {
      Alert.alert('Upgrade Failed', error.message || 'Failed to upgrade subscription');
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await SubscriptionService.cancelSubscription('user_requested');
              Alert.alert('Subscription Cancelled', result.message);
              loadSubscriptionData();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel subscription');
            }
          }
        }
      ]
    );
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return colors.danger;
    if (percentage >= 70) return colors.warning;
    return colors.primary;
  };

  const renderUsageCard = (title, used, limit, icon) => {
    const percentage = limit === -1 ? 0 : (used / limit) * 100;
    const isUnlimited = limit === -1;
    
    return (
      <View style={styles.usageCard}>
        <View style={styles.usageHeader}>
          <Ionicons name={icon} size={20} color={colors.primary} />
          <Text style={styles.usageTitle}>{title}</Text>
        </View>
        
        <View style={styles.usageContent}>
          <Text style={styles.usageText}>
            {used} {isUnlimited ? '/ Unlimited' : `/ ${limit}`}
          </Text>
          
          {!isUnlimited && (
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: getUsageColor(percentage)
                  }
                ]} 
              />
            </View>
          )}
          
          <Text style={[styles.percentageText, { color: getUsageColor(percentage) }]}>
            {isUnlimited ? 'Unlimited' : `${percentage.toFixed(0)}% used`}
          </Text>
        </View>
      </View>
    );
  };

  const renderPlanCard = (plan) => {
    const isCurrentPlan = currentSubscription?.plan_id === plan.plan_id;
    const canUpgrade = !isCurrentPlan && plan.plan_id !== 'free';
    
    return (
      <View key={plan.plan_id} style={[
        styles.planCard,
        isCurrentPlan && styles.currentPlanCard
      ]}>
        {isCurrentPlan && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>Current Plan</Text>
          </View>
        )}
        
        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.planPrice}>
          {plan.price_kgs === 0 ? 'Free' : `${plan.price_kgs} сом/month`}
        </Text>
        <Text style={styles.planDescription}>{plan.description}</Text>
        
        <View style={styles.featuresContainer}>
          {plan.max_transactions === -1 ? (
            <Text style={styles.featureText}>• Unlimited transactions</Text>
          ) : (
            <Text style={styles.featureText}>• Up to {plan.max_transactions} transactions</Text>
          )}
          
          <Text style={styles.featureText}>• {plan.max_accounts} account{plan.max_accounts > 1 ? 's' : ''}</Text>
          
          {plan.has_ai_analysis && (
            <Text style={styles.featureText}>• AI spending analysis</Text>
          )}
          
          {plan.has_export && (
            <Text style={styles.featureText}>• Data export</Text>
          )}
          
          {plan.has_advanced_charts && (
            <Text style={styles.featureText}>• Advanced charts</Text>
          )}
          
          {plan.has_family_sharing && (
            <Text style={styles.featureText}>• Family sharing</Text>
          )}
          
          {plan.has_priority_support && (
            <Text style={styles.featureText}>• Priority support</Text>
          )}
        </View>
        
        {canUpgrade && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => handleUpgrade(plan)}
          >
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderUpgradeModal = () => (
    <Modal
      visible={showUpgradeModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowUpgradeModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowUpgradeModal(false)}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Upgrade Subscription</Text>
          <View style={{ width: 24 }} />
        </View>
        
        {selectedPlan && (
          <View style={styles.modalContent}>
            <Text style={styles.upgradeTitle}>
              Upgrade to {selectedPlan.name}
            </Text>
            
            <Text style={styles.upgradePrice}>
              {SubscriptionService.formatPrice(selectedPlan.price_kgs, 'KGS')}/month
            </Text>
            
            <Text style={styles.upgradeDescription}>
              {selectedPlan.description}
            </Text>
            
            <View style={styles.upgradeFeatures}>
              <Text style={styles.upgradeFeaturesTitle}>What you'll get:</Text>
              
              {selectedPlan.max_transactions === -1 && (
                <Text style={styles.upgradeFeature}>✓ Unlimited transactions</Text>
              )}
              
              {selectedPlan.has_ai_analysis && (
                <Text style={styles.upgradeFeature}>✓ AI-powered spending insights</Text>
              )}
              
              {selectedPlan.has_export && (
                <Text style={styles.upgradeFeature}>✓ Export your data</Text>
              )}
              
              {selectedPlan.has_advanced_charts && (
                <Text style={styles.upgradeFeature}>✓ Advanced analytics</Text>
              )}
            </View>
            
            <TouchableOpacity
              style={[styles.confirmUpgradeButton, upgradeLoading && styles.buttonDisabled]}
              onPress={confirmUpgrade}
              disabled={upgradeLoading}
            >
              {upgradeLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.confirmUpgradeText}>
                  Upgrade Now
                </Text>
              )}
            </TouchableOpacity>
            
            <Text style={styles.upgradeDisclaimer}>
              You can cancel anytime. Changes take effect immediately.
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading subscription data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content}>
        {/* Current Plan Overview */}
        <View style={styles.currentPlanContainer}>
          <Text style={styles.sectionTitle}>Current Plan</Text>
          
          <View style={styles.currentPlanCard}>
            <Text style={styles.currentPlanName}>
              {currentSubscription?.plan_name || 'Free Plan'}
            </Text>
            
            {currentSubscription?.plan_id !== 'free' && (
              <Text style={styles.currentPlanPrice}>
                {SubscriptionService.formatPrice(currentSubscription?.price_kgs || 0, 'KGS')}/month
              </Text>
            )}
            
            {SubscriptionService.isInTrial() && (
              <Text style={styles.trialText}>
                Trial ends in {SubscriptionService.getTrialDaysRemaining()} days
              </Text>
            )}
            
            {currentSubscription?.subscription_status === 'cancelled' && (
              <Text style={styles.cancelledText}>
                Subscription cancelled - expires {new Date(currentSubscription.current_period_end).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        {/* Usage Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Usage</Text>
          
          <View style={styles.usageGrid}>
            {renderUsageCard(
              'Transactions',
              currentSubscription?.transactions_used || 0,
              currentSubscription?.max_transactions || 100,
              'receipt-outline'
            )}
            
            {renderUsageCard(
              'Budgets',
              currentSubscription?.budgets_used || 0,
              currentSubscription?.max_budgets || 1,
              'pie-chart-outline'
            )}
            
            {renderUsageCard(
              'Goals',
              currentSubscription?.goals_used || 0,
              currentSubscription?.max_goals || 1,
              'trophy-outline'
            )}
            
            {renderUsageCard(
              'Accounts',
              currentSubscription?.accounts_used || 0,
              currentSubscription?.max_accounts || 1,
              'card-outline'
            )}
          </View>
        </View>

        {/* Available Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          
          {availablePlans.map(renderPlanCard)}
        </View>

        {/* Subscription Actions */}
        {currentSubscription?.plan_id !== 'free' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Manage Subscription</Text>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCancelSubscription}
            >
              <Ionicons name="close-circle-outline" size={20} color={colors.danger} />
              <Text style={[styles.actionButtonText, { color: colors.danger }]}>
                Cancel Subscription
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {renderUpgradeModal()}
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text,
    marginTop: 16,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  currentPlanContainer: {
    marginBottom: 30,
  },
  currentPlanCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  currentPlanName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  currentPlanPrice: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 8,
  },
  trialText: {
    fontSize: 14,
    color: colors.warning,
    fontWeight: '500',
  },
  cancelledText: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '500',
  },
  usageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  usageCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  usageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  usageContent: {
    alignItems: 'flex-start',
  },
  usageText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '500',
  },
  planCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  currentPlanCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  currentBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: colors.textDim,
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalContent: {
    padding: 20,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  upgradePrice: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  upgradeDescription: {
    fontSize: 16,
    color: colors.textDim,
    textAlign: 'center',
    marginBottom: 24,
  },
  upgradeFeatures: {
    marginBottom: 32,
  },
  upgradeFeaturesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  upgradeFeature: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  confirmUpgradeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmUpgradeText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  upgradeDisclaimer: {
    fontSize: 14,
    color: colors.textDim,
    textAlign: 'center',
  },
};

export default SubscriptionManager;