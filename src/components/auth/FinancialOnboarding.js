// src/components/auth/FinancialOnboarding.js - FIXED VERSION
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../../styles/globalStyles';
import { translations } from '../../utils/translations';
import LanguageSelector from '../common/LanguageSelector';

const { width } = Dimensions.get('window');

const FinancialOnboarding = ({ authData, language, setLanguage, navigateAuth, completeAuth }) => {
  const t = translations[language];
  const [monthlyIncome, setMonthlyIncome] = useState(authData.monthlyIncome || '');
  const [currency, setCurrency] = useState(authData.currency || 'KGS');
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    try {
      setLoading(true);
      
      // Validate income if provided
      if (monthlyIncome && isNaN(parseFloat(monthlyIncome))) {
        Alert.alert('Error', 'Please enter a valid income amount');
        return;
      }

      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Complete the auth process with financial data
      await completeAuth({
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
        currency
      });
    } catch (error) {
      console.error('Financial onboarding error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      // Complete auth without financial data
      await completeAuth({
        monthlyIncome: null,
        currency: 'KGS'
      });
    } catch (error) {
      console.error('Skip financial onboarding error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <SafeAreaView style={globalStyles.authContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f8fb" />
      <LanguageSelector language={language} setLanguage={setLanguage} />
      
      <ScrollView 
        contentContainerStyle={[
          globalStyles.scrollContent, 
          { 
            paddingHorizontal: width * 0.05,
            paddingTop: 80
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={globalStyles.backButton}
          onPress={() => navigateAuth('subscription')}
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        
        {/* Title */}
        <Text style={[globalStyles.authTitleLeft, { color: '#0f172a' }]}>
          {t.financialSetup || 'Financial Setup'}
        </Text>
        <Text style={[globalStyles.authSubtitleLeft, { color: '#6b7280' }]}>
          {t.financialSubtitle || 'Help us personalize your experience (optional)'}
        </Text>
        
        <View style={[globalStyles.authCard, { maxWidth: width * 0.9, alignSelf: 'center' }]}>
          {/* Monthly Income Input */}
          <View style={globalStyles.formGroup}>
            <Text style={[globalStyles.formLabel, { color: '#6b7280' }]}>
              {t.monthlyIncome || 'Monthly Income'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[globalStyles.formInput, { 
                  flex: 1,
                  backgroundColor: '#ffffff',
                  borderColor: '#d1d5db',
                  color: '#0f172a'
                }]}
                value={monthlyIncome}
                onChangeText={(text) => {
                  // Only allow numbers and decimal point
                  const cleanText = text.replace(/[^0-9.]/g, '');
                  setMonthlyIncome(cleanText);
                }}
                placeholder="75000"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={handleFinish}
              />
              <View style={[globalStyles.formInput, { 
                paddingHorizontal: 12, 
                justifyContent: 'center', 
                minWidth: 80,
                backgroundColor: '#f3f4f6',
                borderColor: '#d1d5db'
              }]}>
                <Text style={{ color: '#0f172a', fontSize: 16, textAlign: 'center' }}>
                  {currency === 'KGS' ? 'сом' : currency}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
              {language === 'ru' ? 'Эта информация поможет создать персональные рекомендации' :
               language === 'ky' ? 'Бул маалымат жеке сунуштарды түзүүгө жардам берет' :
               'This information helps create personalized recommendations'}
            </Text>
          </View>

          {/* Currency Selection (Optional Enhancement) */}
          <View style={globalStyles.formGroup}>
            <Text style={[globalStyles.formLabel, { color: '#6b7280' }]}>
              {language === 'ru' ? 'Валюта' : 
               language === 'ky' ? 'Валюта' : 
               'Currency'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[
                  {
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: currency === 'KGS' ? '#98DDA6' : '#d1d5db',
                    backgroundColor: currency === 'KGS' ? '#f0fdf4' : '#ffffff',
                    alignItems: 'center'
                  }
                ]}
                onPress={() => setCurrency('KGS')}
              >
                <Text style={{ 
                  color: currency === 'KGS' ? '#16a34a' : '#6b7280',
                  fontWeight: currency === 'KGS' ? '600' : '400'
                }}>
                  KGS (сом)
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  {
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: currency === 'USD' ? '#98DDA6' : '#d1d5db',
                    backgroundColor: currency === 'USD' ? '#f0fdf4' : '#ffffff',
                    alignItems: 'center'
                  }
                ]}
                onPress={() => setCurrency('USD')}
              >
                <Text style={{ 
                  color: currency === 'USD' ? '#16a34a' : '#6b7280',
                  fontWeight: currency === 'USD' ? '600' : '400'
                }}>
                  USD ($)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Privacy Notice */}
          <View style={{
            backgroundColor: '#f0f9ff',
            padding: 12,
            borderRadius: 8,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#bae6fd'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <Ionicons name="shield-checkmark" size={16} color="#0369a1" />
              <Text style={{ 
                fontSize: 12, 
                color: '#0369a1',
                flex: 1,
                lineHeight: 16
              }}>
                {language === 'ru' ? 'Ваши финансовые данные защищены и используются только для персонализации вашего опыта. Вы можете изменить или удалить эту информацию в любое время.' :
                 language === 'ky' ? 'Сиздин каржылык маалыматтарыңыз корголгон жана тажрыйбаңызды жекелештирүү үчүн гана колдонулат. Бул маалыматты каалаган убакытта өзгөртө же өчүрө аласыз.' :
                 'Your financial data is protected and only used to personalize your experience. You can change or delete this information anytime.'}
              </Text>
            </View>
          </View>
          
          {/* Complete Setup Button */}
          <TouchableOpacity
            style={[
              globalStyles.pill,
              globalStyles.pillPrimary,
              loading && globalStyles.pillDisabled
            ]}
            onPress={handleFinish}
            disabled={loading}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={globalStyles.pillTextPrimary}>
                  {language === 'ru' ? 'Создание аккаунта...' :
                   language === 'ky' ? 'Аккаунт түзүлүүдө...' :
                   'Creating account...'}
                </Text>
              </View>
            ) : (
              <Text style={globalStyles.pillTextPrimary}>
                {t.completeSetup || 'Complete Setup'}
              </Text>
            )}
          </TouchableOpacity>
          
          {/* Skip Button */}
          <TouchableOpacity
            style={[globalStyles.pill, globalStyles.pillSecondary]}
            onPress={handleSkip}
            disabled={loading}
          >
            <Text style={[globalStyles.pillTextSecondary, { marginLeft: 0 }]}>
              {t.skipForNow || 'Skip for now'}
            </Text>
          </TouchableOpacity>

          {/* Help Text */}
          <Text style={{
            fontSize: 12,
            color: "#9ca3af",
            textAlign: 'center',
            marginTop: 16,
            lineHeight: 16
          }}>
            {language === 'ru' ? 'Вы можете добавить эту информацию позже в настройках профиля' :
             language === 'ky' ? 'Бул маалыматты кийинчерээк профиль жөндөөлөрүнөн кошо аласыз' :
             'You can add this information later in your profile settings'}
          </Text>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default FinancialOnboarding;