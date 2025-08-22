import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../../styles/globalStyles';
import { translations } from '../../utils/translations';
import LanguageSelector from '../common/LanguageSelector';

const FinancialOnboarding = ({ authData, language, setLanguage, navigateAuth, completeAuth }) => {
  const t = translations[language];
  const [monthlyIncome, setMonthlyIncome] = useState(authData.monthlyIncome || '');
  const [currency, setCurrency] = useState(authData.currency || 'KGS');
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    
    // Complete the auth process
    completeAuth();
  };

  return (
    <SafeAreaView style={globalStyles.authContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f8fb" />
      <LanguageSelector language={language} setLanguage={setLanguage} />
      <ScrollView contentContainerStyle={globalStyles.scrollContent}>
        <TouchableOpacity
          style={globalStyles.backButton}
          onPress={() => navigateAuth('subscription')}
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        
        <Text style={globalStyles.authTitleLeft}>{t.financialSetup}</Text>
        <Text style={globalStyles.authSubtitleLeft}>{t.financialSubtitle}</Text>
        
        <View style={globalStyles.authCard}>
          <View style={globalStyles.formGroup}>
            <Text style={globalStyles.formLabel}>{t.monthlyIncome}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[globalStyles.formInput, { flex: 1 }]}
                value={monthlyIncome}
                onChangeText={setMonthlyIncome}
                placeholder="75000"
                keyboardType="numeric"
              />
              <View style={[globalStyles.formInput, { paddingHorizontal: 12, justifyContent: 'center', minWidth: 80 }]}>
                <Text style={{ color: '#0f172a', fontSize: 16 }}>
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
          
          <TouchableOpacity
            style={[
              globalStyles.pill,
              globalStyles.pillPrimary,
              loading && globalStyles.pillDisabled
            ]}
            onPress={handleFinish}
            disabled={loading}
          >
            <Text style={globalStyles.pillTextPrimary}>
              {loading ? 
                (language === 'ru' ? 'Создание аккаунта...' :
                 language === 'ky' ? 'Аккаунт түзүлүүдө...' :
                 'Creating account...') : 
                t.completeSetup}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[globalStyles.pill, globalStyles.pillSecondary]}
            onPress={handleFinish}
          >
            <Text style={globalStyles.pillTextSecondary}>{t.skipForNow}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FinancialOnboarding;