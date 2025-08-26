// src/components/auth/PinEntry.js - Your Original Working Code with Minimal UX Improvements
import React, { useState, useEffect, useRef } from 'react';
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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SecurityService from '../../services/securityService';
import BiometricService from '../../services/biometricService';

const PinEntry = ({ language = 'en', onSuccess, onCancel, user }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  
  // Biometric states
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricSetup, setBiometricSetup] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric');
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [biometricPrompted, setBiometricPrompted] = useState(false);
  const [shouldOfferBiometricSetup, setShouldOfferBiometricSetup] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  
  // Animations - enhanced for premium feel
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const biometricScaleAnim = useRef(new Animated.Value(0.8)).current;
  const pinDotAnimations = useRef([...Array(6)].map(() => new Animated.Value(0))).current;
  const buttonPressAnimations = useRef([...Array(12)].map(() => new Animated.Value(1))).current;

  useEffect(() => {
    if (user?.id) {
      console.log('🔐 PinEntry initialized for user:', user.id);
      SecurityService.setCurrentUser(user.id);
      initializeAuthentication();
    } else {
      console.error('❌ No user provided to PinEntry');
      setInitError('No user provided');
      setInitialized(true);
    }
  }, [user?.id]);

  // Enhanced lockout timer with live updates
  useEffect(() => {
    let interval;
    if (isLockedOut && lockoutTime > 0) {
      interval = setInterval(() => {
        const remaining = lockoutTime - Date.now();
        if (remaining <= 0) {
          setIsLockedOut(false);
          setLockoutTime(0);
          setAttempts(0);
          // Gentle unlock animation
          Animated.spring(fadeAnimation, {
            toValue: 1,
            tension: 300,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }
        // Force re-render to update countdown
        setPin(prevPin => prevPin);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLockedOut, lockoutTime]);

  // Initialize authentication flow with comprehensive error handling
  const initializeAuthentication = async () => {
    try {
      console.log('🚀 Initializing authentication flow...');
      setLoading(true);
      
      // Check security status first
      let status;
      try {
        status = await SecurityService.getSecurityStatus(user.id);
        console.log('🔍 Security status:', status);
      } catch (securityError) {
        console.error('❌ Security status check failed:', securityError);
        // Continue with default values if security check fails
        status = {
          pinSetup: false,
          failedAttempts: 0,
          isLockedOut: false,
          lockoutRemainingTime: 0
        };
      }
      
      setAttempts(status.failedAttempts);
      setIsLockedOut(status.isLockedOut);
      if (status.isLockedOut) {
        setLockoutTime(Date.now() + status.lockoutRemainingTime);
      }

      // Check biometric availability with error handling
      let biometricInfo;
      try {
        biometricInfo = await BiometricService.getBiometricInfo(user.id);
        console.log('👤 Biometric info:', biometricInfo);
      } catch (biometricError) {
        console.error('❌ Biometric info check failed:', biometricError);
        // Continue with no biometric support if check fails
        biometricInfo = {
          available: false,
          hasHardware: false,
          isEnrolled: false,
          isSetup: false,
          typeName: 'Biometric'
        };
      }
      
      setBiometricAvailable(biometricInfo.available);
      setBiometricSetup(biometricInfo.isSetup);
      setBiometricType(biometricInfo.typeName || 'Biometric');

      // Determine authentication flow based on capabilities
      if (!status.isLockedOut) {
        if (biometricInfo.available && biometricInfo.isSetup) {
          // User has biometric setup - show biometric first
          console.log('✅ Showing biometric authentication');
          setShowBiometricPrompt(true);
          setShowPinInput(false);
          startBiometricAnimation();
          
          // Auto-prompt after animation with delay for iOS
          setTimeout(() => {
            if (!biometricPrompted) {
              promptBiometricAuth(true);
            }
          }, Platform.OS === 'ios' ? 2000 : 1500); // Longer delay for iOS
        } else {
          // No biometric or not setup - go directly to PIN
          console.log('📱 Showing PIN input');
          setShowPinInput(true);
          setShowBiometricPrompt(false);
          
          // Check if we should offer biometric setup after successful PIN
          if (biometricInfo.hasHardware && biometricInfo.isEnrolled && !biometricInfo.isSetup) {
            setShouldOfferBiometricSetup(true);
          }
        }
      } else {
        // User is locked out - only show PIN input
        console.log('🔒 User locked out - PIN only');
        setShowPinInput(true);
        setShowBiometricPrompt(false);
      }

      setInitialized(true);

      // Fade in the interface
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
    } catch (error) {
      console.error('❌ Initialize authentication error:', error);
      setInitError(error.message || 'Failed to initialize authentication');
      
      // Fallback to PIN input
      setShowPinInput(true);
      setShowBiometricPrompt(false);
      setInitialized(true);
      
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } finally {
      setLoading(false);
    }
  };

  // Start biometric animation
  const startBiometricAnimation = () => {
    Animated.spring(biometricScaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Pulse animation with iOS optimization
    const pulse = () => {
      Animated.sequence([
        Animated.timing(biometricScaleAnim, {
          toValue: 1.1,
          duration: Platform.OS === 'ios' ? 1200 : 1000,
          useNativeDriver: true,
        }),
        Animated.timing(biometricScaleAnim, {
          toValue: 1,
          duration: Platform.OS === 'ios' ? 1200 : 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (showBiometricPrompt && !biometricPrompted) {
          pulse();
        }
      });
    };
    
    // Start pulse animation after a brief delay
    setTimeout(pulse, 300);
  };

  // Prompt biometric authentication with iOS-specific handling
  const promptBiometricAuth = async (isAutoPrompted = false) => {
    if (biometricPrompted) return;
    
    try {
      console.log('👆 Prompting biometric authentication...');
      setBiometricPrompted(true);
      setLoading(true);
      
      const result = await BiometricService.authenticateWithBiometric(
        'Authenticate to access your Akchabar account'
      );

      console.log('🔐 Biometric result:', result);

      if (result.success) {
        // Biometric success - complete authentication
        console.log('✅ Biometric authentication successful');
        setLoading(false);
        onSuccess();
      } else if (result.cancelled) {
        // User cancelled biometric - show fallback options
        console.log('❌ Biometric cancelled by user');
        setLoading(false);
        if (isAutoPrompted) {
          showBiometricFallbackOptions();
        } else {
          switchToPinEntry();
        }
      } else if (result.locked) {
        // Biometric is locked out
        console.log('🔒 Biometric locked out');
        setLoading(false);
        Alert.alert(
          'Biometric Locked',
          result.error || 'Biometric authentication is temporarily disabled.',
          [
            { text: 'Use PIN', onPress: switchToPinEntry }
          ]
        );
      } else {
        // Biometric failed - show error and fallback options
        console.log('❌ Biometric failed:', result.error);
        setLoading(false);
        showBiometricFailedOptions(result.error);
      }
    } catch (error) {
      console.error('❌ Biometric authentication error:', error);
      setLoading(false);
      showBiometricFailedOptions('Biometric authentication failed. Please try again or use your PIN.');
    }
  };

  // Show biometric fallback options
  const showBiometricFallbackOptions = () => {
    Alert.alert(
      getText('biometricCancelled'),
      getText('fallbackToPinPrompt'),
      [
        {
          text: getText('tryBiometricAgain'),
          onPress: () => {
            setBiometricPrompted(false);
            setTimeout(() => promptBiometricAuth(false), 1000);
          }
        },
        {
          text: getText('enterPinInstead'),
          onPress: switchToPinEntry
        }
      ]
    );
  };

  // Show biometric failed options
  const showBiometricFailedOptions = (errorMessage) => {
    Alert.alert(
      getText('biometricFailed'),
      errorMessage || 'Please try again or use your PIN',
      [
        {
          text: getText('tryBiometricAgain'),
          onPress: () => {
            setBiometricPrompted(false);
            setTimeout(() => promptBiometricAuth(false), 1000);
          }
        },
        {
          text: getText('enterPinInstead'),
          onPress: switchToPinEntry
        }
      ]
    );
  };

  // Switch to PIN entry
  const switchToPinEntry = () => {
    console.log('🔄 Switching to PIN entry');
    setShowBiometricPrompt(false);
    setShowPinInput(true);
    setBiometricPrompted(false);
    setPin(''); // Clear any existing PIN
  };

  // Switch back to biometric
  const switchToBiometric = () => {
    if (biometricAvailable && biometricSetup && !isLockedOut) {
      console.log('🔄 Switching to biometric');
      setShowPinInput(false);
      setShowBiometricPrompt(true);
      setPin('');
      setBiometricPrompted(false);
      startBiometricAnimation();
      setTimeout(() => promptBiometricAuth(false), 1000);
    }
  };

  const getText = (key) => {
    const texts = {
      en: {
        enterPin: 'Enter Your PIN',
        enterPinSubtitle: 'Enter your 6-digit PIN to continue',
        biometricTitle: 'Biometric Authentication',
        biometricSubtitle: 'Touch the sensor to authenticate',
        incorrectPin: 'Incorrect PIN',
        attemptsRemaining: 'attempts remaining',
        accountLocked: 'Account Locked',
        tryAgainIn: 'Try again in',
        minutes: 'minutes',
        useBiometric: `Use ${biometricType}`,
        enterPinInstead: 'Enter PIN Instead',
        biometricFailed: 'Biometric Failed',
        biometricCancelled: 'Biometric Cancelled',
        tryBiometricAgain: 'Try Biometric Again',
        cancel: 'Cancel',
        delete: 'Delete',
        biometricPrompt: 'Touch the sensor to authenticate',
        fallbackToPinPrompt: 'Use PIN instead?',
        setupBiometric: `Setup ${biometricType}`,
        enableBiometric: `Enable ${biometricType}?`,
        biometricSetupOffer: `Use ${biometricType} to quickly and securely sign in?`,
        biometricSetupSuccess: `${biometricType} has been enabled`,
        notNow: 'Not Now',
        enable: 'Enable',
        authenticating: 'Authenticating...',
        tapToAuthenticate: 'Tap to authenticate',
        initError: 'Authentication Error',
        retryInit: 'Retry'
      },
      ru: {
        enterPin: 'Введите PIN-код',
        enterPinSubtitle: 'Введите 6-значный PIN для продолжения',
        biometricTitle: 'Биометрическая аутентификация',
        biometricSubtitle: 'Приложите палец для входа',
        incorrectPin: 'Неверный PIN-код',
        attemptsRemaining: 'попыток осталось',
        accountLocked: 'Аккаунт заблокирован',
        tryAgainIn: 'Попробуйте через',
        minutes: 'минут',
        useBiometric: `Использовать ${biometricType}`,
        enterPinInstead: 'Ввести PIN',
        biometricFailed: 'Биометрия не удалась',
        biometricCancelled: 'Биометрия отменена',
        tryBiometricAgain: 'Попробовать биометрию снова',
        cancel: 'Отмена',
        delete: 'Удалить',
        biometricPrompt: 'Приложите палец для входа',
        fallbackToPinPrompt: 'Использовать PIN?',
        setupBiometric: `Настроить ${biometricType}`,
        enableBiometric: `Включить ${biometricType}?`,
        biometricSetupOffer: `Использовать ${biometricType} для быстрого входа?`,
        biometricSetupSuccess: `${biometricType} включен`,
        notNow: 'Не сейчас',
        enable: 'Включить',
        authenticating: 'Аутентификация...',
        tapToAuthenticate: 'Нажмите для входа',
        initError: 'Ошибка аутентификации',
        retryInit: 'Повторить'
      },
      ky: {
        enterPin: 'PIN кодун киргизиңиз',
        enterPinSubtitle: 'Улантуу үчүн 6 сандуу PIN киргизиңиз',
        biometricTitle: 'Биометрикалык аутентификация',
        biometricSubtitle: 'Кирүү үчүн сенсорго тийиңиз',
        incorrectPin: 'Туура эмес PIN код',
        attemptsRemaining: 'аракет калды',
        accountLocked: 'Аккаунт бөгөттөлдү',
        tryAgainIn: 'Кайра аракет кылыңыз',
        minutes: 'мүнөт',
        useBiometric: `${biometricType} колдонуу`,
        enterPinInstead: 'PIN киргизүү',
        biometricFailed: 'Биометрия ийгиликсиз',
        biometricCancelled: 'Биометрия жокко чыгарылды',
        tryBiometricAgain: 'Биометрияны кайра текшерүү',
        cancel: 'Жокко чыгаруу',
        delete: 'Өчүрүү',
        biometricPrompt: 'Кирүү үчүн сенсорго тийиңиз',
        fallbackToPinPrompt: 'PIN колдонууму?',
        setupBiometric: `${biometricType} жөндөө`,
        enableBiometric: `${biometricType} иштетүүбү?`,
        biometricSetupOffer: `Тез кирүү үчүн ${biometricType} колдонуңузбу?`,
        biometricSetupSuccess: `${biometricType} иштетилди`,
        notNow: 'Азырынча жок',
        enable: 'Иштетүү',
        authenticating: 'Текшерүү...',
        tapToAuthenticate: 'Кирүү үчүн басыңыз',
        initError: 'Аутентификация катасы',
        retryInit: 'Кайталоо'
      }
    };
    return texts[language]?.[key] || texts.en[key] || key;
  };

  const shakeError = () => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(); // Simple vibration for iOS
    } else {
      Vibration.vibrate(400);
    }
    
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleNumberPress = (number) => {
    if (pin.length < 6 && !isLockedOut) {
      // Get button index for animation
      const buttonIndex = number === '0' ? 10 : (number === 'delete' ? 11 : parseInt(number) - 1);
      
      // Animate button press
      Animated.sequence([
        Animated.timing(buttonPressAnimations[buttonIndex], {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPressAnimations[buttonIndex], {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      const newPin = pin + number;
      setPin(newPin);

      // Animate PIN dot fill
      if (newPin.length <= 6) {
        Animated.sequence([
          Animated.timing(pinDotAnimations[newPin.length - 1], {
            toValue: 1.2,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.spring(pinDotAnimations[newPin.length - 1], {
            toValue: 1,
            tension: 300,
            friction: 6,
            useNativeDriver: true,
          }),
        ]).start();
      }

      if (newPin.length === 6) {
        setTimeout(() => verifyPin(newPin), 200);
      }
    }
  };

  const handleDeletePress = () => {
    if (pin.length > 0) {
      // Animate delete button
      Animated.sequence([
        Animated.timing(buttonPressAnimations[11], {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPressAnimations[11], {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate PIN dot removal
      Animated.timing(pinDotAnimations[pin.length - 1], {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      setPin(pin.slice(0, -1));
    }
  };

  const verifyPin = async (enteredPin) => {
    try {
      console.log('🔍 Verifying PIN...');
      setLoading(true);
      SecurityService.setCurrentUser(user.id);
      const result = await SecurityService.verifyPin(enteredPin, user.id);

      if (result.success) {
        console.log('✅ PIN verification successful');
        // PIN success - check if we should offer biometric setup
        if (shouldOfferBiometricSetup) {
          setTimeout(() => {
            offerBiometricSetup();
          }, 500);
        } else {
          onSuccess();
        }
      } else {
        console.log('❌ PIN verification failed:', result.error);
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
      console.error('❌ PIN verification error:', error);
      shakeError();
      setPin('');
      Alert.alert('Error', 'Failed to verify PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Offer biometric setup after successful PIN authentication
  const offerBiometricSetup = () => {
    Alert.alert(
      getText('enableBiometric'),
      getText('biometricSetupOffer'),
      [
        { text: getText('notNow'), style: 'cancel', onPress: () => onSuccess() },
        {
          text: getText('enable'),
          onPress: async () => {
            try {
              console.log('🔧 Setting up biometric...');
              const setupResult = await BiometricService.setupBiometric(user.id);
              if (setupResult.success) {
                Alert.alert('Success', getText('biometricSetupSuccess'));
              } else if (!setupResult.cancelled) {
                console.log('Biometric setup failed:', setupResult.error);
                // Don't show error alert if user cancelled
              }
            } catch (error) {
              console.log('Biometric setup error:', error);
            }
            onSuccess();
          }
        }
      ]
    );
  };

  // Enhanced lockout display with live countdown
  const formatLockoutTime = () => {
    const remaining = Math.max(0, lockoutTime - Date.now());
    const totalMinutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    if (totalMinutes > 0) {
      return {
        display: `${totalMinutes}:${seconds.toString().padStart(2, '0')}`,
        minutes: totalMinutes,
        seconds: seconds,
        totalSeconds: Math.floor(remaining / 1000),
        progress: remaining / (30 * 60 * 1000) // Assuming 30 min lockout
      };
    }
    return {
      display: `${seconds}s`,
      minutes: 0,
      seconds: seconds,
      totalSeconds: seconds,
      progress: remaining / (30 * 60 * 1000)
    };
  };

  const renderPinDots = () => (
    <View style={styles.pinDotsContainer}>
      {[...Array(6)].map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.pinDotWrapper,
            {
              transform: [{ scale: pinDotAnimations[index] }]
            }
          ]}
        >
          <View style={[
            styles.pinDot,
            index < pin.length && styles.pinDotFilled,
            isLockedOut && styles.pinDotDisabled
          ]}>
            {index < pin.length && (
              <Animated.View 
                style={[
                  styles.pinDotInner,
                  { opacity: pinDotAnimations[index] }
                ]} 
              />
            )}
            {index < pin.length && (
              <View style={styles.pinDotGlow} />
            )}
          </View>
        </Animated.View>
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
            {row.map((item, itemIndex) => {
              if (item === '') {
                return <View key={itemIndex} style={styles.numberButtonEmpty} />;
              }

              const buttonIndex = item === '0' ? 10 : (item === 'delete' ? 11 : parseInt(item) - 1);

              return (
                <TouchableOpacity
                  key={itemIndex}
                  style={styles.numberButton}
                  onPress={() => {
                    if (item === 'delete') {
                      handleDeletePress();
                    } else {
                      handleNumberPress(item);
                    }
                  }}
                  disabled={loading || isLockedOut}
                  activeOpacity={0.8}
                >
                  <Animated.View 
                    style={[
                      styles.numberButtonAnimated,
                      {
                        transform: [{ scale: buttonPressAnimations[buttonIndex] }]
                      }
                    ]}
                  >
                    <View style={[
                      styles.numberButtonGradient,
                      isLockedOut && styles.numberButtonDisabled
                    ]}>
                      {item === 'delete' ? (
                        <Ionicons
                          name="backspace-outline"
                          size={28}
                          color={isLockedOut ? "#6b7280" : "#ffffff"}
                          style={styles.deleteIcon}
                        />
                      ) : (
                        <Text style={[
                          styles.numberButtonText,
                          isLockedOut && styles.numberButtonTextDisabled
                        ]}>
                          {item}
                        </Text>
                      )}
                    </View>
                  </Animated.View>
                  
                  {/* Button glow effect */}
                  {!isLockedOut && (
                    <View style={styles.buttonGlow} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  // Render enhanced lockout screen
  const renderLockoutScreen = () => {
    const timeData = formatLockoutTime();
    
    return (
      <Animated.View style={[
        styles.lockoutContainer,
        { opacity: fadeAnimation }
      ]}>
        {/* Lockout Icon */}
        <View style={styles.lockoutIconContainer}>
          <Ionicons 
            name="lock-closed" 
            size={64} 
            color="#ef4444" 
            style={styles.lockoutIcon}
          />
          <View style={styles.lockoutIconGlow} />
        </View>

        {/* Title & Message */}
        <Text style={styles.lockoutTitle}>
          {getText('accountTemporarilyLocked')}
        </Text>
        
        <Text style={styles.lockoutMessage}>
          {getText('tooManyAttempts')}
        </Text>
        
        <Text style={styles.lockoutSubMessage}>
          {getText('securityMeasure')}
        </Text>

        {/* Countdown Timer */}
        <View style={styles.countdownContainer}>
          <View style={styles.countdownCircle}>
            <View style={[
              styles.countdownProgress,
              { 
                transform: [{
                  rotate: `${(1 - timeData.progress) * 360}deg`
                }]
              }
            ]} />
            <View style={styles.countdownInner}>
              <Text style={styles.countdownTime}>
                {timeData.display}
              </Text>
            </View>
          </View>
          
          <Text style={styles.timeRemainingText}>
            {getText('timeRemaining')}
          </Text>
        </View>

        {/* Alternative Actions */}
        <View style={styles.lockoutActions}>
          {/* Biometric Option (if available) */}
          {biometricAvailable && biometricSetup && (
            <>
              <TouchableOpacity
                style={styles.biometricLockoutButton}
                onPress={() => promptBiometricAuth(false)}
              >
                <Ionicons
                  name={biometricType === 'Face ID' ? 'scan' : 'finger-print'}
                  size={24}
                  color="#98DDA6"
                />
                <Text style={styles.biometricLockoutText}>
                  {getText('useBiometricWhileLocked')}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.orDivider}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>{getText('or')}</Text>
                <View style={styles.orLine} />
              </View>
            </>
          )}

          {/* Forgot PIN */}
          <TouchableOpacity
            style={styles.forgotPinLockoutButton}
            onPress={() => {
              Alert.alert(
                getText('forgotPinHelp'),
                'You can reset your PIN by contacting support or using account recovery options.',
                [
                  { text: getText('cancel'), style: 'cancel' },
                  { text: getText('contactSupport'), onPress: () => {
                    // Handle contact support
                    Alert.alert('Contact Support', 'Please call +1-800-SUPPORT or email support@akchabar.com');
                  }}
                ]
              );
            }}
          >
            <Ionicons name="help-circle" size={20} color="#f59e0b" />
            <Text style={styles.forgotPinLockoutText}>
              {getText('forgotPinHelp')}
            </Text>
          </TouchableOpacity>

          {/* Refresh Status */}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              // Force check lockout status
              const remaining = lockoutTime - Date.now();
              if (remaining <= 0) {
                setIsLockedOut(false);
                setLockoutTime(0);
                setAttempts(0);
              }
            }}
          >
            <Ionicons name="refresh" size={20} color="#9ca3af" />
            <Text style={styles.refreshText}>
              {getText('refreshStatus')}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // Render initialization error screen
  const renderInitError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={64} color="#ef4444" />
      <Text style={styles.errorTitle}>{getText('initError')}</Text>
      <Text style={styles.errorMessage}>{initError}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => {
          setInitError(null);
          setInitialized(false);
          initializeAuthentication();
        }}
      >
        <Text style={styles.retryButtonText}>{getText('retryInit')}</Text>
      </TouchableOpacity>
      {onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>{getText('cancel')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render biometric prompt screen
  const renderBiometricPrompt = () => (
    <Animated.View style={[styles.biometricContainer, { opacity: fadeAnimation }]}>
      <View style={styles.biometricContent}>
        <Animated.View style={[
          styles.biometricIcon,
          { transform: [{ scale: biometricScaleAnim }] }
        ]}>
          <Ionicons
            name={biometricType === 'Face ID' ? 'scan' : 'finger-print'}
            size={80}
            color="#98DDA6"
          />
        </Animated.View>
        
        <Text style={styles.biometricTitle}>
          {getText('biometricTitle')}
        </Text>
        
        <Text style={styles.biometricSubtitle}>
          {getText('biometricSubtitle')}
        </Text>
        
        <TouchableOpacity
          style={[styles.biometricButton, loading && styles.biometricButtonDisabled]}
          onPress={() => promptBiometricAuth(false)}
          disabled={loading}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#000000" />
              <Text style={styles.biometricButtonText}>
                {getText('authenticating')}
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name={biometricType === 'Face ID' ? 'scan' : 'finger-print'}
                size={24}
                color="#000000"
              />
              <Text style={styles.biometricButtonText}>
                {getText('tapToAuthenticate')}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.fallbackButton}
          onPress={switchToPinEntry}
        >
          <Text style={styles.fallbackButtonText}>
            {getText('enterPinInstead')}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // Render PIN input screen
  const renderPinInput = () => {
    // Show lockout screen if user is locked out
    if (isLockedOut) {
      return renderLockoutScreen();
    }

    return (
      <Animated.View
        style={[
          styles.pinContainer,
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
            {getText('enterPinSubtitle')}
          </Text>

          {attempts > 0 && (
            <View style={styles.attemptsContainer}>
              <Ionicons name="warning" size={16} color="#f59e0b" />
              <Text style={styles.attemptsText}>
                {attempts}/5 {getText('attemptsRemaining')}
              </Text>
            </View>
          )}
        </View>

        {/* PIN Dots */}
        {renderPinDots()}

        {/* Number Pad */}
        {renderNumberPad()}

        {/* Options */}
        <View style={styles.optionsContainer}>
          {/* Biometric Option (if available) */}
          {biometricAvailable && biometricSetup && (
            <TouchableOpacity
              style={styles.switchToBiometricButton}
              onPress={switchToBiometric}
            >
              <Ionicons
                name={biometricType === 'Face ID' ? 'scan' : 'finger-print'}
                size={20}
                color="#98DDA6"
              />
              <Text style={styles.switchToBiometricText}>
                {getText('useBiometric')}
              </Text>
            </TouchableOpacity>
          )}

          {/* Forgot PIN Option */}
          <TouchableOpacity
            style={styles.forgotPinButton}
            onPress={() => {
              Alert.alert(
                'Forgot PIN',
                'Contact support to reset your PIN or use biometric authentication if available.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Contact Support', onPress: () => {
                    Alert.alert('Contact Support', 'Please call +1-800-SUPPORT or email support@akchabar.com');
                  }}
                ]
              );
            }}
          >
            <Text style={styles.forgotPinText}>
              Forgot PIN?
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#98DDA6" />
          </View>
        )}
      </Animated.View>
    );
  };

  // Show loading screen until initialized
  if (!initialized) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#05212a" />
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color="#98DDA6" />
          <Text style={styles.loadingText}>Initializing authentication...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error screen if initialization failed
  if (initError) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#05212a" />
        {renderInitError()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#05212a" />
      
      {/* Enhanced Background */}
      <View style={styles.backgroundOverlay} />

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

        {/* Main Authentication Content */}
        {showBiometricPrompt 
          ? renderBiometricPrompt() 
          : renderPinInput()
        }
      </View>
    </SafeAreaView>
  );
};

// Enhanced styles with premium visual design (no external dependencies)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05212a',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a2530',
    opacity: 0.7,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#98DDA6',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 15,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#9ca3af',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cancelText: {
    fontSize: 16,
    color: '#9ca3af',
  },

  // Enhanced Biometric Prompt Styles
  biometricContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  biometricIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(152, 221, 166, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    borderWidth: 3,
    borderColor: 'rgba(152, 221, 166, 0.4)',
    shadowColor: '#98DDA6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  biometricTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  biometricSubtitle: {
    fontSize: 18,
    color: '#b0b7c3',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 50,
  },
  biometricButton: {
    backgroundColor: '#98DDA6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 20,
    marginBottom: 20,
    minWidth: 220,
    shadowColor: '#98DDA6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  biometricButtonDisabled: {
    opacity: 0.6,
  },
  biometricButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginLeft: 10,
  },
  fallbackButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  fallbackButtonText: {
    fontSize: 17,
    color: '#98DDA6',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Enhanced PIN Input Styles
  pinContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: -0.5,
  },
  attemptsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  attemptsText: {
    fontSize: 15,
    color: '#fbbf24',
    fontWeight: '600',
    marginLeft: 6,
  },

  // Enhanced PIN Dots Styles
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  pinDotWrapper: {
    marginHorizontal: 12,
  },
  pinDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: '#4a5568',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pinDotFilled: {
    borderColor: '#98DDA6',
    backgroundColor: 'rgba(152, 221, 166, 0.2)',
    shadowColor: '#98DDA6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  pinDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#98DDA6',
  },
  pinDotGlow: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(152, 221, 166, 0.3)',
    top: -5,
    left: -5,
  },
  pinDotDisabled: {
    borderColor: '#6b7280',
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },

  // Enhanced Number Pad Styles (kept the same as requested)
  numberPad: {
    alignSelf: 'center',
    width: 320,
    marginBottom: 20,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  numberButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  numberButtonAnimated: {
    width: '100%',
    height: '100%',
    borderRadius: 39,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 39,
    backgroundColor: '#4a5568',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonGlow: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(152, 221, 166, 0.1)',
    top: -3,
    left: -3,
  },
  numberButtonEmpty: {
    width: 78,
    height: 78,
  },
  numberButtonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  numberButtonText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  numberButtonTextDisabled: {
    color: '#6b7280',
  },
  deleteIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Enhanced Options Styles
  optionsContainer: {
    alignItems: 'center',
    gap: 16,
  },
  switchToBiometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(152, 221, 166, 0.15)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(152, 221, 166, 0.4)',
    shadowColor: '#98DDA6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  switchToBiometricText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#98DDA6',
    marginLeft: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  forgotPinButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  forgotPinText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },

  // NEW: Lockout Screen Styles
  lockoutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  lockoutIconContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  lockoutIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  lockoutIconGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    top: -8,
    left: -8,
  },
  lockoutTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  lockoutMessage: {
    fontSize: 18,
    color: '#fbbf24',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  lockoutSubMessage: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  countdownCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#4a5568',
  },
  countdownProgress: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#ef4444',
    borderTopColor: 'transparent',
    top: 2,
    left: 2,
  },
  countdownInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownTime: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  timeRemainingText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '500',
  },
  lockoutActions: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  biometricLockoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(152, 221, 166, 0.15)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(152, 221, 166, 0.4)',
    width: '100%',
    maxWidth: 280,
  },
  biometricLockoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#98DDA6',
    marginLeft: 10,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 200,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#4a5568',
  },
  orText: {
    fontSize: 14,
    color: '#9ca3af',
    paddingHorizontal: 16,
    fontWeight: '500',
  },
  forgotPinLockoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  forgotPinLockoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f59e0b',
    marginLeft: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  refreshText: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 6,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
});

export default PinEntry;