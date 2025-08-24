// src/components/offers/PlanUpgradeOffer.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SubscriptionService from '../../services/subscriptionService';

const { width } = Dimensions.get('window');

const PlanUpgradeOffer = ({ 
  visible, 
  onClose, 
  onUpgrade, 
  language = 'en',
  currentUsage = null 
}) => {
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [recommendedPlan, setRecommendedPlan] = useState(null);
  const [usageStats, setUsageStats] = useState(null);

  useEffect(() => {
    if (visible) {
      loadUpgradeData();
    }
  }, [visible]);

  const loadUpgradeData = async () => {
    try {
      setLoading(true);
      
      // Get current subscription and usage
      const subscription = await SubscriptionService.getCurrentSubscription();
      const usage = currentUsage || await SubscriptionService.getUsageAnalytics();
      
      setCurrentPlan(subscription);
      setUsageStats(usage);
      
      // Determine recommended plan based on usage
      const recommended = determineRecommendedPlan(subscription, usage);
      setRecommendedPlan(recommended);
      
    } catch (error) {
      console.error('Error loading upgrade data:', error);
    } finally {
      setLoading(false);
    }
  };

  const determineRecommendedPlan = (subscription, usage) => {
    if (subscription?.plan_id === 'basic') {
      // Check if user needs Plus features
      if (usage?.transactions_percentage > 70 || 
          usage?.accounts_used >= 2 ||
          usage?.categories_used >= 5) {
        return 'plus';
      }
    } else if (subscription?.plan_id === 'plus') {
      // Check if user needs Pro features
      if (usage?.accounts_used >= 3 ||
          usage?.family_members_requested ||
          usage?.advanced_features_requested) {
        return 'pro';
      }
    }
    
    return 'plus'; // Default recommendation
  };

  const getText = (key) => {
    const texts = {
      en: {
        title: 'Unlock More Features',
        subtitle: "You're using Akchabar like a pro!",
        currentPlan: 'Current Plan',
        recommended: 'Recommended',
        upgradeNow: 'Upgrade Now',
        remindLater: 'Remind Me Later',
        neverShow: "Don't Show Again",
        approaching: 'Approaching Limits',
        unlimited: 'Unlimited',
        features: 'Features',
        whyUpgrade: 'Why Upgrade?',
        usageHigh: 'Your usage is high',
        transactions: 'Transactions',
        accounts: 'Accounts',
        categories: 'Categories',
        plusBenefits: [
          'Unlimited transactions',
          'AI-powered insights',
          'Export your data',
          'Advanced analytics',
          'Priority support'
        ],
        proBenefits: [
          'Everything in Plus',
          'Family sharing (5 members)',
          '5 financial accounts',
          'Advanced AI predictions',
          '24/7 priority support'
        ],
        specialOffer: 'Special Offer',
        firstMonth: 'First month 50% off!',
        limitedTime: 'Limited time offer'
      },
      ru: {
        title: 'Разблокируйте больше функций',
        subtitle: 'Вы используете Akchabar как профессионал!',
        currentPlan: 'Текущий план',
        recommended: 'Рекомендуется',
        upgradeNow: 'Обновить сейчас',
        remindLater: 'Напомнить позже',
        neverShow: 'Больше не показывать',
        approaching: 'Приближение к лимитам',
        unlimited: 'Безлимитный',
        features: 'Функции',
        whyUpgrade: 'Почему стоит обновиться?',
        usageHigh: 'Ваше использование высокое',
        transactions: 'Транзакции',
        accounts: 'Счета',
        categories: 'Категории',
        plusBenefits: [
          'Безлимитные транзакции',
          'ИИ-аналитика',
          'Экспорт данных',
          'Расширенная аналитика',
          'Приоритетная поддержка'
        ],
        proBenefits: [
          'Все из Plus',
          'Семейный доступ (5 человек)',
          '5 финансовых счетов',
          'Продвинутые ИИ-прогнозы',
          'Поддержка 24/7'
        ],
        specialOffer: 'Специальное предложение',
        firstMonth: 'Первый месяц со скидкой 50%!',
        limitedTime: 'Ограниченное предложение'
      },
      ky: {
        title: 'Көбүрөөк функцияларды ачыңыз',
        subtitle: 'Сиз Akchabar\'ды профессионалдай колдонуп жатасыз!',
        currentPlan: 'Учурдагы план',
        recommended: 'Сунушталат',
        upgradeNow: 'Азыр жаңыртуу',
        remindLater: 'Кийинчерээк эскертүү',
        neverShow: 'Дагы көрсөтпөө',
        approaching: 'Чектөөлөргө жакындоо',
        unlimited: 'Чексиз',
        features: 'Функциялар',
        whyUpgrade: 'Эмне үчүн жаңыртуу керек?',
        usageHigh: 'Сиздин колдонуу жогору',
        transactions: 'Транзакциялар',
        accounts: 'Эсептер',
        categories: 'Категориялар',
        plusBenefits: [
          'Чексиз транзакциялар',
          'AI-аналитика',
          'Маалымат экспорту',
          'Өркүндөтүлгөн аналитика',
          'Артыкчылыктуу колдоо'
        ],
        proBenefits: [
          'Plus\'тагы бардыгы',
          'Үй-бүлөлүк кирүү (5 адам)',
          '5 каржылык эсеп',
          'Өркүндөтүлгөн AI божомолдоо',
          '24/7 колдоо'
        ],
        specialOffer: 'Атайын сунуш',
        firstMonth: 'Биринчи ай 50% арзандатуу!',
        limitedTime: 'Чектелген убакыт'
      }
    };
    
    return texts[language]?.[key] || texts.en[key];
  };

  const renderUsageBar = (used, limit, label) => {
    const percentage = limit === -1 ? 0 : (used / limit) * 100;
    const isUnlimited = limit === -1;
    const color = percentage >= 80 ? '#ef4444' : percentage >= 60 ? '#f59e0b' : '#10b981';
    
    return (
      <View style={styles.usageItem}>
        <View style={styles.usageHeader}>
          <Text style={styles.usageLabel}>{label}</Text>
          <Text style={styles.usageText}>
            {used} / {isUnlimited ? getText('unlimited') : limit}
          </Text>
        </View>
        <View style={styles.usageBar}>
          <View 
            style={[
              styles.usageProgress, 
              { 
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: color
              }
            ]} 
          />
        </View>
      </View>
    );
  };

  const renderPlanCard = (planId, isRecommended = false) => {
    const planDetails = {
      plus: {
        name: 'Plus',
        price: '299 сом',
        period: '/month',
        color: '#3b82f6',
        icon: 'star',
        benefits: getText('plusBenefits')
      },
      pro: {
        name: 'Pro',
        price: '499 сом',
        period: '/month',
        color: '#7c3aed',
        icon: 'crown',
        benefits: getText('proBenefits')
      }
    };
    
    const plan = planDetails[planId];
    if (!plan) return null;
    
    return (
      <View style={[
        styles.planCard,
        isRecommended && styles.recommendedCard,
        { borderColor: isRecommended ? plan.color : '#374151' }
      ]}>
        {isRecommended && (
          <View style={[styles.recommendedBadge, { backgroundColor: plan.color }]}>
            <Text style={styles.recommendedText}>{getText('recommended')}</Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          <View style={[styles.planIcon, { backgroundColor: plan.color + '20' }]}>
            <Ionicons name={plan.icon} size={24} color={plan.color} />
          </View>
          <Text style={styles.planName}>{plan.name}</Text>
        </View>
        
        <View style={styles.planPricing}>
          <Text style={styles.planPrice}>{plan.price}</Text>
          <Text style={styles.planPeriod}>{plan.period}</Text>
        </View>
        
        <View style={styles.planBenefits}>
          {plan.benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={16} color={plan.color} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>
        
        {isRecommended && (
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: plan.color }]}
            onPress={() => onUpgrade(planId)}
          >
            <Text style={styles.upgradeButtonText}>{getText('upgradeNow')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#98DDA6" />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={styles.title}>{getText('title')}</Text>
              <Text style={styles.subtitle}>{getText('subtitle')}</Text>
            </View>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Special Offer Banner */}
            <View style={styles.offerBanner}>
              <Ionicons name="gift" size={24} color="#f59e0b" />
              <View style={styles.offerText}>
                <Text style={styles.offerTitle}>{getText('specialOffer')}</Text>
                <Text style={styles.offerSubtitle}>{getText('firstMonth')}</Text>
                <Text style={styles.offerLimit}>{getText('limitedTime')}</Text>
              </View>
            </View>
            
            {/* Usage Statistics */}
            <View style={styles.usageSection}>
              <Text style={styles.sectionTitle}>{getText('whyUpgrade')}</Text>
              <Text style={styles.usageHighText}>{getText('usageHigh')}:</Text>
              
              {usageStats && (
                <>
                  {renderUsageBar(
                    usageStats.transactions_used || 0,
                    currentPlan?.max_transactions || 150,
                    getText('transactions')
                  )}
                  {renderUsageBar(
                    usageStats.accounts_used || 0,
                    currentPlan?.max_accounts || 2,
                    getText('accounts')
                  )}
                  {renderUsageBar(
                    usageStats.categories_used || 0,
                    currentPlan?.max_categories || 5,
                    getText('categories')
                  )}
                </>
              )}
            </View>
            
            {/* Plan Cards */}
            <View style={styles.plansSection}>
              {recommendedPlan === 'plus' && renderPlanCard('plus', true)}
              {recommendedPlan === 'pro' && renderPlanCard('pro', true)}
              {recommendedPlan !== 'plus' && renderPlanCard('plus', false)}
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.remindButton}
                onPress={() => {
                  onClose();
                  // Schedule reminder for later
                }}
              >
                <Text style={styles.remindButtonText}>{getText('remindLater')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.neverButton}
                onPress={() => {
                  onClose();
                  // Mark as never show again
                }}
              >
                <Text style={styles.neverButtonText}>{getText('neverShow')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#05212a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  loadingContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  offerBanner: {
    flexDirection: 'row',
    backgroundColor: '#7c2d12',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  offerText: {
    flex: 1,
    marginLeft: 12,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fed7aa',
  },
  offerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 4,
  },
  offerLimit: {
    fontSize: 12,
    color: '#fdba74',
    marginTop: 2,
    fontStyle: 'italic',
  },
  usageSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  usageHighText: {
    fontSize: 14,
    color: '#f59e0b',
    marginBottom: 16,
  },
  usageItem: {
    marginBottom: 16,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  usageLabel: {
    fontSize: 14,
    color: '#d1d5db',
  },
  usageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  usageBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  usageProgress: {
    height: '100%',
    borderRadius: 4,
  },
  plansSection: {
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    position: 'relative',
  },
  recommendedCard: {
    borderWidth: 2,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  planPeriod: {
    fontSize: 16,
    color: '#9ca3af',
    marginLeft: 4,
  },
  planBenefits: {
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#d1d5db',
    marginLeft: 8,
    flex: 1,
  },
  upgradeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  actions: {
    marginTop: 20,
    marginBottom: 20,
  },
  remindButton: {
    backgroundColor: '#374151',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  remindButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  neverButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  neverButtonText: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'underline',
  },
});

export default PlanUpgradeOffer;