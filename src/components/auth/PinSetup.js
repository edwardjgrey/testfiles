// src/components/auth/PinSetup.js - FIXED VERSION with proper export
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Vibration,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SecurityService from '../../services/securityService';

const PinSetup = ({ language, onComplete, user }) => {
  const [step, setStep] = useState(1); // 1: enter PIN, 2: confirm PIN
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Animations
  const shakeAnimation = new Animated.Value(0);

  const getText = (key) => {
    const texts = {
      en: {
        setupPin: 'Setup Your PIN',
        setupPinSubtitle: 'Create a 6-digit PIN to secure your account',
        confirmPin: 'Confirm Your PIN',
        confirmPinSubtitle: 'Enter your PIN again to confirm',
        enterPin: 'Enter 6-digit PIN',
        reenterPin: 'Re-enter your PIN',
        pinMismatch: 'PINs do not match',
        pinTooWeak: 'Please choose a more secure PIN',
        pinSetupSuccess: 'PIN setup successful!',
        securityTip: 'Choose a PIN that\'s unique and not easily guessable',
        continue: 'Continue',
        back: 'Back',
        skip: 'Skip for Now',
        pinRequirements: 'Your PIN should be 6 digits and not easily guessable',
        delete: 'Delete',
        completing: 'Setting up your PIN...'
      },
      ru: {
        setupPin: 'Настройка PIN-кода',
        setupPinSubtitle: 'Создайте 6-значный PIN для защиты аккаунта',
        confirmPin: 'Подтвердите PIN-код',
        confirmPinSubtitle: 'Введите PIN еще раз для подтверждения',
        enterPin: 'Введите 6-значный PIN',
        reenterPin: 'Повторите ваш PIN',
        pinMismatch: 'PIN-коды не совпадают',
        pinTooWeak: 'Пожалуйста, выберите более безопасный PIN',
        pinSetupSuccess: 'PIN успешно настроен!',
        securityTip: 'Выберите PIN, который уникален и не легко угадывается',
        continue: 'Продолжить',
        back: 'Назад',
        skip: 'Пропустить пока',
        pinRequirements: 'Ваш PIN должен быть 6 цифр и не легко угадываемым',
        delete: 'Удалить',
        completing: 'Настройка PIN...'
      },
      ky: {
        setupPin: 'PIN коду жөндөө',
        setupPinSubtitle: 'Аккаунтуңузду коргоо үчүн 6 сандуу PIN түзүңүз',
        confirmPin: 'PIN кодуңузду ырастаңыз',
        confirmPinSubtitle: 'Ырастоо үчүн PIN кодуңузду кайра киргизиңиз',
        enterPin: '6 сандуу PIN киргизиңиз',
        reenterPin: 'PIN кодуңузду кайра киргизиңиз',
        pinMismatch: 'PIN коддор дал келген жок',
        pinTooWeak: 'Коопсуз PIN тандаңыз',
        pinSetupSuccess: 'PIN ийгиликтүү жөндөлдү!',
        securityTip: 'Уникалдуу жана оңой таанылбаган PIN тандаңыз',
        continue: 'Улантуу',
        back: 'Артка',
        skip: 'Азырынча өткөрүү',
        pinRequirements: 'PIN кодуңуз 6 сандан турушу жана оңой таанылбашы керек',
        delete: 'Өчүрүү',
        completing: 'PIN жөндөлүүдө...'
      }
    };
    return texts[language]?.[key] || texts.en[key] || key;
  };

  const shakeError = () => {
    Vibration.vibrate(400);
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleNumberPress = (number) => {
    if (step === 1) {
      if (pin.length < 6) {
        const newPin = pin + number;
        setPin(newPin);
        
        // Auto-advance when PIN is complete
        if (newPin.length === 6) {
          setTimeout(() => {
            setStep(2);
            setConfirmPin('');
          }, 200);
        }
      }
    } else {
      if (confirmPin.length < 6) {
        const newConfirmPin = confirmPin + number;
        setConfirmPin(newConfirmPin);
        
        // Auto-verify when confirm PIN is complete
        if (newConfirmPin.length === 6) {
          setTimeout(() => verifyAndSetupPin(pin, newConfirmPin), 200);
        }
      }
    }
  };

  const handleDeletePress = () => {
    if (step === 1) {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const handleBackPress = () => {
    if (step === 2) {
      setStep(1);
      setConfirmPin('');
    }
  };

  const verifyAndSetupPin = async (enteredPin, confirmedPin) => {
    try {
      console.log('🔐 Setting up PIN for user:', user?.id);
      
      if (!user || !user.id) {
        throw new Error('User information is missing');
      }
      
      // Check if PINs match
      if (enteredPin !== confirmedPin) {
        shakeError();
        setConfirmPin('');
        Alert.alert('Error', getText('pinMismatch'));
        return;
      }

      // Validate PIN strength
      const validation = SecurityService.validatePinFormat(enteredPin);
      if (!validation.valid) {
        shakeError();
        setPin('');
        setConfirmPin('');
        setStep(1);
        Alert.alert('Weak PIN', validation.error);
        return;
      }

      setLoading(true);
      
      // Ensure SecurityService has the correct user ID
      SecurityService.setCurrentUser(user.id);
      console.log('🔐 SecurityService user set to:', user.id);
      
      // Setup PIN using SecurityService with explicit user ID
      const result = await SecurityService.setupPin(enteredPin, user.id);
      
      if (result.success) {
        console.log('✅ PIN setup successful for user:', user.id);
        Alert.alert(
          'Success!',
          getText('pinSetupSuccess'),
          [{ 
            text: 'OK', 
            onPress: () => {
              console.log('✅ PIN setup complete, calling onComplete');
              onComplete();
            }
          }]
        );
      } else {
        console.error('❌ PIN setup failed:', result.error);
        shakeError();
        setPin('');
        setConfirmPin('');
        setStep(1);
        Alert.alert('Setup Failed', result.error || 'Failed to setup PIN');
      }
    } catch (error) {
      console.error('❌ PIN setup error:', error);
      shakeError();
      setPin('');
      setConfirmPin('');
      setStep(1);
      Alert.alert('Error', 'Failed to setup PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip PIN Setup',
      'Your account will be less secure without a PIN. You can set it up later in Security Settings. Continue without PIN?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          style: 'destructive',
          onPress: () => {
            console.log('⏭️ User skipped PIN setup for user:', user?.id);
            onComplete();
          }
        }
      ]
    );
  };

  const renderPinDots = (currentPin) => (
    <View style={styles.pinDotsContainer}>
      {[...Array(6)].map((_, index) => (
        <View
          key={index}
          style={[
            styles.pinDot,
            index < currentPin.length && styles.pinDotFilled
          ]}
        />
      ))}
    </View>
  );

  const renderNumberPad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'delete']
    ];

    return (
      <View style={styles.numberPad}>
        {numbers.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.numberRow}>
            {row.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[
                  styles.numberButton,
                  item === '' && styles.numberButtonEmpty
                ]}
                onPress={() => {
                  if (item === 'delete') {
                    handleDeletePress();
                  } else if (item !== '') {
                    handleNumberPress(item);
                  }
                }}
                disabled={item === '' || loading}
              >
                {item === 'delete' ? (
                  <Ionicons 
                    name="backspace-outline" 
                    size={24} 
                    color="#ffffff" 
                  />
                ) : (
                  <Text style={styles.numberButtonText}>{item}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#05212a" />
      
      <Animated.View 
        style={[
          styles.content,
          { transform: [{ translateX: shakeAnimation }] }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
            <Text style={styles.welcomeText}>
              Welcome, {user?.firstName || 'User'}!
            </Text>
          </View>
          
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>{getText('skip')}</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
          <View style={styles.progressLine} />
          <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {step === 1 ? getText('setupPin') : getText('confirmPin')}
          </Text>
          <Text style={styles.subtitle}>
            {step === 1 ? getText('setupPinSubtitle') : getText('confirmPinSubtitle')}
          </Text>
        </View>

        {/* PIN Dots */}
        {renderPinDots(step === 1 ? pin : confirmPin)}

        {/* Security Tip */}
        <View style={styles.securityTip}>
          <Ionicons name="shield-checkmark" size={16} color="#98DDA6" />
          <Text style={styles.securityTipText}>
            {getText('securityTip')}
          </Text>
        </View>

        {/* Back Button for Step 2 */}
        {step === 2 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={16} color="#98DDA6" />
            <Text style={styles.backButtonText}>{getText('back')}</Text>
          </TouchableOpacity>
        )}

        {/* Number Pad */}
        {renderNumberPad()}

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#98DDA6" />
            <Text style={styles.loadingText}>{getText('completing')}</Text>
          </View>
        )}

        {/* Debug Info */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>Debug: User ID: {user?.id || 'MISSING'}</Text>
            <Text style={styles.debugText}>Step: {step}</Text>
            <Text style={styles.debugText}>PIN: {pin}</Text>
            <Text style={styles.debugText}>Confirm: {confirmPin}</Text>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05212a',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#98DDA6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#05212a',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  skipButton: {
    padding: 8,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#374151',
  },
  progressDotActive: {
    backgroundColor: '#98DDA6',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#374151',
    marginHorizontal: 10,
  },
  titleContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#374151',
    marginHorizontal: 12,
  },
  pinDotFilled: {
    backgroundColor: '#98DDA6',
    borderColor: '#98DDA6',
  },
  securityTip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(152, 221, 166, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginVertical: 20,
    gap: 8,
  },
  securityTipText: {
    fontSize: 12,
    color: '#98DDA6',
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 6,
  },
  backButtonText: {
    fontSize: 14,
    color: '#98DDA6',
    fontWeight: '500',
  },
  numberPad: {
    flex: 1,
    justifyContent: 'center',
    maxHeight: 350,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  numberButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  numberButtonEmpty: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  numberButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 8,
    fontSize: 14,
  },
  debugContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  debugText: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 2,
  },
});

// IMPORTANT: Use export default
export default PinSetup;