// src/components/auth/FinancialOnboarding.js - ENHANCED VERSION with Additional Income & Statement Upload
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
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { globalStyles } from '../../styles/globalStyles';
import { translations, additionalIncomeTypes, supportedFileTypes, fileTypeLabels } from '../../utils/translations';
import LanguageSelector from '../common/LanguageSelector';

const { width } = Dimensions.get('window');

const FinancialOnboarding = ({ authData, language, setLanguage, navigateAuth, completeAuth }) => {
  const t = translations[language];
  
  // Basic income state
  const [monthlyIncome, setMonthlyIncome] = useState(authData.monthlyIncome || '');
  const [currency, setCurrency] = useState(authData.currency || 'KGS');
  
  // Additional income state
  const [additionalIncome, setAdditionalIncome] = useState([]);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [selectedIncomeType, setSelectedIncomeType] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDescription, setIncomeDescription] = useState('');
  
  // Statement upload state
  const [uploadedStatement, setUploadedStatement] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const [loading, setLoading] = useState(false);

  // Add additional income source
  const addIncomeSource = () => {
    if (!selectedIncomeType || !incomeAmount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const newIncome = {
      id: Date.now(),
      type: selectedIncomeType,
      amount: parseFloat(incomeAmount),
      description: incomeDescription || selectedIncomeType,
      currency: currency
    };

    setAdditionalIncome([...additionalIncome, newIncome]);
    setSelectedIncomeType('');
    setIncomeAmount('');
    setIncomeDescription('');
    setShowIncomeModal(false);
  };

  // Remove income source
  const removeIncomeSource = (id) => {
    setAdditionalIncome(additionalIncome.filter(income => income.id !== id));
  };

  // Calculate total income
  const getTotalIncome = () => {
    const primary = parseFloat(monthlyIncome) || 0;
    const additional = additionalIncome.reduce((sum, income) => sum + income.amount, 0);
    return primary + additional;
  };

  // Handle statement upload
  const handleStatementUpload = async () => {
    try {
      setUploadLoading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: supportedFileTypes,
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          Alert.alert('Error', 'File size must be less than 10MB');
          return;
        }

        setUploadedStatement({
          name: file.name,
          size: file.size,
          type: file.mimeType,
          uri: file.uri
        });

        Alert.alert('Success', 'Statement uploaded successfully! We\'ll analyze it to help set up your categories.');
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to upload statement. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  // Remove uploaded statement
  const removeStatement = () => {
    setUploadedStatement(null);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleFinish = async () => {
    try {
      setLoading(true);
      
      // Validate primary income if provided
      if (monthlyIncome && isNaN(parseFloat(monthlyIncome))) {
        Alert.alert('Error', 'Please enter a valid primary income amount');
        return;
      }

      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Prepare financial data
      const financialData = {
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
        additionalIncome: additionalIncome,
        totalIncome: getTotalIncome(),
        currency: currency,
        uploadedStatement: uploadedStatement
      };
      
      // Complete the auth process with enhanced financial data
      await completeAuth(financialData);
    } catch (error) {
      console.error('Financial onboarding error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      // Complete auth with minimal financial data
      await completeAuth({
        monthlyIncome: null,
        additionalIncome: [],
        totalIncome: 0,
        currency: 'KGS',
        uploadedStatement: null
      });
    } catch (error) {
      console.error('Skip financial onboarding error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  // Render additional income modal
  const renderIncomeModal = () => (
    <Modal
      visible={showIncomeModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowIncomeModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowIncomeModal(false)}>
            <Ionicons name="close" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Income Source</Text>
          <TouchableOpacity onPress={addIncomeSource} disabled={!selectedIncomeType || !incomeAmount}>
            <Text style={[styles.modalAction, (!selectedIncomeType || !incomeAmount) && styles.modalActionDisabled]}>
              Add
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Income Type Selection */}
          <Text style={styles.modalSectionTitle}>Income Type</Text>
          <View style={styles.incomeTypeGrid}>
            {additionalIncomeTypes[language].map((type, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.incomeTypeButton,
                  selectedIncomeType === type && styles.incomeTypeButtonSelected
                ]}
                onPress={() => setSelectedIncomeType(type)}
              >
                <Text style={[
                  styles.incomeTypeText,
                  selectedIncomeType === type && styles.incomeTypeTextSelected
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount Input */}
          <Text style={styles.modalSectionTitle}>Monthly Amount</Text>
          <View style={styles.incomeAmountContainer}>
            <TextInput
              style={styles.incomeAmountInput}
              value={incomeAmount}
              onChangeText={(text) => {
                const cleanText = text.replace(/[^0-9.]/g, '');
                setIncomeAmount(cleanText);
              }}
              placeholder="0"
              keyboardType="numeric"
              returnKeyType="done"
            />
            <Text style={styles.currencyLabel}>{currency === 'KGS' ? 'сом' : currency}</Text>
          </View>

          {/* Description Input */}
          <Text style={styles.modalSectionTitle}>Description (Optional)</Text>
          <TextInput
            style={styles.incomeDescriptionInput}
            value={incomeDescription}
            onChangeText={setIncomeDescription}
            placeholder="Brief description of this income source..."
            multiline
            numberOfLines={3}
            maxLength={200}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

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
          {/* Primary Monthly Income */}
          <View style={globalStyles.formGroup}>
            <Text style={[globalStyles.formLabel, { color: '#6b7280' }]}>
              {t.monthlyIncome || 'Primary Monthly Income'}
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
                  const cleanText = text.replace(/[^0-9.]/g, '');
                  setMonthlyIncome(cleanText);
                }}
                placeholder="75000"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                returnKeyType="done"
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
          </View>

          {/* Currency Selection */}
          <View style={globalStyles.formGroup}>
            <Text style={[globalStyles.formLabel, { color: '#6b7280' }]}>
              {language === 'ru' ? 'Валюта' : 
               language === 'ky' ? 'Валюта' : 
               'Currency'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[
                  styles.currencyButton,
                  currency === 'KGS' && styles.currencyButtonSelected
                ]}
                onPress={() => setCurrency('KGS')}
              >
                <Text style={[
                  styles.currencyButtonText,
                  currency === 'KGS' && styles.currencyButtonTextSelected
                ]}>
                  KGS (сом)
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.currencyButton,
                  currency === 'USD' && styles.currencyButtonSelected
                ]}
                onPress={() => setCurrency('USD')}
              >
                <Text style={[
                  styles.currencyButtonText,
                  currency === 'USD' && styles.currencyButtonTextSelected
                ]}>
                  USD ($)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Additional Income Sources */}
          <View style={globalStyles.formGroup}>
            <View style={styles.sectionHeader}>
              <Text style={[globalStyles.formLabel, { color: '#6b7280', marginBottom: 0 }]}>
                {t.additionalIncome || 'Additional Income Sources'}
              </Text>
              <TouchableOpacity
                style={styles.addIncomeButton}
                onPress={() => setShowIncomeModal(true)}
              >
                <Ionicons name="add" size={16} color="#ffffff" />
                <Text style={styles.addIncomeButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.helpText}>
              {t.additionalIncomeHint || 'Freelance, investments, side business, etc.'}
            </Text>

            {/* Additional Income List */}
            {additionalIncome.length > 0 && (
              <View style={styles.incomeList}>
                {additionalIncome.map((income) => (
                  <View key={income.id} style={styles.incomeItem}>
                    <View style={styles.incomeItemContent}>
                      <Text style={styles.incomeItemType}>{income.type}</Text>
                      <Text style={styles.incomeItemAmount}>
                        {income.amount.toLocaleString()} {currency === 'KGS' ? 'сом' : currency}
                      </Text>
                      {income.description && income.description !== income.type && (
                        <Text style={styles.incomeItemDescription}>{income.description}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.removeIncomeButton}
                      onPress={() => removeIncomeSource(income.id)}
                    >
                      <Ionicons name="close" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Total Income Display */}
          {getTotalIncome() > 0 && (
            <View style={styles.totalIncomeCard}>
              <Text style={styles.totalIncomeLabel}>Total Monthly Income</Text>
              <Text style={styles.totalIncomeAmount}>
                {getTotalIncome().toLocaleString()} {currency === 'KGS' ? 'сом' : currency}
              </Text>
            </View>
          )}

          {/* Statement Upload Section */}
          <View style={globalStyles.formGroup}>
            <Text style={[globalStyles.formLabel, { color: '#6b7280' }]}>
              {t.statementUpload || 'Upload Bank Statement (Optional)'}
            </Text>
            <Text style={styles.helpText}>
              {t.statementUploadHint || 'Upload your latest bank statement to get started faster'}
            </Text>

            {!uploadedStatement ? (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleStatementUpload}
                disabled={uploadLoading}
              >
                {uploadLoading ? (
                  <ActivityIndicator size="small" color="#0f172a" />
                ) : (
                  <>
                    <Ionicons name="document-text-outline" size={20} color="#0f172a" />
                    <Text style={styles.uploadButtonText}>
                      {t.selectFile || 'Select File'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.uploadedFileCard}>
                <View style={styles.uploadedFileInfo}>
                  <Ionicons name="document-text" size={20} color="#16a34a" />
                  <View style={styles.uploadedFileDetails}>
                    <Text style={styles.uploadedFileName}>{uploadedStatement.name}</Text>
                    <Text style={styles.uploadedFileSize}>
                      {formatFileSize(uploadedStatement.size)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeFileButton}
                  onPress={removeStatement}
                >
                  <Ionicons name="close" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.supportedFilesText}>
              Supported: PDF, CSV, Excel, JPEG, PNG (max 10MB)
            </Text>
          </View>

          {/* Privacy Notice */}
          <View style={styles.privacyNotice}>
            <Ionicons name="shield-checkmark" size={16} color="#0369a1" />
            <Text style={styles.privacyText}>
              {language === 'ru' ? 'Ваши финансовые данные защищены и используются только для персонализации вашего опыта. Вы можете изменить или удалить эту информацию в любое время.' :
               language === 'ky' ? 'Сиздин каржылык маалыматтарыңыз корголгон жана тажрыйбаңызды жекелештирүү үчүн гана колдонулат. Бул маалыматты каалаган убакытта өзгөртө же өчүрө аласыз.' :
               'Your financial data is protected and only used to personalize your experience. You can change or delete this information anytime.'}
            </Text>
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
                <ActivityIndicator size="small" color="white" />
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
          <Text style={styles.helpTextFooter}>
            {language === 'ru' ? 'Вы можете добавить эту информацию позже в настройках профиля' :
             language === 'ky' ? 'Бул маалыматты кийинчерээк профиль жөндөөлөрүнөн кошо аласыз' :
             'You can add this information later in your profile settings'}
          </Text>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Additional Income Modal */}
      {renderIncomeModal()}
    </SafeAreaView>
  );
};

const styles = {
  // Currency Selection
  currencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  currencyButtonSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#98DDA6',
  },
  currencyButtonText: {
    color: '#6b7280',
    fontWeight: '400',
  },
  currencyButtonTextSelected: {
    color: '#16a34a',
    fontWeight: '600',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addIncomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#98DDA6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addIncomeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Help Text
  helpText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
    lineHeight: 16,
  },
  helpTextFooter: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },

  // Income List
  incomeList: {
    gap: 8,
  },
  incomeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  incomeItemContent: {
    flex: 1,
  },
  incomeItemType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  incomeItemAmount: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '500',
    marginBottom: 2,
  },
  incomeItemDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  removeIncomeButton: {
    padding: 4,
    marginLeft: 8,
  },

  // Total Income
  totalIncomeCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 16,
  },
  totalIncomeLabel: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
    marginBottom: 4,
  },
  totalIncomeAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#15803d',
  },

  // Upload Button
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    gap: 8,
    marginBottom: 8,
  },
  uploadButtonText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '500',
  },

  // Uploaded File
  uploadedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 8,
  },
  uploadedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  uploadedFileDetails: {
    flex: 1,
  },
  uploadedFileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 2,
  },
  uploadedFileSize: {
    fontSize: 12,
    color: '#6b7280',
  },
  removeFileButton: {
    padding: 4,
  },
  supportedFilesText: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },

  // Privacy Notice
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 8,
  },
  privacyText: {
    fontSize: 12,
    color: '#0369a1',
    flex: 1,
    lineHeight: 16,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  modalAction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#98DDA6',
  },
  modalActionDisabled: {
    color: '#9ca3af',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
    marginTop: 16,
  },

  // Income Type Grid
  incomeTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  incomeTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  incomeTypeButtonSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#98DDA6',
  },
  incomeTypeText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  incomeTypeTextSelected: {
    color: '#16a34a',
    fontWeight: '600',
  },

  // Income Amount Input
  incomeAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginBottom: 20,
  },
  incomeAmountInput: {
    flex: 1,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'right',
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    paddingRight: 16,
  },

  // Description Input
  incomeDescriptionInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
    marginBottom: 20,
  },
};

export default FinancialOnboarding;