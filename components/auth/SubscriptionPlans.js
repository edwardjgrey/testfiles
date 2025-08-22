// src/components/auth/SubscriptionPlans.js - COMPLETE FILE
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../../styles/globalStyles';
import { translations } from '../../utils/translations';

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
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const currencies = [
    { code: 'KGS', symbol: 'сом', rate: 1, flag: '🇰🇬' },
    { code: 'USD', symbol: '$', rate: 0.011, flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', rate: 0.010, flag: '🇪🇺' },
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
      features: language === 'ru' ? [
        '100 транзакций в месяц',
        '1 финансовый счет',
        '5 категорий',
        '1 бюджет и 1 цель',
        'Базовые отчеты'
      ] : language === 'ky' ? [
        'Айына 100 транзакция',
        '1 каржылык эсеп',
        '5 категория',
        '1 бюджет жана 1 максат',
        'Негизги отчеттор'
      ] : [
        '100 transactions/month',
        '1 financial account',
        '5 categories',
        '1 budget & 1 goal',
        'Basic reports'
      ],
      popular: false
    },
    {
      id: 'plus',
      name: 'Plus',
      nameRu: 'Плюс',
      nameKy: 'Плюс',
      price: 299,
      period: language === 'ru' ? 'в месяц' : language === 'ky' ? 'айына' : 'per month',
      features: language === 'ru' ? [
        'Неограниченные транзакции',
        '3 финансовых счета',
        'Неограниченные категории',
        'Неограниченные бюджеты и цели',
        'AI анализ трат',
        'Экспорт данных',
        'Продвинутые графики',
        'Напоминания о счетах'
      ] : language === 'ky' ? [
        'Чексиз транзакцилар',
        '3 каржылык эсеп',
        'Чексиз категориялар',
        'Чексиз бюджеттер жана максаттар',
        'AI анализ',
        'Маалымат экспорт',
        'Өркүндөтүлгөн графиктер',
        'Эскертүүлөр'
      ] : [
        'Unlimited transactions',
        '3 financial accounts',
        'Unlimited categories',
        'Unlimited budgets & goals',
        'AI spending analysis',
        'Data export',
        'Advanced charts',
        'Bill reminders'
      ],
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      nameRu: 'Про',
      nameKy: 'Про',
      price: 499,
      period: language === 'ru' ? 'в месяц' : language === 'ky' ? 'айына' : 'per month',
      features: language === 'ru' ? [
        'Все функции Plus',
        '5 финансовых счетов',
        'Семейный доступ (5 человек)',
        'Приоритетная поддержка',
        'Продвинутый AI анализ',
        'Все премиум функции'
      ] : language === 'ky' ? [
        'Плюстун бардык функциялары',
        '5 каржылык эсеп',
        'Үй-бүлөлүк кирүү (5 адам)',
        'Биринчи кезектеги колдоо',
        'Өркүндөтүлгөн AI анализ',
        'Бардык премиум функциялар'
      ] : [
        'Everything in Plus',
        '5 financial accounts',
        'Family sharing (5 members)',
        'Priority support',
        'Advanced AI insights',
        'All premium features'
      ],
      popular: false
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

  return (
    <SafeAreaView style={globalStyles.authContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f8fb" />
      <ScrollView contentContainerStyle={[
        globalStyles.scrollContent, 
        { 
          paddingHorizontal: width * 0.05,
          paddingTop: 40
        }
      ]}>
        {/* Consistent back button */}
        <TouchableOpacity
          style={globalStyles.backButton}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        
        {/* Consistent title sizing */}
        <Text style={globalStyles.authTitleLeft}>
          {t.choosePlan || 'Choose Your Plan'}
        </Text>
        <Text style={globalStyles.authSubtitleLeft}>
          {t.planSubtitle || 'Select the perfect plan for your financial journey'}
        </Text>

        {/* Currency Selector */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'white',
            padding: 16,
            borderRadius: 16,
            marginBottom: 25,
            borderWidth: 1,
            borderColor: '#e5e7eb',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={() => setShowCurrencyModal(true)}
        >
          <Text style={{ fontSize: 20 }}>{selectedCurrencyData.flag}</Text>
          <Text style={{ marginLeft: 12, flex: 1, fontSize: 17, fontWeight: '600' }}>
            {selectedCurrency} ({selectedCurrencyData.symbol})
          </Text>
          <Ionicons name="chevron-down" size={18} color="#6b7280" />
        </TouchableOpacity>

        <View style={globalStyles.plansContainer}>
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                globalStyles.planCard,
                selectedPlan === plan.id && globalStyles.planCardSelected,
                { 
                  maxWidth: width * 0.92,
                  alignSelf: 'center',
                  width: '100%',
                }
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <View style={globalStyles.popularBadge}>
                  <Text style={globalStyles.popularBadgeText}>
                    {language === 'ru' ? 'Популярный' : language === 'ky' ? 'Популярдуу' : 'Popular'}
                  </Text>
                </View>
              )}
              
              <View style={globalStyles.planHeader}>
                <Text style={globalStyles.planName}>{getPlanName(plan)}</Text>
                <Text style={globalStyles.planPrice}>
                  {formatPrice(convertPrice(plan.price))}
                  <Text style={globalStyles.planPeriod}>/{plan.period}</Text>
                </Text>
              </View>

              <View style={globalStyles.planFeatures}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={globalStyles.planFeature}>
                    <Ionicons name="checkmark" size={16} color="#16a34a" />
                    <Text style={globalStyles.planFeatureText}>{feature}</Text>
                  </View>
                ))}
              </View>
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
              marginHorizontal: width * 0.04,
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
            style={globalStyles.modalOverlay}
            onPress={() => setShowCurrencyModal(false)}
          >
            <View style={[globalStyles.countryModal, { maxHeight: '60%' }]}>
              <Text style={globalStyles.modalTitle}>Select Currency</Text>
              <ScrollView>
                {currencies.map((currency) => (
                  <TouchableOpacity
                    key={currency.code}
                    style={[
                      globalStyles.countryOption,
                      selectedCurrency === currency.code && { backgroundColor: '#f0fdf4' }
                    ]}
                    onPress={() => {
                      setSelectedCurrency(currency.code);
                      setShowCurrencyModal(false);
                    }}
                  >
                    <Text style={globalStyles.countryOptionText}>
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

export default SubscriptionPlans;