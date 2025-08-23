// src/components/auth/FinancialOnboarding.js - ENHANCED with additional income and statement upload
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
  Modal,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { globalStyles } from '../../styles/globalStyles';
import { translations, additionalIncomeTypes, supportedFileTypes } from '../../utils/translations';
import LanguageSelector from '../common/LanguageSelector';

const FinancialOnboarding = ({ authData, language, setLanguage, navigateAuth, completeAuth }) => {
  const t = translations[language];
  const [monthlyIncome, setMonthlyIncome] = useState(authData.monthlyIncome || '');
  const [currency, setCurrency] = useState(authData.currency || 'KGS');
  const [loading, setLoading] = useState(false);
  
  // Additional income sources
  const [additionalIncomes, setAdditionalIncomes] = useState([]);
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  const [newIncomeType, setNewIncomeType] = useState('');
  const [newIncomeAmount, setNewIncomeAmount] = useState('');
  
  // Statement upload
  const [uploadedStatement, setUploadedStatement] = useState(null);
  const [uploading, setUploading] = useState(false);

  const currencyOptions = [
    { code: 'KGS', symbol: 'сом', flag: '🇰🇬' },
    { code: 'USD', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', symbol: '£', flag: '🇬🇧' },
    { code: 'RUB', symbol: '₽', flag: '🇷🇺' }
  ];

  const handleAddIncome = () => {
    if (!newIncomeType || !newIncomeAmount) {
      Alert.alert('Error', 'Please fill in both type and amount');
      return;
    }

    const newIncome = {
      id: Date.now().toString(),
      type: newIncomeType,
      amount: parseFloat(newIncomeAmount),
      currency
    };

    setAdditionalIncomes([...additionalIncomes, newIncome]);
    setNewIncomeType('');
    setNewIncomeAmount('');
    setShowAddIncomeModal(false);
  };

  const removeIncome = (id) => {
    setAdditionalIncomes(additionalIncomes.filter(income => income.id !== id));
  };

  const handleStatementUpload = async () => {
    try {
      setUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: supportedFileTypes,
        copyToCacheDirectory: true,
        multiple: false
      });

      if (result.type === 'success') {
        setUploadedStatement({
          uri: result.uri,
          name: result.name,
          size: result.size,
          mimeType: result.mimeType
        });
        
        Alert.alert(
          'Success',
          'Bank statement uploaded successfully! We\'ll help you categorize your transactions automatically.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getTotalIncome = () => {
    const main = parseFloat(monthlyIncome) || 0;
    const additional = additionalIncomes.reduce((sum, income) => sum + income.amount, 0);
    return main + additional;
  };

  const formatCurrency = (amount) => {
    const currencyData = currencyOptions.find(c => c.code === currency);
    return `${amount} ${currencyData?.symbol || currency}`;
  };

  const handleFinish = async () => {
    setLoading(true);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const financialData = {
      monthlyIncome: parseFloat(monthlyIncome) || 0,
      additionalIncomes,
      totalIncome: getTotalIncome(),
      currency,
      uploadedStatement
    };
    
    setLoading(false);
    
    // Complete the auth process with financial data
    completeAuth(financialData);
  };

  const renderAddIncomeModal = () => (
    <Modal
      visible={showAddIncomeModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAddIncomeModal(false)}
    >
      <SafeAreaView style={[globalStyles.authContainer, { padding: 20 }]}>
        <StatusBar barStyle="light-content" />
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30 }}>
          <TouchableOpacity onPress={() => setShowAddIncomeModal(false)} style={{ marginRight: 15 }}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={[globalStyles.authTitleLeft, { flex: 1 }]}>
            {t.additionalIncome}
          </Text>
        </View>

        <ScrollView>
          <View style={globalStyles.formGroup}>
            <Text style={globalStyles.formLabel}>Income Type</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 16 }}
            >
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {additionalIncomeTypes[language].map((type, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      {
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: globalStyles.authStroke,
                        backgroundColor: newIncomeType === type ? globalStyles.primary : 'transparent'
                      }
                    ]}
                    onPress={() => setNewIncomeType(type)}
                  >
                    <Text style={{
                      color: newIncomeType === type ? '#000000' : globalStyles.authText,
                      fontSize: 14,
                      fontWeight: newIncomeType === type ? '600' : '400'
                    }}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={globalStyles.formGroup}>
            <Text style={globalStyles.formLabel}>Monthly Amount</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[globalStyles.formInput, { flex: 1 }]}
                value={newIncomeAmount}
                onChangeText={setNewIncomeAmount}
                placeholder="0"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
              <View style={[globalStyles.formInput, { paddingHorizontal: 12, justifyContent: 'center', minWidth: 80 }]}>
                <Text style={{ color: '#ffffff', fontSize: 16 }}>
                  {currencyOptions.find(c => c.code === currency)?.symbol || currency}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[globalStyles.pill, globalStyles.pillPrimary, { marginTop: 20 }]}
            onPress={handleAddIncome}
          >
            <Text style={globalStyles.pillTextPrimary}>Add Income Source</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={globalStyles.authContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#05212a" />
      <LanguageSelector language={language} setLanguage={setLanguage} />
      
      <ScrollView contentContainerStyle={globalStyles.scrollContent}>
        <TouchableOpacity
          style={globalStyles.backButton}
          onPress={() => navigateAuth('subscription')}
        >
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        
        <Text style={globalStyles.authTitleLeft}>{t.financialSetup}</Text>
        <Text style={globalStyles.authSubtitleLeft}>{t.financialSubtitle}</Text>
        
        <View style={globalStyles.authCard}>
          {/* Primary Monthly Income */}
          <View style={globalStyles.formGroup}>
            <Text style={globalStyles.formLabel}>{t.monthlyIncome}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[globalStyles.formInput, { flex: 1 }]}
                value={monthlyIncome}
                onChangeText={setMonthlyIncome}
                placeholder="75000"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
              <TouchableOpacity 
                style={[globalStyles.formInput, { paddingHorizontal: 12, justifyContent: 'center', minWidth: 80 }]}
                onPress={() => {
                  // Could open currency selector modal
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 16 }}>
                  {currencyOptions.find(c => c.code === currency)?.flag} {currencyOptions.find(c => c.code === currency)?.symbol}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
              {language === 'ru' ? 'Основной источник дохода (зарплата, пенсия и т.д.)' :
               language === 'ky' ? 'Негизги киреше булагы (айлык, пенсия ж.б.)' :
               'Primary income source (salary, pension, etc.)'}
            </Text>
          </View>

          {/* Additional Income Sources */}
          <View style={globalStyles.formGroup}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={globalStyles.formLabel}>{t.additionalIncome}</Text>
              <TouchableOpacity onPress={() => setShowAddIncomeModal(true)}>
                <Ionicons name="add-circle" size={24} color="#98DDA6" />
              </TouchableOpacity>
            </View>
            
            {additionalIncomes.length > 0 ? (
              <View style={{ gap: 8 }}>
                {additionalIncomes.map((income) => (
                  <View 
                    key={income.id}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#374151',
                      padding: 12,
                      borderRadius: 8
                    }}
                  >
                    <View>
                      <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>
                        {income.type}
                      </Text>
                      <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                        {formatCurrency(income.amount)}/month
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeIncome(income.id)}>
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {/* Total Income Summary */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#98DDA6',
                  padding: 12,
                  borderRadius: 8,
                  marginTop: 8
                }}>
                  <Text style={{ color: '#000000', fontSize: 16, fontWeight: '700' }}>
                    Total Monthly Income
                  </Text>
                  <Text style={{ color: '#000000', fontSize: 16, fontWeight: '700' }}>
                    {formatCurrency(getTotalIncome())}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
                {t.additionalIncomeHint}
              </Text>
            )}
          </View>

          {/* Statement Upload */}
          <View style={globalStyles.formGroup}>
            <Text style={globalStyles.formLabel}>{t.statementUpload}</Text>
            <TouchableOpacity
              style={{
                borderWidth: 2,
                borderColor: uploadedStatement ? '#98DDA6' : '#374151',
                borderStyle: uploadedStatement ? 'solid' : 'dashed',
                borderRadius: 12,
                padding: 20,
                alignItems: 'center',
                backgroundColor: uploadedStatement ? 'rgba(152, 221, 166, 0.1)' : 'transparent'
              }}
              onPress={handleStatementUpload}
              disabled={uploading}
            >
              {uploading ? (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="cloud-upload" size={24} color="#9ca3af" />
                  <Text style={{ color: '#9ca3af', marginTop: 8 }}>Uploading...</Text>
                </View>
              ) : uploadedStatement ? (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="document-text" size={24} color="#98DDA6" />
                  <Text style={{ color: '#98DDA6', marginTop: 8, fontWeight: '600' }}>
                    {t.fileSelected}
                  </Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>
                    {uploadedStatement.name}
                  </Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="cloud-upload-outline" size={24} color="#9ca3af" />
                  <Text style={{ color: '#9ca3af', marginTop: 8 }}>
                    {t.selectFile}
                  </Text>
                  <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                    PDF, CSV, Excel, or image files
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
              {t.statementUploadHint}
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

      {renderAddIncomeModal()}
    </SafeAreaView>
  );
};

export default FinancialOnboarding;