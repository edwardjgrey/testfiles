// src/components/offers/IncompleteSetupOffer.js
import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const IncompleteSetupOffer = ({ 
  visible, 
  onClose, 
  onContinueSetup,
  setupOffers = {},
  language = 'en' 
}) => {
  
  const getText = (key) => {
    const texts = {
      en: {
        title: 'Complete Your Setup',
        subtitle: 'Finish setting up Akchabar to unlock its full potential',
        financial: 'Financial Information',
        financialDesc: 'Add your income and expenses for personalized insights',
        goals: 'Financial Goals',
        goalsDesc: 'Set savings goals and track your progress',
        security: 'Security Setup',
        securityDesc: 'Protect your account with a PIN code',
        biometric: 'Quick Access',
        biometricDesc: 'Enable biometric authentication for faster sign-in',
        completeNow: 'Complete Now',
        remindLater: 'Remind Me Later',
        skip: 'Skip',
        progressTitle: 'Setup Progress',
        almostThere: "You're almost there!",
        stepsRemaining: 'steps remaining',
        whyComplete: 'Why complete setup?',
        benefits: [
          'Get personalized financial insights',
          'Track progress towards your goals',
          'Receive smart spending alerts',
          'Secure your financial data'
        ]
      },
      ru: {
        title: 'Завершите настройку',
        subtitle: 'Завершите настройку Akchabar для полного функционала',
        financial: 'Финансовая информация',
        financialDesc: 'Добавьте доходы и расходы для персональных рекомендаций',
        goals: 'Финансовые цели',
        goalsDesc: 'Установите цели сбережений и отслеживайте прогресс',
        security: 'Настройка безопасности',
        securityDesc: 'Защитите аккаунт с помощью PIN-кода',
        biometric: 'Быстрый доступ',
        biometricDesc: 'Включите биометрию для быстрого входа',
        completeNow: 'Завершить сейчас',
        remindLater: 'Напомнить позже',
        skip: 'Пропустить',
        progressTitle: 'Прогресс настройки',
        almostThere: 'Вы почти у цели!',
        stepsRemaining: 'шагов осталось',
        whyComplete: 'Зачем завершать настройку?',
        benefits: [
          'Получайте персональные финансовые советы',
          'Отслеживайте прогресс к целям',
          'Получайте умные уведомления о тратах',
          'Защитите финансовые данные'
        ]
      },
      ky: {
        title: 'Жөндөөнү аяктаңыз',
        subtitle: 'Akchabar\'дын толук мүмкүнчүлүктөрүн ачуу үчүн жөндөөнү аяктаңыз',
        financial: 'Каржылык маалымат',
        financialDesc: 'Жекелештирилген сунуштар үчүн кирешелерди жана чыгымдарды кошуңуз',
        goals: 'Каржылык максаттар',
        goalsDesc: 'Топтоо максаттарын коюп, прогрессти көзөмөлдөңүз',
        security: 'Коопсуздук жөндөөсү',
        securityDesc: 'Аккаунтуңузду PIN код менен коргоңуз',
        biometric: 'Тез кирүү',
        biometricDesc: 'Тез кирүү үчүн биометрияны иштетиңиз',
        completeNow: 'Азыр аяктоо',
        remindLater: 'Кийинчерээк эскертүү',
        skip: 'Өткөрүү',
        progressTitle: 'Жөндөө прогресси',
        almostThere: 'Сиз дээрлик аяктадыңыз!',
        stepsRemaining: 'кадам калды',
        whyComplete: 'Эмне үчүн жөндөөнү аяктоо керек?',
        benefits: [
          'Жекелештирилген каржылык кеңештерди алыңыз',
          'Максаттарга жетүү прогрессин көзөмөлдөңүз',
          'Акылдуу чыгым эскертүүлөрүн алыңыз',
          'Каржылык маалыматтарды коргоңуз'
        ]
      }
    };
    
    return texts[language]?.[key] || texts.en[key];
  };

  const incompleteItems = [];
  
  if (setupOffers.financial) {
    incompleteItems.push({
      id: 'financial',
      icon: 'cash-outline',
      color: '#10b981',
      title: getText('financial'),
      description: getText('financialDesc')
    });
  }
  
  if (setupOffers.goals) {
    incompleteItems.push({
      id: 'goals',
      icon: 'trophy-outline',
      color: '#f59e0b',
      title: getText('goals'),
      description: getText('goalsDesc')
    });
  }
  
  if (setupOffers.security) {
    incompleteItems.push({
      id: 'security',
      icon: 'lock-closed-outline',
      color: '#ef4444',
      title: getText('security'),
      description: getText('securityDesc')
    });
  }
  
  if (setupOffers.biometric) {
    incompleteItems.push({
      id: 'biometric',
      icon: 'finger-print-outline',
      color: '#3b82f6',
      title: getText('biometric'),
      description: getText('biometricDesc')
    });
  }

  const totalSteps = 4; // Total possible setup steps
  const completedSteps = totalSteps - incompleteItems.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  const renderSetupItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.setupItem}
      onPress={() => onContinueSetup(item.id)}
    >
      <View style={[styles.setupIcon, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon} size={24} color={item.color} />
      </View>
      
      <View style={styles.setupContent}>
        <Text style={styles.setupTitle}>{item.title}</Text>
        <Text style={styles.setupDescription}>{item.description}</Text>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

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
            {/* Progress Section */}
            <View style={styles.progressSection}>
              <Text style={styles.progressTitle}>{getText('progressTitle')}</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progressPercentage}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {getText('almostThere')} {incompleteItems.length} {getText('stepsRemaining')}
              </Text>
            </View>
            
            {/* Incomplete Items */}
            <View style={styles.itemsSection}>
              {incompleteItems.map(renderSetupItem)}
            </View>
            
            {/* Benefits Section */}
            <View style={styles.benefitsSection}>
              <Text style={styles.benefitsTitle}>{getText('whyComplete')}</Text>
              {getText('benefits').map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#98DDA6" />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => onContinueSetup(incompleteItems[0]?.id)}
              >
                <Text style={styles.completeButtonText}>{getText('completeNow')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.remindButton}
                onPress={() => {
                  onClose();
                  // Schedule reminder
                }}
              >
                <Text style={styles.remindButtonText}>{getText('remindLater')}</Text>
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
    maxHeight: '85%',
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
    lineHeight: 22,
  },
  content: {
    padding: 20,
  },
  progressSection: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#98DDA6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#98DDA6',
  },
  itemsSection: {
    marginBottom: 24,
  },
  setupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  setupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  setupContent: {
    flex: 1,
  },
  setupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  setupDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  benefitsSection: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#d1d5db',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    marginBottom: 20,
  },
  completeButton: {
    backgroundColor: '#98DDA6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#05212a',
  },
  remindButton: {
    backgroundColor: '#374151',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  remindButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
});

export default IncompleteSetupOffer;