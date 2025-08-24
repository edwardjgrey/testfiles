// src/components/auth/GoalsSetup.js - Financial Goals Setup Component
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
import { globalStyles } from '../../styles/globalStyles';
import { translations } from '../../utils/translations';
import LanguageSelector from '../common/LanguageSelector';

const { width } = Dimensions.get('window');

const GoalsSetup = ({ authData, language, setLanguage, navigateAuth, completeAuth }) => {
  const t = translations[language];
  
  // Goals state
  const [financialGoals, setFinancialGoals] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  
  // Goal form state
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalType, setGoalType] = useState('savings');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Predefined goal types with icons and colors
  const goalTypes = [
    {
      id: 'savings',
      name: { 
        en: 'Emergency Fund', 
        ru: 'Чрезвычайный фонд', 
        ky: 'Шашылыш фонд' 
      },
      icon: 'shield-checkmark',
      color: '#16a34a',
      description: {
        en: 'Build an emergency fund for unexpected expenses',
        ru: 'Создайте резервный фонд для непредвиденных расходов',
        ky: 'Күтүлбөгөн чыгымдар үчүн резервдүү фонд түзүңүз'
      }
    },
    {
      id: 'vacation',
      name: { 
        en: 'Vacation', 
        ru: 'Отпуск', 
        ky: 'Эс алуу' 
      },
      icon: 'airplane',
      color: '#0ea5e9',
      description: {
        en: 'Save for your dream vacation or travel',
        ru: 'Накопите на отпуск мечты или путешествие',
        ky: 'Кыялыңыздагы эс алуу же саякат үчүн топтоңуз'
      }
    },
    {
      id: 'house',
      name: { 
        en: 'House/Apartment', 
        ru: 'Дом/Квартира', 
        ky: 'Үй/Батир' 
      },
      icon: 'home',
      color: '#dc2626',
      description: {
        en: 'Save for a down payment or home purchase',
        ru: 'Накопите на первоначальный взнос или покупку жилья',
        ky: 'Алгачкы төлөм же үй сатып алуу үчүн топтоңуз'
      }
    },
    {
      id: 'car',
      name: { 
        en: 'Car', 
        ru: 'Автомобиль', 
        ky: 'Унаа' 
      },
      icon: 'car',
      color: '#7c3aed',
      description: {
        en: 'Save for a new or used car purchase',
        ru: 'Накопите на покупку нового или подержанного автомобиля',
        ky: 'Жаңы же колдонулган унаа сатып алуу үчүн топтоңуз'
      }
    },
    {
      id: 'education',
      name: { 
        en: 'Education', 
        ru: 'Образование', 
        ky: 'Билим алуу' 
      },
      icon: 'school',
      color: '#ea580c',
      description: {
        en: 'Save for education, courses, or training',
        ru: 'Накопите на образование, курсы или обучение',
        ky: 'Билим алуу, курстар же окуу үчүн топтоңуз'
      }
    },
    {
      id: 'wedding',
      name: { 
        en: 'Wedding', 
        ru: 'Свадьба', 
        ky: 'Үйлөнүү тою' 
      },
      icon: 'heart',
      color: '#ec4899',
      description: {
        en: 'Save for your dream wedding celebration',
        ru: 'Накопите на свадьбу мечты',
        ky: 'Кыялыңыздагы үйлөнүү тою үчүн топтоңуз'
      }
    },
    {
      id: 'business',
      name: { 
        en: 'Business', 
        ru: 'Бизнес', 
        ky: 'Бизнес' 
      },
      icon: 'briefcase',
      color: '#059669',
      description: {
        en: 'Save to start your own business',
        ru: 'Накопите для начала собственного бизнеса',
        ky: 'Өз бизнесиңизди баштоо үчүн топтоңуз'
      }
    },
    {
      id: 'retirement',
      name: { 
        en: 'Retirement', 
        ru: 'Пенсия', 
        ky: 'Пенсия' 
      },
      icon: 'trending-up',
      color: '#0d9488',
      description: {
        en: 'Build long-term savings for retirement',
        ru: 'Создайте долгосрочные накопления на пенсию',
        ky: 'Пенсия үчүн узак мөөнөттүү топтомду түзүңүз'
      }
    },
    {
      id: 'other',
      name: { 
        en: 'Other Goal', 
        ru: 'Другая цель', 
        ky: 'Башка максат' 
      },
      icon: 'flag',
      color: '#6b7280',
      description: {
        en: 'Set a custom financial goal',
        ru: 'Установите пользовательскую финансовую цель',
        ky: 'Жеке каржылык максат коюңуз'
      }
    }
  ];

  // Get goal type by ID
  const getGoalType = (id) => goalTypes.find(type => type.id === id) || goalTypes[0];

  // Add goal
  const addGoal = () => {
    if (!goalName || !goalAmount) {
      Alert.alert('Error', 'Please fill in goal name and target amount');
      return;
    }

    const selectedGoalType = getGoalType(goalType);
    const newGoal = {
      id: Date.now(),
      name: goalName,
      amount: parseFloat(goalAmount),
      type: goalType,
      typeInfo: selectedGoalType,
      deadline: goalDeadline,
      description: goalDescription || selectedGoalType.description[language],
      currency: authData.currency || 'KGS',
      currentAmount: 0,
      createdAt: new Date().toISOString()
    };

    setFinancialGoals([...financialGoals, newGoal]);
    
    // Reset form
    setGoalName('');
    setGoalAmount('');
    setGoalType('savings');
    setGoalDeadline('');
    setGoalDescription('');
    setShowGoalModal(false);
  };

  // Remove goal
  const removeGoal = (id) => {
    setFinancialGoals(financialGoals.filter(goal => goal.id !== id));
  };

  // Calculate total goals amount
  const getTotalGoalsAmount = () => {
    return financialGoals.reduce((sum, goal) => sum + goal.amount, 0);
  };

  // Handle finish
  const handleFinish = async () => {
    try {
      setLoading(true);
      
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Complete auth with goals data
      const goalsData = {
        ...authData,
        financialGoals: financialGoals,
        totalGoalsAmount: getTotalGoalsAmount(),
        hasFinancialGoals: financialGoals.length > 0
      };
      
      await completeAuth(goalsData);
    } catch (error) {
      console.error('Goals setup error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle skip
  const handleSkip = async () => {
    try {
      // Complete auth without goals
      const goalsData = {
        ...authData,
        financialGoals: [],
        totalGoalsAmount: 0,
        hasFinancialGoals: false
      };
      
      await completeAuth(goalsData);
    } catch (error) {
      console.error('Skip goals setup error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  // Format deadline date
  const formatDeadline = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Calculate months to deadline
  const getMonthsToDeadline = (dateString) => {
    if (!dateString) return null;
    const deadline = new Date(dateString);
    const now = new Date();
    const diffTime = deadline - now;
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return Math.max(0, diffMonths);
  };

  // Render goal modal
  const renderGoalModal = () => (
    <Modal
      visible={showGoalModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowGoalModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowGoalModal(false)}>
            <Ionicons name="close" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Financial Goal</Text>
          <TouchableOpacity onPress={addGoal} disabled={!goalName || !goalAmount}>
            <Text style={[styles.modalAction, (!goalName || !goalAmount) && styles.modalActionDisabled]}>
              Add
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Goal Type Selection */}
          <Text style={styles.modalSectionTitle}>Goal Type</Text>
          <View style={styles.goalTypeGrid}>
            {goalTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.goalTypeCard,
                  goalType === type.id && [styles.goalTypeCardSelected, { borderColor: type.color }]
                ]}
                onPress={() => {
                  setGoalType(type.id);
                  if (!goalName) {
                    setGoalName(type.name[language]);
                  }
                }}
              >
                <View style={[styles.goalTypeIcon, { backgroundColor: type.color + '20' }]}>
                  <Ionicons name={type.icon} size={24} color={type.color} />
                </View>
                <Text style={[
                  styles.goalTypeName,
                  goalType === type.id && styles.goalTypeNameSelected
                ]}>
                  {type.name[language]}
                </Text>
                <Text style={styles.goalTypeDescription}>
                  {type.description[language]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Goal Name */}
          <Text style={styles.modalSectionTitle}>Goal Name</Text>
          <TextInput
            style={styles.goalInput}
            value={goalName}
            onChangeText={setGoalName}
            placeholder="Enter goal name..."
            maxLength={50}
          />

          {/* Target Amount */}
          <Text style={styles.modalSectionTitle}>Target Amount</Text>
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              value={goalAmount}
              onChangeText={(text) => {
                const cleanText = text.replace(/[^0-9.]/g, '');
                setGoalAmount(cleanText);
              }}
              placeholder="0"
              keyboardType="numeric"
            />
            <Text style={styles.currencyLabel}>
              {authData.currency === 'KGS' ? 'сом' : authData.currency || 'KGS'}
            </Text>
          </View>

          {/* Target Deadline */}
          <Text style={styles.modalSectionTitle}>Target Date (Optional)</Text>
          <TextInput
            style={styles.goalInput}
            value={goalDeadline}
            onChangeText={setGoalDeadline}
            placeholder="YYYY-MM-DD"
          />

          {/* Description */}
          <Text style={styles.modalSectionTitle}>Description (Optional)</Text>
          <TextInput
            style={[styles.goalInput, styles.goalDescriptionInput]}
            value={goalDescription}
            onChangeText={setGoalDescription}
            placeholder="Why is this goal important to you?"
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
          onPress={() => navigateAuth('financial')}
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        
        {/* Title */}
        <Text style={[globalStyles.authTitleLeft, { color: '#0f172a' }]}>
          Set Your Financial Goals
        </Text>
        <Text style={[globalStyles.authSubtitleLeft, { color: '#6b7280' }]}>
          What are you saving for? Set goals to stay motivated and track your progress.
        </Text>
        
        <View style={[globalStyles.authCard, { maxWidth: width * 0.9, alignSelf: 'center' }]}>
          {/* Goals Section */}
          <View style={styles.goalsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Financial Goals</Text>
              <TouchableOpacity
                style={styles.addGoalButton}
                onPress={() => setShowGoalModal(true)}
              >
                <Ionicons name="add" size={16} color="#ffffff" />
                <Text style={styles.addGoalButtonText}>Add Goal</Text>
              </TouchableOpacity>
            </View>

            {financialGoals.length === 0 ? (
              <View style={styles.noGoalsState}>
                <Ionicons name="flag-outline" size={48} color="#9ca3af" />
                <Text style={styles.noGoalsTitle}>No goals yet</Text>
                <Text style={styles.noGoalsSubtitle}>
                  Add your first financial goal to start your journey towards financial success.
                </Text>
                <TouchableOpacity
                  style={styles.addFirstGoalButton}
                  onPress={() => setShowGoalModal(true)}
                >
                  <Text style={styles.addFirstGoalButtonText}>Add Your First Goal</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Goals List */}
                <View style={styles.goalsList}>
                  {financialGoals.map((goal) => (
                    <View key={goal.id} style={[styles.goalCard, { borderLeftColor: goal.typeInfo.color }]}>
                      <View style={styles.goalHeader}>
                        <View style={styles.goalIconContainer}>
                          <View style={[styles.goalIcon, { backgroundColor: goal.typeInfo.color + '20' }]}>
                            <Ionicons name={goal.typeInfo.icon} size={20} color={goal.typeInfo.color} />
                          </View>
                          <View style={styles.goalInfo}>
                            <Text style={styles.goalName}>{goal.name}</Text>
                            <Text style={styles.goalType}>{goal.typeInfo.name[language]}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.removeGoalButton}
                          onPress={() => removeGoal(goal.id)}
                        >
                          <Ionicons name="close" size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.goalDetails}>
                        <View style={styles.goalAmount}>
                          <Text style={styles.goalAmountLabel}>Target Amount</Text>
                          <Text style={styles.goalAmountValue}>
                            {goal.amount.toLocaleString()} {goal.currency === 'KGS' ? 'сом' : goal.currency}
                          </Text>
                        </View>

                        {goal.deadline && (
                          <View style={styles.goalDeadline}>
                            <Text style={styles.goalDeadlineLabel}>Target Date</Text>
                            <Text style={styles.goalDeadlineValue}>
                              {formatDeadline(goal.deadline)}
                              {getMonthsToDeadline(goal.deadline) !== null && (
                                <Text style={styles.goalDeadlineMonths}>
                                  {' '}({getMonthsToDeadline(goal.deadline)} months)
                                </Text>
                              )}
                            </Text>
                          </View>
                        )}

                        {goal.description && (
                          <Text style={styles.goalDescription}>{goal.description}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>

                {/* Total Goals Summary */}
                <View style={styles.goalsSummary}>
                  <Text style={styles.goalsSummaryLabel}>Total Goals Target</Text>
                  <Text style={styles.goalsSummaryAmount}>
                    {getTotalGoalsAmount().toLocaleString()} {authData.currency === 'KGS' ? 'сом' : authData.currency || 'KGS'}
                  </Text>
                  <Text style={styles.goalsSummaryNote}>
                    {financialGoals.length} goal{financialGoals.length !== 1 ? 's' : ''} to achieve
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Motivational Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>💡 Goal Setting Tips</Text>
            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>• Make your goals specific and measurable</Text>
              <Text style={styles.tipItem}>• Set realistic deadlines that motivate you</Text>
              <Text style={styles.tipItem}>• Start with smaller goals to build momentum</Text>
              <Text style={styles.tipItem}>• Review and adjust your goals regularly</Text>
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
                <ActivityIndicator size="small" color="white" />
                <Text style={globalStyles.pillTextPrimary}>
                  {language === 'ru' ? 'Завершение настройки...' :
                   language === 'ky' ? 'Жөндөөнү аяктоо...' :
                   'Completing setup...'}
                </Text>
              </View>
            ) : (
              <Text style={globalStyles.pillTextPrimary}>
                {financialGoals.length > 0 ? 'Complete Setup' : 'Continue Without Goals'}
              </Text>
            )}
          </TouchableOpacity>
          
          {/* Skip Button */}
          {financialGoals.length === 0 && (
            <TouchableOpacity
              style={[globalStyles.pill, globalStyles.pillSecondary]}
              onPress={handleSkip}
              disabled={loading}
            >
              <Text style={[globalStyles.pillTextSecondary, { marginLeft: 0 }]}>
                Skip Goals Setup
              </Text>
            </TouchableOpacity>
          )}

          {/* Help Text */}
          <Text style={styles.helpText}>
            {language === 'ru' ? 'Вы можете добавить или изменить цели позже в приложении' :
             language === 'ky' ? 'Максаттарды кийинчерээк тиркемеден кошо же өзгөртө аласыз' :
             'You can add or modify goals later in the app'}
          </Text>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Goal Modal */}
      {renderGoalModal()}
    </SafeAreaView>
  );
};

const styles = {
  // Goals Section
  goalsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  addGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#98DDA6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addGoalButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },

  // No Goals State
  noGoalsState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noGoalsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
  },
  noGoalsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  addFirstGoalButton: {
    backgroundColor: '#98DDA6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstGoalButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Goals List
  goalsList: {
    gap: 12,
    marginBottom: 20,
  },
  goalCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  goalType: {
    fontSize: 12,
    color: '#6b7280',
  },
  removeGoalButton: {
    padding: 4,
  },
  goalDetails: {
    gap: 8,
  },
  goalAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalAmountLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  goalAmountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  goalDeadline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalDeadlineLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  goalDeadlineValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  goalDeadlineMonths: {
    color: '#6b7280',
    fontWeight: '400',
  },
  goalDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    marginTop: 4,
  },

  // Goals Summary
  goalsSummary: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
  },
  goalsSummaryLabel: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
    marginBottom: 4,
  },
  goalsSummaryAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 4,
  },
  goalsSummaryNote: {
    fontSize: 11,
    color: '#16a34a',
  },

  // Tips Section
  tipsSection: {
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 12,
  },
  tipsList: {
    gap: 6,
  },
  tipItem: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 16,
  },

  // Help Text
  helpText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
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

  // Goal Type Grid
  goalTypeGrid: {
    gap: 12,
    marginBottom: 20,
  },
  goalTypeCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  goalTypeCardSelected: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
  },
  goalTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  goalTypeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  goalTypeNameSelected: {
    color: '#16a34a',
  },
  goalTypeDescription: {
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 14,
  },

  // Goal Input
  goalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  goalDescriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },

  // Amount Input
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  amountInput: {
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
};

export default GoalsSetup;