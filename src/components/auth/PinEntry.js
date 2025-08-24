// src/components/auth/PinEntry.js - Updated with Forgot PIN option
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
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SecurityService from '../../services/securityService';
import BiometricService from '../../services/biometricService';
import ApiService from '../../services/apiService';

const PinEntry = ({ language, onSuccess, onCancel, user }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  
  // Forgot PIN modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: phone/email, 2: code, 3: new PIN
  const [resetMethod, setResetMethod] = useState(''); // 'phone' or 'email'
  const [resetCode, setResetCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Animations
  const shakeAnimation = new Animated.Value(0);
  const fadeAnimation = new Animated.Value(1);

  useEffect(() => {
    if (user?.id) {
      SecurityService.setCurrentUser(user.id);
      checkSecurityStatus();
      checkBiometricAvailability();
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
      const status = await SecurityService.getSecurityStatus(user.id);
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
        enterPin: 'Enter Your PIN',
        enterPinSubtitle: 'Enter your 6-digit PIN to continue',
        incorrectPin: 'Incorrect PIN',
        attemptsRemaining: 'attempts remaining',
        accountLocked: 'Account Locked',
        tryAgainIn: 'Try again in',
        minutes: 'minutes',
        useBiometric: `Use ${biometricType}`,
        cancel: 'Cancel',
        delete: 'Delete',
        forgotPin: 'Forgot PIN?',
        resetPin: 'Reset PIN',
        selectResetMethod: 'How would you like to reset your PIN?',
        viaSMS: 'Via SMS',
        viaEmail: 'Via Email',
        sendCode: 'Send Code',
        enterCode: 'Enter Code',
        codeSubtitle: 'Enter the 6-digit code we sent to',
        createNewPin: 'Create New PIN',
        confirmNewPin: 'Confirm New PIN',
        resetComplete: 'PIN Reset Complete',
        codeSent: 'Code sent!',
        pinMismatch: 'PINs do not match',
        resetPin: 'Reset PIN',
        back: 'Back',
        continue: 'Continue',
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
        forgotPin: 'Забыли PIN?',
        resetPin: 'Сбросить PIN',
        selectResetMethod: 'Как вы хотите сбросить PIN?',
        viaSMS: 'По SMS',
        viaEmail: 'По Email',
        sendCode: 'Отправить код',
        enterCode: 'Введите код',
        codeSubtitle: 'Введите 6-значный код, отправленный на',
        createNewPin: 'Создать новый PIN',
        confirmNewPin: 'Подтвердите новый PIN',
        resetComplete: 'PIN успешно сброшен',
        codeSent: 'Код отправлен!',
        pinMismatch: 'PIN-коды не совпадают',
        back: 'Назад',
        continue: 'Продолжить',
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
        forgotPin: 'PIN унуттуңузбу?',
        resetPin: 'PIN калыбына келтирүү',
        selectResetMethod: 'PIN кодду кантип калыбына келтиргиңиз келет?',
        viaSMS: 'SMS аркылуу',
        viaEmail: 'Email аркылуу',
        sendCode: 'Код жөнөтүү',
        enterCode: 'Кодду киргизиңиз',
        codeSubtitle: '6 сандуу кодду киргизиңиз',
        createNewPin: 'Жаңы PIN түзүү',
        confirmNewPin: 'Жаңы PIN ырастоо',
        resetComplete: 'PIN ийгиликтүү калыбына келтирилди',
        codeSent: 'Код жөнөтүлдү!',
        pinMismatch: 'PIN коддор дал келген жок',
        back: 'Артка',
        continue: 'Улантуу',
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
      setLoading(true);
      SecurityService.setCurrentUser(user.id);
      const result = await SecurityService.verifyPin(enteredPin, user.id);

      if (result.success) {
        onSuccess();
      } else {
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
        onSuccess();
      } else if (!result.cancelled) {
        Alert.alert('Biometric Failed', result.error);
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert('Biometric Failed', 'Please try again or use your PIN');
    } finally {
      setLoading(false);
    }
  };

  // Forgot PIN handlers
  const handleForgotPin = () => {
    setShowForgotModal(true);
    setForgotStep(1);
  };

  const handleResetMethodSelect = (method) => {
    setResetMethod(method);
    setForgotStep(2);
  };

  const sendResetCode = async () => {
    try {
      setResetLoading(true);
      
      const resetData = {
        userId: user.id,
        method: resetMethod,
        contact: resetMethod === 'email' ? user.email : user.phone
      };

      const result = await ApiService.makeRequest('/auth/pin-reset/send-code', {
        method: 'POST',
        body: JSON.stringify(resetData)
      });

      if (result.success) {
        setForgotStep(3);
        Alert.alert(getText('codeSent'), `Code sent to your ${resetMethod}`);
      } else {
        Alert.alert('Error', result.error || 'Failed to send code');
      }
    } catch (error) {
      console.error('Send reset code error:', error);
      Alert.alert('Error', 'Failed to send reset code');
    } finally {
      setResetLoading(false);
    }
  };

  const verifyResetCode = () => {
    if (resetCode.length === 6) {
      setForgotStep(4);
    } else {
      Alert.alert('Error', 'Please enter the 6-digit code');
    }
  };

  const completeResetPin = async () => {
    if (newPin.length !== 6) {
      Alert.alert('Error', 'PIN must be 6 digits');
      return;
    }

    if (newPin !== confirmNewPin) {
      Alert.alert('Error', getText('pinMismatch'));
      return;
    }

    try {
      setResetLoading(true);
      
      const resetData = {
        userId: user.id,
        code: resetCode,
        newPin: newPin,
        method: resetMethod
      };

      const result = await ApiService.makeRequest('/auth/pin-reset/complete', {
        method: 'POST',
        body: JSON.stringify(resetData)
      });

      if (result.success) {
        // Update local PIN storage
        await SecurityService.setupPin(newPin, user.id);
        
        setShowForgotModal(false);
        Alert.alert(getText('resetComplete'), 'You can now use your new PIN to sign in');
        
        // Reset all states
        setForgotStep(1);
        setResetCode('');
        setNewPin('');
        setConfirmNewPin('');
        setResetMethod('');
      } else {
        Alert.alert('Error', result.error || 'Failed to reset PIN');
      }
    } catch (error) {
      console.error('Complete PIN reset error:', error);
      Alert.alert('Error', 'Failed to reset PIN');
    } finally {
      setResetLoading(false);
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

  // Forgot PIN Modal
  const renderForgotPinModal = () => (
    <Modal
      visible={showForgotModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowForgotModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowForgotModal(false)}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{getText('resetPin')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.modalContent}>
          {forgotStep === 1 && (
            <View>
              <Text style={styles.modalSubtitle}>{getText('selectResetMethod')}</Text>
              
              {user?.phone && (
                <TouchableOpacity
                  style={styles.resetMethodButton}
                  onPress={() => handleResetMethodSelect('phone')}
                >
                  <Ionicons name="call-outline" size={24} color="#98DDA6" />
                  <View style={styles.resetMethodInfo}>
                    <Text style={styles.resetMethodTitle}>{getText('viaSMS')}</Text>
                    <Text style={styles.resetMethodSubtitle}>
                      Send code to {user.phone.replace(/(\d{3})\d{6}(\d{3})/, '$1****$2')}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {user?.email && (
                <TouchableOpacity
                  style={styles.resetMethodButton}
                  onPress={() => handleResetMethodSelect('email')}
                >
                  <Ionicons name="mail-outline" size={24} color="#98DDA6" />
                  <View style={styles.resetMethodInfo}>
                    <Text style={styles.resetMethodTitle}>{getText('viaEmail')}</Text>
                    <Text style={styles.resetMethodSubtitle}>
                      Send code to {user.email.replace(/(.{2}).*@/, '$1****@')}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}

          {forgotStep === 2 && (
            <View>
              <Text style={styles.modalSubtitle}>
                Ready to send reset code to your {resetMethod}?
              </Text>
              
              <TouchableOpacity
                style={[styles.confirmButton, resetLoading && styles.buttonDisabled]}
                onPress={sendResetCode}
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <ActivityIndicator size="small" color="#05212a" />
                ) : (
                  <Text style={styles.confirmButtonText}>{getText('sendCode')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {forgotStep === 3 && (
            <View>
              <Text style={styles.modalSubtitle}>{getText('codeSubtitle')}</Text>
              
              <TextInput
                style={styles.codeInput}
                value={resetCode}
                onChangeText={setResetCode}
                placeholder="123456"
                placeholderTextColor="#6b7280"
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.confirmButton, resetCode.length !== 6 && styles.buttonDisabled]}
                onPress={verifyResetCode}
                disabled={resetCode.length !== 6}
              >
                <Text style={styles.confirmButtonText}>{getText('continue')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {forgotStep === 4 && (
            <View>
              <Text style={styles.modalSubtitle}>{getText('createNewPin')}</Text>
              
              <View style={styles.newPinContainer}>
                <Text style={styles.pinLabel}>{getText('createNewPin')}</Text>
                <View style={styles.pinDotsSmall}>
                  {[...Array(6)].map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.pinDotSmall,
                        index < newPin.length && styles.pinDotSmallFilled
                      ]}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.newPinContainer}>
                <Text style={styles.pinLabel}>{getText('confirmNewPin')}</Text>
                <View style={styles.pinDotsSmall}>
                  {[...Array(6)].map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.pinDotSmall,
                        index < confirmNewPin.length && styles.pinDotSmallFilled
                      ]}
                    />
                  ))}
                </View>
              </View>

              {/* Mini number pad for new PIN */}
              <View style={styles.miniNumberPad}>
                {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', 'delete']].map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.miniNumberRow}>
                    {row.map((item, itemIndex) => (
                      <TouchableOpacity
                        key={itemIndex}
                        style={[styles.miniNumberButton, item === '' && styles.miniNumberButtonEmpty]}
                        onPress={() => {
                          if (item === 'delete') {
                            if (confirmNewPin.length > 0) {
                              setConfirmNewPin(confirmNewPin.slice(0, -1));
                            } else if (newPin.length > 0) {
                              setNewPin(newPin.slice(0, -1));
                            }
                          } else if (item !== '') {
                            if (newPin.length < 6) {
                              setNewPin(newPin + item);
                            } else if (confirmNewPin.length < 6) {
                              setConfirmNewPin(confirmNewPin + item);
                            }
                          }
                        }}
                        disabled={item === ''}
                      >
                        {item === 'delete' ? (
                          <Ionicons name="backspace-outline" size={16} color="#ffffff" />
                        ) : (
                          <Text style={styles.miniNumberButtonText}>{item}</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.confirmButton, 
                  (newPin.length !== 6 || confirmNewPin.length !== 6) && styles.buttonDisabled
                ]}
                onPress={completeResetPin}
                disabled={newPin.length !== 6 || confirmNewPin.length !== 6 || resetLoading}
              >
                {resetLoading ? (
                  <ActivityIndicator size="small" color="#05212a" />
                ) : (
                  <Text style={styles.confirmButtonText}>{getText('resetPin')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#05212a" />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>
              Welcome back, {user?.firstName || user?.name || 'User'}!
            </Text>
          </View>

          {onCancel && (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>{getText('cancel')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <Animated.View
          style={[
            styles.mainContent,
            {
              opacity: fadeAnimation,
              transform: [{ translateX: shakeAnimation }]
            }
          ]}
        >
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

          {/* Number Pad */}
          {renderNumberPad()}

          {/* Forgot PIN Link */}
          {!isLockedOut && (
            <TouchableOpacity
              style={styles.forgotPinButton}
              onPress={handleForgotPin}
            >
              <Text style={styles.forgotPinText}>{getText('forgotPin')}</Text>
            </TouchableOpacity>
          )}

          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#98DDA6" />
            </View>
          )}
        </Animated.View>

        {/* Biometric Login Button */}
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
      </View>

      {/* Forgot PIN Modal */}
      {renderForgotPinModal()}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
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
    marginBottom: 20,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#374151',
    marginHorizontal: 15,
  },
  pinDotFilled: {
    backgroundColor: '#98DDA6',
    borderColor: '#98DDA6',
  },
  pinDotDisabled: {
    borderColor: '#6b7280',
    backgroundColor: 'transparent',
  },
  numberPad: {
    alignSelf: 'center',
    width: 300,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  numberButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
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
  forgotPinButton: {
    alignSelf: 'center',
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  forgotPinText: {
    fontSize: 16,
    color: '#98DDA6',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(152, 221, 166, 0.1)',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(152, 221, 166, 0.3)',
    alignSelf: 'stretch',
    marginHorizontal: 20,
  },
  biometricButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#98DDA6',
    marginLeft: 8,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#05212a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#d1d5db',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  resetMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  resetMethodInfo: {
    marginLeft: 16,
    flex: 1,
  },
  resetMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  resetMethodSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  confirmButton: {
    backgroundColor: '#98DDA6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#05212a',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  codeInput: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  newPinContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pinLabel: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 10,
  },
  pinDotsSmall: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinDotSmall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#374151',
    marginHorizontal: 8,
  },
  pinDotSmallFilled: {
    backgroundColor: '#98DDA6',
    borderColor: '#98DDA6',
  },
  miniNumberPad: {
    alignSelf: 'center',
    width: 240,
    marginBottom: 20,
  },
  miniNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  miniNumberButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  miniNumberButtonEmpty: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  miniNumberButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default PinEntry;