// src/components/finance/Modals.js
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Add Transaction Modal
export function AddTransactionModal({
  visible,
  onClose,
  onSubmit,
  language = 'en',
  darkMode = false,
  currency = 'KGS'
}) {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: 'Food & Dining',
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
  });

  const categories = [
    'Food & Dining',
    'Transportation', 
    'Shopping',
    'Utilities',
    'Healthcare',
    'Entertainment',
    'Salary',
    'Other'
  ];

  const handleSubmit = () => {
    if (!formData.amount || !formData.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const transaction = {
      id: Date.now().toString(),
      amount: parseFloat(formData.amount) * (formData.type === 'expense' ? -1 : 1),
      description: formData.description,
      category: formData.category,
      date: formData.date,
      type: formData.type,
    };

    onSubmit(transaction);
    setFormData({
      amount: '',
      description: '',
      category: 'Food & Dining',
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
    });
    onClose();
  };

  const styles = getModalStyles(darkMode);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {getTranslation('addTransaction', language)}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={darkMode ? '#ffffff' : '#111827'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Transaction Type Toggle */}
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'expense' && styles.typeButtonActive
                ]}
                onPress={() => setFormData({ ...formData, type: 'expense' })}
              >
                <Text style={[
                  styles.typeButtonText,
                  formData.type === 'expense' && styles.typeButtonTextActive
                ]}>
                  {getTranslation('expense', language)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'income' && styles.typeButtonActive
                ]}
                onPress={() => setFormData({ ...formData, type: 'income' })}
              >
                <Text style={[
                  styles.typeButtonText,
                  formData.type === 'income' && styles.typeButtonTextActive
                ]}>
                  {getTranslation('income', language)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {getTranslation('amount', language)} ({currency})
              </Text>
              <TextInput
                style={styles.input}
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={darkMode ? '#9ca3af' : '#6b7280'}
              />
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {getTranslation('description', language)}
              </Text>
              <TextInput
                style={styles.input}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder={getTranslation('descriptionPlaceholder', language)}
                placeholderTextColor={darkMode ? '#9ca3af' : '#6b7280'}
              />
            </View>

            {/* Category Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {getTranslation('category', language)}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryRow}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        formData.category === category && styles.categoryButtonActive
                      ]}
                      onPress={() => setFormData({ ...formData, category })}
                    >
                      <Text style={[
                        styles.categoryButtonText,
                        formData.category === category && styles.categoryButtonTextActive
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>
                {getTranslation('addTransaction', language)}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Export Modal
export function ExportModal({
  visible,
  onClose,
  transactions = [],
  budgets = [],
  goals = [],
  language = 'en',
  currentPlan = 'basic'
}) {
  const [exportType, setExportType] = useState('pdf');
  const [dateRange, setDateRange] = useState('month');

  const handleExport = () => {
    if (currentPlan === 'basic' && exportType === 'csv') {
      Alert.alert('Upgrade Required', 'CSV export requires Plus plan');
      return;
    }

    // Handle export logic here
    Alert.alert('Export', `Exporting ${exportType.toUpperCase()} for ${dateRange}`);
    onClose();
  };

  const styles = getModalStyles(false);

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {getTranslation('exportData', language)}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Export Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {getTranslation('exportType', language)}
              </Text>
              <View style={styles.optionRow}>
                <TouchableOpacity
                  style={[styles.option, exportType === 'pdf' && styles.optionActive]}
                  onPress={() => setExportType('pdf')}
                >
                  <Text style={styles.optionText}>PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.option, 
                    exportType === 'csv' && styles.optionActive,
                    currentPlan === 'basic' && styles.optionDisabled
                  ]}
                  onPress={() => {
                    if (currentPlan !== 'basic') {
                      setExportType('csv');
                    }
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    currentPlan === 'basic' && styles.optionTextDisabled
                  ]}>
                    CSV {currentPlan === 'basic' && '(Plus)'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date Range */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {getTranslation('dateRange', language)}
              </Text>
              <View style={styles.optionRow}>
                {['month', 'quarter', 'year'].map((range) => (
                  <TouchableOpacity
                    key={range}
                    style={[styles.option, dateRange === range && styles.optionActive]}
                    onPress={() => setDateRange(range)}
                  >
                    <Text style={styles.optionText}>
                      {getTranslation(range, language)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Basic Plan Limitation */}
            {currentPlan === 'basic' && (
              <View style={styles.limitationCard}>
                <Text style={styles.limitationText}>
                  {getTranslation('basicExportLimitation', language)}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleExport}
            >
              <Text style={styles.submitButtonText}>
                {getTranslation('export', language)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Import Modal
export function ImportModal({
  visible,
  onClose,
  onImport,
  language = 'en',
  currentPlan = 'basic'
}) {
  const styles = getModalStyles(false);

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {getTranslation('importData', language)}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.description}>
              {getTranslation('importDescription', language)}
            </Text>

            {currentPlan === 'basic' && (
              <View style={styles.limitationCard}>
                <Text style={styles.limitationText}>
                  Basic Plan: 3 imports per month
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => {
                // Handle file picker
                Alert.alert('Import', 'File picker will open here');
                onClose();
              }}
            >
              <Text style={styles.submitButtonText}>
                {getTranslation('selectFile', language)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// src/components/finance/UpgradePrompts.js

// Upgrade Prompt Component
export function UpgradePrompt({
  feature,
  message,
  onUpgrade,
  darkMode = false,
  style = {}
}) {
  const styles = getUpgradeStyles(darkMode);

  return (
    <View style={[styles.upgradePrompt, style]}>
      <View style={styles.upgradeContent}>
        <Ionicons name="lock-closed" size={20} color="#f59e0b" />
        <Text style={styles.upgradeMessage}>{message}</Text>
      </View>
      <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
        <Text style={styles.upgradeButtonText}>Upgrade</Text>
      </TouchableOpacity>
    </View>
  );
}

// Feature Paywall Component
export function FeaturePaywall({
  visible,
  onUpgrade,
  onClose,
  language = 'en'
}) {
  const styles = getUpgradeStyles(false);

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.paywallOverlay}>
        <View style={styles.paywallContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>

          <Ionicons name="lock-closed" size={48} color="#f59e0b" />
          
          <Text style={styles.paywallTitle}>
            {getTranslation('upgradeRequired', language)}
          </Text>
          
          <Text style={styles.paywallMessage}>
            {getTranslation('upgradeMessage', language)}
          </Text>

          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Text style={styles.upgradeButtonText}>
              {getTranslation('upgradeToPlusOnly', language)} £4.99/month
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Upgrade Modal Component
export function UpgradeModal({
  visible,
  onClose,
  onUpgrade,
  currentPlan = 'basic',
  context = {},
  language = 'en'
}) {
  const plans = [
    {
      id: 'plus',
      name: 'Plus',
      price: '£4.99',
      priceKGS: '540 сом',
      features: [
        'Unlimited transactions',
        'AI insights',
        'Advanced analytics',
        'Receipt scanning',
        'Data export',
        'Cloud backup'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '£8.99',
      priceKGS: '970 сом',
      features: [
        'Everything in Plus',
        '5 accounts',
        'Priority support',
        'Advanced AI',
        'Tax categories',
        'Scheduled reports'
      ]
    }
  ];

  const styles = getUpgradeStyles(false);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.upgradeModalContainer}>
        <View style={styles.upgradeModalHeader}>
          <Text style={styles.upgradeModalTitle}>
            {getTranslation('choosePlan', language)}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.upgradeModalContent}>
          {plans.map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <View>
                  <Text style={styles.planPrice}>{plan.price}/month</Text>
                  <Text style={styles.planPriceKGS}>{plan.priceKGS}/month</Text>
                </View>
              </View>

              <View style={styles.planFeatures}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.planFeature}>
                    <Ionicons name="checkmark" size={16} color="#16a34a" />
                    <Text style={styles.planFeatureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.selectPlanButton}
                onPress={() => onUpgrade(plan.id)}
              >
                <Text style={styles.selectPlanButtonText}>
                  {getTranslation('selectPlan', language)}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// Translation helper
const getTranslation = (key, language) => {
  const translations = {
    addTransaction: { en: 'Add Transaction', ru: 'Добавить транзакцию', ky: 'Транзакция кошуу' },
    expense: { en: 'Expense', ru: 'Расход', ky: 'Чыгым' },
    income: { en: 'Income', ru: 'Доход', ky: 'Киреше' },
    amount: { en: 'Amount', ru: 'Сумма', ky: 'Сумма' },
    description: { en: 'Description', ru: 'Описание', ky: 'Сүрөттөмө' },
    descriptionPlaceholder: { en: 'What did you spend on?', ru: 'На что потратили?', ky: 'Эмеге сарптадыңыз?' },
    category: { en: 'Category', ru: 'Категория', ky: 'Категория' },
    exportData: { en: 'Export Data', ru: 'Экспорт данных', ky: 'Маалыматты экспорттоо' },
    exportType: { en: 'Export Type', ru: 'Тип экспорта', ky: 'Экспорт түрү' },
    dateRange: { en: 'Date Range', ru: 'Период', ky: 'Мөөнөт' },
    month: { en: 'Month', ru: 'Месяц', ky: 'Ай' },
    quarter: { en: 'Quarter', ru: 'Квартал', ky: 'Чейрек' },
    year: { en: 'Year', ru: 'Год', ky: 'Жыл' },
    export: { en: 'Export', ru: 'Экспорт', ky: 'Экспорттоо' },
    importData: { en: 'Import Data', ru: 'Импорт данных', ky: 'Маалыматты импорттоо' },
    importDescription: { en: 'Import your financial data from CSV files', ru: 'Импортируйте финансовые данные из CSV файлов', ky: 'CSV файлдардан каржылык маалыматтарды импорттоңуз' },
    selectFile: { en: 'Select File', ru: 'Выбрать файл', ky: 'Файл тандоо' },
    basicExportLimitation: { en: 'Basic plan: PDF export with 1 month data only', ru: 'Базовый план: PDF экспорт только за 1 месяц', ky: 'Негизги план: 1 айлык маалымат менен PDF экспорт гана' },
    upgradeRequired: { en: 'Upgrade Required', ru: 'Требуется обновление', ky: 'Жаңыртуу талап кылынат' },
    upgradeMessage: { en: 'This feature requires a Plus subscription', ru: 'Эта функция требует подписку Plus', ky: 'Бул функция Plus жазылууну талап кылат' },
    upgradeToPlusOnly: { en: 'Upgrade to Plus', ru: 'Обновить до Plus', ky: 'Plus планга өткөрүү' },
    choosePlan: { en: 'Choose Your Plan', ru: 'Выберите план', ky: 'Планыңызды тандаңыз' },
    selectPlan: { en: 'Select Plan', ru: 'Выбрать план', ky: 'План тандоо' },
  };
  return translations[key]?.[language] || translations[key]?.en || key;
};

// Modal Styles
const getModalStyles = (darkMode) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: darkMode ? '#374151' : '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: darkMode ? '#ffffff' : '#111827',
  },
  content: {
    padding: 20,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: darkMode ? '#374151' : '#f3f4f6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  typeButtonActive: {
    backgroundColor: '#98DDA6',
  },
  typeButtonText: {
    fontSize: 16,
    color: darkMode ? '#d1d5db' : '#6b7280',
  },
  typeButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: darkMode ? '#ffffff' : '#111827',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: darkMode ? '#374151' : '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: darkMode ? '#374151' : '#ffffff',
    color: darkMode ? '#ffffff' : '#111827',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: darkMode ? '#374151' : '#f3f4f6',
    borderWidth: 1,
    borderColor: darkMode ? '#4b5563' : '#d1d5db',
  },
  categoryButtonActive: {
    backgroundColor: '#98DDA6',
    borderColor: '#98DDA6',
  },
  categoryButtonText: {
    fontSize: 14,
    color: darkMode ? '#d1d5db' : '#6b7280',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#98DDA6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  optionActive: {
    backgroundColor: '#98DDA6',
    borderColor: '#98DDA6',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  optionTextDisabled: {
    color: '#9ca3af',
  },
  limitationCard: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  limitationText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
});

// Upgrade Styles
const getUpgradeStyles = (darkMode) => StyleSheet.create({
  upgradePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: darkMode ? '#374151' : '#fef3c7',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkMode ? '#4b5563' : '#fcd34d',
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  upgradeMessage: {
    fontSize: 14,
    color: darkMode ? '#d1d5db' : '#92400e',
    marginLeft: 8,
    flex: 1,
  },
  upgradeButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  paywallOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  paywallContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  paywallTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  paywallMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  upgradeModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  upgradeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  upgradeModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  upgradeModalContent: {
    flex: 1,
    padding: 20,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
  planPriceKGS: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
  },
  planFeatures: {
    marginBottom: 20,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planFeatureText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  selectPlanButton: {
    backgroundColor: '#98DDA6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  selectPlanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
})