// src/components/auth/PinEntry.js - iOS-Safe Version with Better Error Handling
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
  
  // Animations
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const biometricScaleAnim = useRef(new Animated.Value(0.8)).current;

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
  const renderPinInput = () => (
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

      {/* Biometric Option (if available and not locked out) */}
      {biometricAvailable && biometricSetup && !isLockedOut && (
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

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#98DDA6" />
        </View>
      )}
    </Animated.View>
  );

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
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 16,
    fontSize: 16,
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
    borderRadius: 8,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelText: {
    fontSize: 16,
    color: '#9ca3af',
  },

  // Biometric Prompt Styles
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
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(152, 221, 166, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(152, 221, 166, 0.3)',
  },
  biometricTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  biometricSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  biometricButton: {
    backgroundColor: '#98DDA6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 20,
    minWidth: 200,
    shadowColor: '#98DDA6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  biometricButtonDisabled: {
    opacity: 0.6,
  },
  biometricButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  fallbackButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  fallbackButtonText: {
    fontSize: 16,
    color: '#98DDA6',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },

  // PIN Input Styles
  pinContainer: {
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
  switchToBiometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(152, 221, 166, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(152, 221, 166, 0.3)',
    alignSelf: 'center',
  },
  switchToBiometricText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#98DDA6',
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
});

export default PinEntry;