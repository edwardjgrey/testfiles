// src/components/finance/modals/AddTransactionModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatters } from '../../../utils/finance/formatters';

const { width } = Dimensions.get('window');

export default function AddTransactionModal({
  visible,
  onClose,
  onSubmit,
  categories = [],
  accounts = [],
  language = 'en',
  currentPlan = 'basic'
}) {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: '',
    account_id: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Default categories for Basic plan (limited to 3)
  const defaultCategories = [
    { id: 'food', name: 'Food & Dining', icon: 'restaurant-outline', color: '#ef4444' },
    { id: 'transport', name: 'Transportation', icon: 'car-outline', color: '#3b82f6' },
    { id: 'other', name: 'Other', icon: 'grid-outline', color: '#6b7280' }
  ];

  // Get available categories based on plan
  const getAvailableCategories = () => {
    if (currentPlan === 'basic') {
      return defaultCategories;
    }
    
    // Plus/Pro plans get all categories
    const allCategories = [
      ...defaultCategories,
      { id: 'shopping', name: 'Shopping', icon: 'bag-outline', color: '#8b5cf6' },
      { id: 'entertainment', name: 'Entertainment', icon: 'game-controller-outline', color: '#f59e0b' },
      { id: 'bills', name: 'Bills & Utilities', icon: 'receipt-outline', color: '#06b6d4' },
      { id: 'healthcare', name: 'Healthcare', icon: 'medical-outline', color: '#ec4899' },
      { id: 'education', name: 'Education', icon: 'school-outline', color: '#10b981' },
      { id: 'travel', name: 'Travel', icon: 'airplane-outline', color: '#f97316' },
      { id: 'salary', name: 'Salary', icon: 'cash-outline', color: '#10b981' },
      { id: 'business', name: 'Business', icon: 'briefcase-outline', color: '#6366f1' },
      { id: 'investments', name: 'Investments', icon: 'trending-up-outline', color: '#84cc16' }
    ];
    
    return allCategories;
  };

  const availableCategories = getAvailableCategories();

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setFormData({
        type: 'expense',
        amount: '',
        description: '',
        category: availableCategories[0]?.id || '',
        account_id: accounts[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setErrors({});
    }
  }, [visible, accounts]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = formatters.validationError('invalidAmount', language);
    }

    if (!formData.description.trim()) {
      newErrors.description = formatters.validationError('required', language);
    }

    if (!formData.category) {
      newErrors.category = formatters.validationError('required', language);
    }

    if (!formData.account_id) {
      newErrors.account_id = formatters.validationError('required', language);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        category: availableCategories.find(c => c.id === formData.category)?.name || formData.category
      };

      await onSubmit(transactionData);
    } catch (error) {
      Alert.alert('Error', 'Failed to add transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = getStyles();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Transaction</Text>
          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Transaction Type Toggle */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction Type</Text>
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'expense' && styles.typeButtonActive
                ]}
                onPress={() => setFormData({ ...formData, type: 'expense' })}
              >
                <Ionicons 
                  name="arrow-up-circle" 
                  size={20} 
                  color={formData.type === 'expense' ? '#ffffff' : '#ef4444'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  formData.type === 'expense' && styles.typeButtonTextActive
                ]}>
                  Expense
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'income' && styles.typeButtonActive
                ]}
                onPress={() => setFormData({ ...formData, type: 'income' })}
              >
                <Ionicons 
                  name="arrow-down-circle" 
                  size={20} 
                  color={formData.type === 'income' ? '#ffffff' : '#10b981'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  formData.type === 'income' && styles.typeButtonTextActive
                ]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.amountInput, errors.amount && styles.inputError]}
                value={formData.amount}
                onChangeText={(text) => {
                  // Only allow numbers and decimal point
                  const cleanText = text.replace(/[^0-9.]/g, '');
                  setFormData({ ...formData, amount: cleanText });
                  if (errors.amount) {
                    setErrors({ ...errors, amount: null });
                  }
                }}
                placeholder="0.00"
                placeholderTextColor="#6b7280"
                keyboardType="decimal-pad"
                autoFocus
              />
              <Text style={styles.currencyLabel}>сом</Text>
            </View>
            {errors.amount && (
              <Text style={styles.errorText}>{errors.amount}</Text>
            )}
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <TextInput
              style={[styles.textInput, errors.description && styles.inputError]}
              value={formData.description}
              onChangeText={(text) => {
                setFormData({ ...formData, description: text });
                if (errors.description) {
                  setErrors({ ...errors, description: null });
                }
              }}
              placeholder="What did you spend on?"
              placeholderTextColor="#6b7280"
              maxLength={100}
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Category</Text>
              {currentPlan === 'basic' && (
                <Text style={styles.limitText}>3 categories (Basic)</Text>
              )}
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
            >
              <View style={styles.categoriesContainer}>
                {availableCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      formData.category === category.id && styles.categoryButtonActive,
                      { borderColor: category.color }
                    ]}
                    onPress={() => setFormData({ ...formData, category: category.id })}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                      <Ionicons 
                        name={category.icon} 
                        size={20} 
                        color={category.color} 
                      />
                    </View>
                    <Text style={[
                      styles.categoryButtonText,
                      formData.category === category.id && styles.categoryButtonTextActive
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            {currentPlan === 'basic' && (
              <View style={styles.upgradeHint}>
                <Ionicons name="lock-closed-outline" size={16} color="#f59e0b" />
                <Text style={styles.upgradeHintText}>
                  Upgrade to Plus for unlimited categories
                </Text>
              </View>
            )}
            
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
          </View>

          {/* Account Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.accountsContainer}>
              {accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountButton,
                    formData.account_id === account.id && styles.accountButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, account_id: account.id })}
                >
                  <View style={styles.accountInfo}>
                    <Text style={[
                      styles.accountName,
                      formData.account_id === account.id && styles.accountNameActive
                    ]}>
                      {account.name}
                    </Text>
                    <Text style={[
                      styles.accountBalance,
                      formData.account_id === account.id && styles.accountBalanceActive
                    ]}>
                      {formatters.currency(account.balance)}
                    </Text>
                  </View>
                  {formData.account_id === account.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#98DDA6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {errors.account_id && (
              <Text style={styles.errorText}>{errors.account_id}</Text>
            )}
          </View>

          {/* Date Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date</Text>
            <TextInput
              style={styles.textInput}
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#6b7280"
            />
          </View>

          {/* Notes Input (Optional) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Add any additional notes..."
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          {/* Bottom Padding */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const getStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05212a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#98DDA6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  limitText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },

  // Type Toggle
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#374151',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  typeButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },

  // Amount Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    paddingVertical: 16,
    textAlign: 'right',
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9ca3af',
    marginLeft: 8,
  },
  textInput: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#374151',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },

  // Categories
  categoriesScroll: {
    marginHorizontal: -20,
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryButton: {
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: '#374151',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  upgradeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  upgradeHintText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },

  // Accounts
  accountsContainer: {
    gap: 8,
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accountButtonActive: {
    borderColor: '#98DDA6',
    backgroundColor: '#374151',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  accountNameActive: {
    fontWeight: '600',
  },
  accountBalance: {
    fontSize: 14,
    color: '#9ca3af',
  },
  accountBalanceActive: {
    color: '#98DDA6',
  },

  bottomPadding: {
    height: 50,
  },
});