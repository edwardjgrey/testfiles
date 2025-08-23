// src/components/auth/SubscriptionPlans.js - COMPLETE ENHANCED VERSION
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Modal,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../../styles/globalStyles';
import { translations } from '../../utils/translations';
import LanguageSelector from '../common/LanguageSelector';

const { width } = Dimensions.get('window');

const SubscriptionPlans = ({ 
  authData = {},
  language = 'en',
  setLanguage = () => {},
  navigateAuth = () => {}
}) => {
  const t = translations[language] || translations.en || {};
  
  const [selectedPlan, setSelectedPlan] = useState(authData?.selectedPlan || 'basic');
  const [selectedCurrency, setSelectedCurrency] = useState(authData?.currency || 'KGS');
  const [selectedTab, setSelectedTab] = useState('features');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const currencies = [
    { code: 'KGS', symbol: 'сом', rate: 1, flag: '🇰🇬' },
    { code: 'USD', symbol: '$', rate: 0.011, flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', rate: 0.010, flag: '🇪🇺' },
    { code: 'GBP', symbol: '£', rate: 0.009, flag: '🇬🇧' },
    { code: 'RUB', symbol: '₽', rate: 1.1, flag: '🇷🇺' },
    { code: 'KZT', symbol: '₸', rate: 5.2, flag: '🇰🇿' },
    { code: 'UZS', symbol: 'сўм', rate: 140, flag: '🇺🇿' },
  ];

  const convertPrice = (priceInKGS) => {
    if (priceInKGS === 0) return 0;
    const currency = currencies.find(c => c.code === selectedCurrency) || currencies[0];
    const converted = Math.round(priceInKGS * currency.rate);
    return converted;
  };

  const formatPrice = (price) => {
    const currency = currencies.find(c => c.code === selectedCurrency) || currencies[0];
    if (price === 0) {
      return language === 'ru' ? 'Бесплатно' : language === 'ky' ? 'Акысыз' : 'Free';
    }
    return `${price} ${currency.symbol}`;
  };

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      nameRu: 'Базовый',
      nameKy: 'Негизги',
      price: 0,
      period: language === 'ru' ? 'навсегда' : language === 'ky' ? 'түбөлүккө' : 'forever',
      badge: null,
      description: language === 'ru' ? 'Идеально для начинающих' : language === 'ky' ? 'Башталгычтар үчүн эң жакшы' : 'Perfect for getting started',
      features: language === 'ru' ? [
        '150 транзакций в месяц',
        '2 финансовых счета',
        '5 базовых категорий',
        '2 бюджета и 2 цели',
        'Базовые отчеты и графики',
        'Основная аналитика трат',
        'Мобильное приложение',
        'Базовая поддержка'
      ] : language === 'ky' ? [
        'Айына 150 транзакция',
        '2 каржылык эсеп',
        '5 негизги категория',
        '2 бюджет жана 2 максат',
        'Негизги отчеттор жана графиктер',
        'Негизги чыгым анализи',
        'Мобилдик тиркеме',
        'Негизги колдоо'
      ] : [
        '150 transactions per month',
        '2 financial accounts',
        '5 essential categories',
        '2 budgets & 2 goals',
        'Basic charts and reports',
        'Essential spending insights',
        'Mobile app access',
        'Standard support'
      ],
      popular: false,
      color: '#6b7280'
    },
    {
      id: 'plus',
      name: 'Plus',
      nameRu: 'Плюс',
      nameKy: 'Плюс',
      price: 299,
      period: language === 'ru' ? 'в месяц' : language === 'ky' ? 'айына' : 'per month',
      badge: language === 'ru' ? 'Популярный' : language === 'ky' ? 'Популярдуу' : 'Most Popular',
      description: language === 'ru' ? 'Для активных пользователей' : language === 'ky' ? 'Активдүү колдонуучулар үчүн' : 'For active money managers',
      features: language === 'ru' ? [
        'Неограниченные транзакции',
        '3 финансовых счета',
        'Неограниченные категории',
        'Неограниченные бюджеты и цели',
        'AI анализ трат и доходов',
        'Экспорт данных (CSV, PDF)',
        'Продвинутые графики и отчеты',
        'Напоминания о счетах',
        'Отслеживание инвестиций',
        'Интеграция с банками',
        'Сканирование чеков',
        'Приоритетная поддержка'
      ] : language === 'ky' ? [
        'Чексиз транзакцилар',
        '3 каржылык эсеп',
        'Чексиз категориялар',
        'Чексиз бюджеттер жана максаттар',
        'AI чыгым анализи',
        'Маалымат экспорт (CSV, PDF)',
        'Өркүндөтүлгөн графиктер',
        'Эсеп эскертүүлөрү',
        'Инвестиция көзөмөлдөө',
        'Банк интеграциясы',
        'Чек сканерлөө',
        'Биринчи кезектеги колдоо'
      ] : [
        'Unlimited transactions',
        '3 financial accounts',
        'Unlimited categories',
        'Unlimited budgets & goals',
        'AI spending analysis',
        'Data export (CSV, PDF)',
        'Advanced charts & reports',
        'Bill reminders & alerts',
        'Investment tracking',
        'Bank account sync',
        'Receipt scanning',
        'Priority support'
      ],
      popular: true,
      color: '#3b82f6'
    },
    {
      id: 'pro',
      name: 'Pro',
      nameRu: 'Про',
      nameKy: 'Про',
      price: 499,
      period: language === 'ru' ? 'в месяц' : language === 'ky' ? 'айына' : 'per month',
      badge: language === 'ru' ? 'Максимум' : language === 'ky' ? 'Максимум' : 'Premium',
      description: language === 'ru' ? 'Для семей и бизнеса' : language === 'ky' ? 'Үй-бүлөлөр жана бизнес үчүн' : 'For families & businesses',
      features: language === 'ru' ? [
        'Все функции Plus',
        '5 финансовых счетов',
        'Семейный доступ (5 человек)',
        'Продвинутый AI анализ и прогнозы',
        'Налоговые категории и отчеты',
        'Планирование бюджета на год',
        'Персональный финансовый консультант',
        'Интеграция с бухгалтерией',
        'Приоритетная поддержка 24/7',
        'Индивидуальные консультации',
        'Расширенная аналитика',
        'Кастомные уведомления'
      ] : language === 'ky' ? [
        'Плюстун бардык функциялары',
        '5 каржылык эсеп',
        'Үй-бүлөлүк кирүү (5 адам)',
        'Өркүндөтүлгөн AI анализ',
        'Салык категориялары',
        'Жылдык бюджет пландоо',
        'Жеке каржылык кеңешчи',
        'Эсептөө интеграциясы',
        'Биринчи кезектеги колдоо 24/7',
        'Жеке кеңеш берүү',
        'Кеңейтилген аналитика',
        'Жеке билдирүүлөр'
      ] : [
        'Everything in Plus',
        '5 financial accounts',
        'Family sharing (5 members)',
        'Advanced AI insights & forecasts',
        'Tax categories & reporting',
        'Annual budget planning',
        'Personal finance advisor',
        'Accounting software integration',
        'Priority 24/7 support',
        'One-on-one consultations',
        'Advanced analytics dashboard',
        'Custom notifications & alerts'
      ],
      popular: false,
      color: '#7c3aed'
    }
  ];

  const handleContinue = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      navigateAuth('financial', { 
        selectedPlan, 
        currency: selectedCurrency 
      });
    } catch (error) {
      console.error('Continue error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigateAuth('profile');
  };

  const getPlanName = (plan) => {
    if (language === 'ru') return plan.nameRu;
    if (language === 'ky') return plan.nameKy;
    return plan.name;
  };

  const selectedCurrencyData = currencies.find(c => c.code === selectedCurrency) || currencies[0];

  const renderTabContent = (plan) => {
    switch (selectedTab) {
      case 'features':
        return (
          <View style={styles.featuresContainer}>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={plan.color} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        );
      
      case 'pricing':
        return (
          <View style={styles.pricingContainer}>
            <View style={styles.priceBreakdown}>
              <Text style={styles.priceBreakdownTitle}>
                {language === 'ru' ? 'Детали цены' : language === 'ky' ? 'Баа чоо-жайы' : 'Pricing Details'}
              </Text>
              
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  {language === 'ru' ? 'Ежемесячно' : language === 'ky' ? 'Ар айда' : 'Monthly'}
                </Text>
                <Text style={styles.priceValue}>
                  {formatPrice(convertPrice(plan.price))}
                </Text>
              </View>
              
              {plan.price > 0 && (
                <>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>
                      {language === 'ru' ? 'Годовая скидка (20%)' : language === 'ky' ? 'Жылдык арзандатуу (20%)' : 'Annual discount (20%)'}
                    </Text>
                    <Text style={[styles.priceValue, { color: '#16a34a' }]}>
                      {formatPrice(Math.round(convertPrice(plan.price) * 12 * 0.8))}
                      <Text style={styles.yearlyLabel}>/year</Text>
                    </Text>
                  </View>
                  
                  <View style={styles.savingsHighlight}>
                    <Text style={styles.savingsText}>
                      {language === 'ru' ? 'Экономьте ' : language === 'ky' ? 'Үнөмдөңүз ' : 'Save '}
                      {formatPrice(Math.round(convertPrice(plan.price) * 2.4))}
                      {language === 'ru' ? ' в год' : language === 'ky' ? ' жылына' : ' per year'}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        );
      
      case 'limits':
        return (
          <View style={styles.limitsContainer}>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>
                {language === 'ru' ? 'Транзакции' : language === 'ky' ? 'Транзакциялар' : 'Transactions'}
              </Text>
              <Text style={styles.limitValue}>
                {plan.id === 'basic' ? '150/month' : 'Unlimited'}
              </Text>
            </View>
            
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>
                {language === 'ru' ? 'Счета' : language === 'ky' ? 'Эсептер' : 'Accounts'}
              </Text>
              <Text style={styles.limitValue}>
                {plan.id === 'basic' ? '2' : plan.id === 'plus' ? '3' : '5'}
              </Text>
            </View>
            
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>
                {language === 'ru' ? 'Категории' : language === 'ky' ? 'Категориялар' : 'Categories'}
              </Text>
              <Text style={styles.limitValue}>
                {plan.id === 'basic' ? '5' : 'Unlimited'}
              </Text>
            </View>
            
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>
                {language === 'ru' ? 'AI анализ' : language === 'ky' ? 'AI анализ' : 'AI Analysis'}
              </Text>
              <Text style={[styles.limitValue, { 
                color: plan.id === 'basic' ? '#ef4444' : '#16a34a' 
              }]}>
                {plan.id === 'basic' ? 
                  (language === 'ru' ? 'Недоступно' : language === 'ky' ? 'Жетүүсүз' : 'Not included') : 
                  (language === 'ru' ? 'Включено' : language === 'ky' ? 'Кошулган' : 'Included')
                }
              </Text>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[globalStyles.authContainer, { backgroundColor: '#05212a' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#05212a" />
      <LanguageSelector language={language} setLanguage={setLanguage} />
      
      <ScrollView 
        contentContainerStyle={[
          globalStyles.scrollContent, 
          { 
            paddingHorizontal: width * 0.05,
            paddingTop: 60,
            paddingBottom: 40
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Fixed back button */}
        <TouchableOpacity
          style={globalStyles.backButton}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        
        {/* Title */}
        <Text style={[globalStyles.authTitleLeft, { color: '#ffffff', marginTop: 40 }]}>
          {t.choosePlan || 'Choose Your Plan'}
        </Text>
        <Text style={[globalStyles.authSubtitleLeft, { color: '#9ca3af' }]}>
          {t.planSubtitle || 'Select the perfect plan for your financial journey'}
        </Text>

        {/* Currency Selector */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#1f2937',
            padding: 16,
            borderRadius: 16,
            marginBottom: 25,
            borderWidth: 1,
            borderColor: '#374151',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={() => setShowCurrencyModal(true)}
        >
          <Text style={{ fontSize: 20 }}>{selectedCurrencyData.flag}</Text>
          <Text style={{ marginLeft: 12, flex: 1, fontSize: 17, fontWeight: '600', color: '#ffffff' }}>
            {selectedCurrency} ({selectedCurrencyData.symbol})
          </Text>
          <Ionicons name="chevron-down" size={18} color="#9ca3af" />
        </TouchableOpacity>

        {/* Emma-style Plan Cards */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                { borderColor: selectedPlan === plan.id ? plan.color : '#374151' }
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.badge && (
                <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                  <Text style={styles.popularBadgeText}>{plan.badge}</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[styles.planName, { color: '#ffffff' }]}>{getPlanName(plan)}</Text>
                  {selectedPlan === plan.id && (
                    <Ionicons name="checkmark-circle" size={24} color={plan.color} />
                  )}
                </View>
                <Text style={styles.planDescription}>{plan.description}</Text>
                <Text style={[styles.planPrice, { color: '#ffffff' }]}>
                  {formatPrice(convertPrice(plan.price))}
                  <Text style={styles.planPeriod}>/{plan.period}</Text>
                </Text>
              </View>

              {/* Tab Navigation - Only show for selected plan */}
              {selectedPlan === plan.id && (
                <>
                  <View style={styles.tabContainer}>
                    {['features', 'pricing', 'limits'].map((tab) => (
                      <TouchableOpacity
                        key={tab}
                        style={[
                          styles.tab,
                          selectedTab === tab && [styles.tabActive, { borderBottomColor: plan.color }]
                        ]}
                        onPress={() => setSelectedTab(tab)}
                      >
                        <Text style={[
                          styles.tabText,
                          selectedTab === tab && { color: plan.color }
                        ]}>
                          {tab === 'features' ? (language === 'ru' ? 'Функции' : language === 'ky' ? 'Функциялар' : 'Features') :
                           tab === 'pricing' ? (language === 'ru' ? 'Цены' : language === 'ky' ? 'Баалар' : 'Pricing') :
                           (language === 'ru' ? 'Лимиты' : language === 'ky' ? 'Чектөөлөр' : 'Limits')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Tab Content */}
                  {renderTabContent(plan)}
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity
          style={[
            globalStyles.pill,
            globalStyles.pillPrimary,
            loading && globalStyles.pillDisabled,
            { 
              marginTop: 30,
              marginBottom: 20,
              marginHorizontal: width * 0.02,
            }
          ]}
          onPress={handleContinue}
          disabled={loading}
        >
          <Text style={globalStyles.pillTextPrimary}>
            {loading ? 'Setting up...' : `${t.continue || 'Continue'} with ${getPlanName(plans.find(p => p.id === selectedPlan))}`}
          </Text>
        </TouchableOpacity>

        {/* Currency Selection Modal */}
        <Modal
          visible={showCurrencyModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCurrencyModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setShowCurrencyModal(false)}
          >
            <View style={styles.currencyModal}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <ScrollView>
                {currencies.map((currency) => (
                  <TouchableOpacity
                    key={currency.code}
                    style={[
                      styles.currencyOption,
                      selectedCurrency === currency.code && { backgroundColor: 'rgba(152, 221, 166, 0.1)' }
                    ]}
                    onPress={() => {
                      setSelectedCurrency(currency.code);
                      setShowCurrencyModal(false);
                    }}
                  >
                    <Text style={styles.currencyOptionText}>
                      {currency.flag} {currency.code} ({currency.symbol})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  plansContainer: {
    marginBottom: 30,
    gap: 20,
  },
  planCard: {
    backgroundColor: '#1f2937',
    borderWidth: 2,
    borderColor: '#374151',
    borderRadius: 20,
    padding: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  planCardSelected: {
    backgroundColor: '#1f2937',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  planHeader: {
    marginBottom: 20,
    marginTop: 8,
  },
  planName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 32,
  },
  planPeriod: {
    fontSize: 15,
    color: '#9ca3af',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  featuresContainer: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 2,
  },
  featureText: {
    fontSize: 14,
    color: '#d1d5db',
    flex: 1,
    lineHeight: 20,
  },
  pricingContainer: {
    paddingVertical: 8,
  },
  priceBreakdown: {
    gap: 12,
  },
  priceBreakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  yearlyLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '400',
  },
  savingsHighlight: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  savingsText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  limitsContainer: {
    gap: 12,
    paddingVertical: 8,
  },
  limitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  limitLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  limitValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyModal: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    margin: 20,
    maxHeight: '60%',
    width: width * 0.9,
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    textAlign: 'center',
  },
  currencyOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  currencyOptionText: {
    fontSize: 16,
    color: '#ffffff',
  },
});

export default SubscriptionPlans;