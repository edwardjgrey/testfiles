// src/components/auth/PinEntry.js - FIXED VERSION with proper user ID handling
import React, { useState, useEffect } from 'react';
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
import BiometricService from '../../services/biometricService';

const PinEntry = ({ language, onSuccess, onCancel, user }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  
  // Animations
  const shakeAnimation = new Animated.Value(0);
  const fadeAnimation = new Animated.Value(1);

  useEffect(() => {
    if (user?.id) {
      console.log('🔐 PinEntry initialized for user:', user.id);
      // Set the current user in SecurityService
      SecurityService.setCurrentUser(user.id);
      checkSecurityStatus();
      checkBiometricAvailability();
    } else {
      console.error('❌ PinEntry: No user ID provided');
    }
  }, [user?.id]);

  useEffect(() => {
    let interval;
    if (isLockedOut && lockoutTime > 0) {
      interval = setInterval(() => {
        const remaining = lockoutTime - Date.now();
        if (remaining <= 0) {
          setIsLockedOut(false);
          setLockoutTime(0);
          setAttempts(0);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLockedOut, lockoutTime]);

  const checkSecurityStatus = async () => {
    try {
      if (!user?.id) {
        console.error('❌ No user ID for security status check');
        return;
      }

      console.log('🔍 Checking security status for user:', user.id);
      const status = await SecurityService.getSecurityStatus(user.id);
      console.log('📊 Security status:', status);
      
      setAttempts(status.failedAttempts);
      setIsLockedOut(status.isLockedOut);
      if (status.isLockedOut) {
        setLockoutTime(Date.now() + status.lockoutRemainingTime);
      }
    } catch (error) {
      console.error('Check security status error:', error);
    }
  };

  const checkBiometricAvailability = async () => {
    try {
      const biometricInfo = await BiometricService.getBiometricInfo();
      setBiometricAvailable(biometricInfo.available && biometricInfo.isSetup);
      setBiometricType(biometricInfo.typeName || 'Biometric');
    } catch (error) {
      console.error('Biometric check error:', error);
    }
  };

  const getText = (key) => {
    const texts = {
      en: {
        enterPin: 'Enter your PIN',
        enterPinSubtitle: 'Enter your 6-digit PIN to continue',
        incorrectPin: 'Incorrect PIN',
        attemptsRemaining: 'attempts remaining',
        accountLocked: 'Account Locked',
        tryAgainIn: 'Try again in',
        minutes: 'minutes',
        useBiometric: `Use ${biometricType}`,
        cancel: 'Cancel',
        delete: 'Delete',
        biometricPrompt: `Use ${biometricType} to unlock Akchabar`,
        biometricFailed: 'Biometric authentication failed',
        pinRequired: 'PIN Required',
        pinRequiredMessage: 'Please set up a PIN to secure your account'
      },
      ru: {
        enterPin: 'Введите PIN-код',
        enterPinSubtitle: 'Введите 6-значный PIN для продолжения',
        incorrectPin: 'Неверный PIN-код',
        attemptsRemaining: 'попыток осталось',
        accountLocked: 'Аккаунт заблокирован',
        tryAgainIn: 'Попробуйте через',
        minutes: 'минут',
        useBiometric: `Использовать ${biometricType}`,
        cancel: 'Отмена',
        delete: 'Удалить',
        biometricPrompt: `Используйте ${biometricType} для разблокировки Akchabar`,
        biometricFailed: 'Биометрическая аутентификация не удалась',
        pinRequired: 'Требуется PIN-код',
        pinRequiredMessage: 'Пожалуйста, установите PIN-код для защиты аккаунта'
      },
      ky: {
        enterPin: 'PIN кодун киргизиңиз',
        enterPinSubtitle: 'Улантуу үчүн 6 сандуу PIN киргизиңиз',
        incorrectPin: 'Туура эмес PIN код',
        attemptsRemaining: 'аракет калды',
        accountLocked: 'Аккаунт бөгөттөлдү',
        tryAgainIn: 'Кайра аракет кылыңыз',
        minutes: 'мүнөт',
        useBiometric: `${biometricType} колдонуу`,
        cancel: 'Жокко чыгаруу',
        delete: 'Өчүрүү',
        biometricPrompt: `Akchabar блогун ачуу үчүн ${biometricType} колдонуңуз`,
        biometricFailed: 'Биометрикалык аутентификация ийгиликсиз',
        pinRequired: 'PIN код талап кылынат',
        pinRequiredMessage: 'Аккаунтуңузду коргоо үчүн PIN код коюңуз'
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
    if (pin.length < 6 && !isLockedOut) {
      const newPin = pin + number;
      setPin(newPin);

      // Auto-verify when PIN is complete
      if (newPin.length === 6) {
        setTimeout(() => verifyPin(newPin), 200);
      }
    }
  };

  const handleDeletePress = () => {
    setPin(pin.slice(0, -1));
  };

  const verifyPin = async (enteredPin) => {
    try {
      if (!user?.id) {
        console.error('❌ No user ID for PIN verification');
        Alert.alert('Error', 'User information is missing');
        return;
      }

      setLoading(true);
      
      console.log('🔍 Verifying PIN for user:', user.id);
      
      // Ensure SecurityService has the correct user ID
      SecurityService.setCurrentUser(user.id);
      
      // Verify PIN with explicit user ID
      const result = await SecurityService.verifyPin(enteredPin, user.id);
      console.log('🔍 PIN verification result:', result);
      
      if (result.success) {
        console.log('✅ PIN verification successful for user:', user.id);
        onSuccess();
      } else {
        console.log('❌ PIN verification failed for user:', user.id, 'Error:', result.error);
        shakeError();
        setPin('');
        
        if (result.lockedOut) {
          setIsLockedOut(true);
          if (result.remainingTime) {
            setLockoutTime(Date.now() + result.remainingTime);
          }
          Alert.alert(getText('accountLocked'), result.error);
        } else {
          setAttempts(5 - (result.remainingAttempts || 0));
          Alert.alert(getText('incorrectPin'), result.error);
        }
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      shakeError();
      setPin('');
      Alert.alert('Error', 'Failed to verify PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      setLoading(true);
      
      const result = await BiometricService.authenticateWithBiometric();
      
      if (result.success) {
        console.log('✅ Biometric authentication successful for user:', user?.id);
        onSuccess();
      } else if (!result.cancelled) {
        Alert.alert(getText('biometricFailed'), result.error);
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert(getText('biometricFailed'), 'Please try again or use your PIN');
    } finally {
      setLoading(false);
    }
  };

  const formatLockoutTime = () => {
    const remaining = Math.max(0, lockoutTime - Date.now());
    const minutes = Math.ceil(remaining / 60000);
    return `${minutes} ${getText('minutes')}`;
  };

  const renderPinDots = () => (
    <View style={styles.pinDotsContainer}>
      {[...Array(6)].map((_, index) => (
        <View
          key={index}
          style={[
            styles.pinDot,
            index < pin.length && styles.pinDotFilled,
            isLockedOut && styles.pinDotDisabled
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
                  item === '' && styles.numberButtonEmpty,
                  isLockedOut && styles.numberButtonDisabled
                ]}
                onPress={() => {
                  if (item === 'delete') {
                    handleDeletePress();
                  } else if (item !== '') {
                    handleNumberPress(item);
                  }
                }}
                disabled={item === '' || loading || isLockedOut}
              >
                {item === 'delete' ? (
                  <Ionicons 
                    name="backspace-outline" 
                    size={24} 
                    color={isLockedOut ? "#6b7280" : "#ffffff"} 
                  />
                ) : (
                  <Text style={[
                    styles.numberButtonText,
                    isLockedOut && styles.numberButtonTextDisabled
                  ]}>
                    {item}
                  </Text>
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
          { 
            opacity: fadeAnimation,
            transform: [{ translateX: shakeAnimation }]
          }
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
              Welcome back, {user?.firstName || 'User'}
            </Text>
          </View>
          
          {onCancel && (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>{getText('cancel')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{getText('enterPin')}</Text>
          <Text style={styles.subtitle}>
            {isLockedOut 
              ? `${getText('tryAgainIn')} ${formatLockoutTime()}`
              : getText('enterPinSubtitle')
            }
          </Text>
          
          {attempts > 0 && !isLockedOut && (
            <Text style={styles.attemptsText}>
              {attempts}/5 {getText('attemptsRemaining')}
            </Text>
          )}
        </View>

        {/* PIN Dots */}
        {renderPinDots()}

        {/* Biometric Option */}
        {biometricAvailable && !isLockedOut && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricAuth}
            disabled={loading}
          >
            <Ionicons 
              name={biometricType === 'Face ID' ? 'scan' : 'finger-print'} 
              size={24} 
              color="#98DDA6" 
            />
            <Text style={styles.biometricButtonText}>
              {getText('useBiometric')}
            </Text>
          </TouchableOpacity>
        )}

        {/* Number Pad */}
        {renderNumberPad()}

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#98DDA6" />
          </View>
        )}

        {/* Debug Info */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>Debug: User ID: {user?.id || 'MISSING'}</Text>
            <Text style={styles.debugText}>PIN Length: {pin.length}</Text>
            <Text style={styles.debugText}>Attempts: {attempts}</Text>
            <Text style={styles.debugText}>Locked: {isLockedOut ? 'Yes' : 'No'}</Text>
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
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  titleContainer: {
    alignItems: 'center',
    marginVertical: 40,
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
  attemptsText: {
    fontSize: 14,
    color: '#f59e0b',
    textAlign: 'center',
    marginTop: 8,
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
  pinDotDisabled: {
    borderColor: '#6b7280',
    backgroundColor: 'transparent',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(152, 221, 166, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(152, 221, 166, 0.3)',
  },
  biometricButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#98DDA6',
    marginLeft: 8,
  },
  numberPad: {
    flex: 1,
    justifyContent: 'center',
    maxHeight: 400,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  numberButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  numberButtonDisabled: {
    backgroundColor: '#374151',
    opacity: 0.5,
  },
  numberButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
  numberButtonTextDisabled: {
    color: '#6b7280',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
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

export default PinEntry;