// src/components/auth/PinEntry.js - ENHANCED UX VERSION with Manual Biometric
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
  Modal,
  TextInput,
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
  
  // Forgot PIN Modal States
  const [showForgotPinModal, setShowForgotPinModal] = useState(false);
  const [forgotPinStep, setForgotPinStep] = useState(1); // 1: choose method, 2: enter code, 3: set new PIN
  const [resetMethod, setResetMethod] = useState(''); // 'sms' or 'email'
  const [resetCode, setResetCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [forgotPinLoading, setForgotPinLoading] = useState(false);
  
  // Biometric states
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricSetup, setBiometricSetup] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric');
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [shouldOfferBiometricSetup, setShouldOfferBiometricSetup] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  
  // Animations
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const biometricScaleAnim = useRef(new Animated.Value(0.8)).current;
  const pinDotAnimations = useRef([...Array(6)].map(() => new Animated.Value(0))).current;
  const buttonPressAnimations = useRef([...Array(12)].map(() => new Animated.Value(1))).current;

  // UX ENHANCEMENT: Automatic countdown timer
  const lockoutTimerRef = useRef(null);
  
  useEffect(() => {
    if (user?.id) {
      console.log('PinEntry initialized for user:', user.id);
      SecurityService.setCurrentUser(user.id);
      initializeAuthentication();
    } else {
      console.error('No user provided to PinEntry');
      setInitError('No user provided');
      setInitialized(true);
    }

    return () => {
      if (lockoutTimerRef.current) {
        clearInterval(lockoutTimerRef.current);
      }
    };
  }, [user?.id]);

  // UX ENHANCEMENT: Automatic real-time countdown (no button clicks needed!)
  useEffect(() => {
    if (isLockedOut && lockoutTime > 0) {
      if (lockoutTimerRef.current) {
        clearInterval(lockoutTimerRef.current);
      }

      lockoutTimerRef.current = setInterval(() => {
        const remaining = lockoutTime - Date.now();

        if (remaining <= 0) {
          console.log('Lockout period expired, automatically unlocking...');
          clearInterval(lockoutTimerRef.current);
          lockoutTimerRef.current = null;
          
          // Reset lockout state
          setIsLockedOut(false);
          setLockoutTime(0);
          setAttempts(0);
          
          // Reset in security service
          SecurityService.resetFailedAttempts(user.id);
          
          // Show unlock notification
          Alert.alert(
            getText('accountUnlocked'),
            getText('accountUnlockedMessage'),
            [{ text: 'OK' }]
          );
        } else {
          // Force re-render to update countdown display
          setPin(prevPin => prevPin);
        }
      }, 1000);
    }

    return () => {
      if (lockoutTimerRef.current) {
        clearInterval(lockoutTimerRef.current);
      }
    };
  }, [isLockedOut, lockoutTime, user?.id]);

  const initializeAuthentication = async () => {
    try {
      console.log('Initializing authentication flow...');
      setLoading(true);
      
      if (!user?.id) {
        throw new Error('User ID is required for PIN authentication');
      }

      let status;
      try {
        status = await SecurityService.getSecurityStatus(user.id);
        console.log('Security status:', status);
      } catch (securityError) {
        console.error('Security status check failed, retrying...', securityError);
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          status = await SecurityService.getSecurityStatus(user.id);
        } catch (retryError) {
          console.error('Security status retry failed:', retryError);
          status = {
            pinSetup: false,
            failedAttempts: 0,
            isLockedOut: false,
            lockoutRemainingTime: 0
          };
        }
      }

      setAttempts(status.failedAttempts || 0);
      
      if (status.isLockedOut && status.lockoutRemainingTime > 0) {
        console.log('User is locked out:', {
          remainingTime: Math.round(status.lockoutRemainingTime / 1000),
          lockoutEndTime: new Date(Date.now() + status.lockoutRemainingTime).toLocaleTimeString()
        });
        
        setIsLockedOut(true);
        setLockoutTime(Date.now() + status.lockoutRemainingTime);
        setShowPinInput(true);
        setShowBiometricPrompt(false);
      } else if (status.isLockedOut) {
        console.log('Lockout expired, resetting...');
        await SecurityService.resetFailedAttempts(user.id);
        setIsLockedOut(false);
        setLockoutTime(0);
        setAttempts(0);
      }

      let biometricInfo;
      try {
        biometricInfo = await BiometricService.getBiometricInfo(user.id);
        console.log('Biometric info:', biometricInfo);
      } catch (biometricError) {
        console.error('Biometric info check failed:', biometricError);
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

      if (!status.isLockedOut) {
        if (biometricInfo.available && biometricInfo.isSetup) {
          console.log('Showing biometric authentication screen');
          setShowBiometricPrompt(true);
          setShowPinInput(false);
          startBiometricAnimation();
        } else {
          console.log('Showing PIN input');
          setShowPinInput(true);
          setShowBiometricPrompt(false);
          
          if (biometricInfo.hasHardware && biometricInfo.isEnrolled && !biometricInfo.isSetup) {
            setShouldOfferBiometricSetup(true);
          }
        }
      } else {
        console.log('User locked out - PIN only');
        setShowPinInput(true);
        setShowBiometricPrompt(false);
      }

      setInitialized(true);
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
    } catch (error) {
      console.error('Initialize authentication error:', error);
      setInitError(error.message || 'Failed to initialize authentication');
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

  // UX ENHANCEMENT: Forgot PIN functionality
  const handleForgotPin = () => {
    setShowForgotPinModal(true);
    setForgotPinStep(1);
    setResetMethod('');
    setResetCode('');
    setNewPin('');
    setConfirmNewPin('');
  };

  const sendResetCode = async () => {
    if (!resetMethod) {
      Alert.alert(getText('error'), getText('selectResetMethod'));
      return;
    }

    try {
      setForgotPinLoading(true);
      
      // Simulate sending code (replace with actual API call)
      console.log(`Sending PIN reset code via ${resetMethod} to user:`, user.id);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, we'll simulate success
      Alert.alert(
        getText('codeSent'),
        resetMethod === 'sms' 
          ? getText('codeSentToPhone') 
          : getText('codeSentToEmail')
      );
      
      setForgotPinStep(2);
    } catch (error) {
      console.error('Send reset code error:', error);
      Alert.alert(getText('error'), getText('failedToSendCode'));
    } finally {
      setForgotPinLoading(false);
    }
  };

  const verifyResetCode = async () => {
    if (!resetCode || resetCode.length !== 6) {
      Alert.alert(getText('error'), getText('enterValidCode'));
      return;
    }

    try {
      setForgotPinLoading(true);
      
      // Simulate code verification (replace with actual API call)
      console.log(`Verifying reset code: ${resetCode} for user:`, user.id);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo, accept any 6-digit code
      if (resetCode.length === 6) {
        setForgotPinStep(3);
      } else {
        Alert.alert(getText('error'), getText('invalidCode'));
      }
    } catch (error) {
      console.error('Verify reset code error:', error);
      Alert.alert(getText('error'), getText('codeVerificationFailed'));
    } finally {
      setForgotPinLoading(false);
    }
  };

  const resetPin = async () => {
    if (!newPin || newPin.length !== 6) {
      Alert.alert(getText('error'), getText('enterValidPin'));
      return;
    }

    if (newPin !== confirmNewPin) {
      Alert.alert(getText('error'), getText('pinsDoNotMatch'));
      return;
    }

    // Check for weak PINs
    const validation = SecurityService.validatePinFormat(newPin);
    if (!validation.valid) {
      Alert.alert(getText('error'), validation.error);
      return;
    }

    try {
      setForgotPinLoading(true);
      
      // Reset the PIN using security service
      SecurityService.setCurrentUser(user.id);
      
      // Remove old PIN and set new one
      await SecurityService.removeExistingPin(user.id);
      const result = await SecurityService.setupPin(newPin, user.id);
      
      if (result.success) {
        Alert.alert(
          getText('success'),
          getText('pinResetSuccess'),
          [
            {
              text: 'OK',
              onPress: () => {
                setShowForgotPinModal(false);
                // Reset all states
                setForgotPinStep(1);
                setResetMethod('');
                setResetCode('');
                setNewPin('');
                setConfirmNewPin('');
                // Re-initialize authentication
                initializeAuthentication();
              }
            }
          ]
        );
      } else {
        Alert.alert(getText('error'), result.error || getText('pinResetFailed'));
      }
    } catch (error) {
      console.error('Reset PIN error:', error);
      Alert.alert(getText('error'), getText('pinResetFailed'));
    } finally {
      setForgotPinLoading(false);
    }
  };

  const verifyPin = async (enteredPin) => {
    try {
      console.log('Verifying PIN for user:', user?.id);
      setLoading(true);
      
      if (!user?.id) {
        throw new Error('User ID is required for PIN verification');
      }

      SecurityService.setCurrentUser(user.id);
      const result = await SecurityService.verifyPin(enteredPin, user.id);
      console.log('PIN verification result:', result);

      if (result.success) {
        console.log('PIN verification successful');
        if (lockoutTimerRef.current) {
          clearInterval(lockoutTimerRef.current);
          lockoutTimerRef.current = null;
        }
        
        if (shouldOfferBiometricSetup) {
          setTimeout(() => {
            offerBiometricSetup();
          }, 500);
        } else {
          onSuccess();
        }
      } else {
        console.log('PIN verification failed:', result);
        shakeError();
        setPin('');
        
        if (result.lockedOut) {
          console.log('Account locked out!');
          setIsLockedOut(true);
          setAttempts(5);
          
          if (result.remainingTime) {
            const lockoutEndTime = Date.now() + result.remainingTime;
            setLockoutTime(lockoutEndTime);
            console.log('Lockout set until:', new Date(lockoutEndTime).toLocaleTimeString());
          } else {
            const lockoutEndTime = Date.now() + (30 * 60 * 1000);
            setLockoutTime(lockoutEndTime);
            console.log('Default lockout set until:', new Date(lockoutEndTime).toLocaleTimeString());
          }
          
          Alert.alert(
            getText('accountLocked'), 
            result.error || getText('accountLockedMessage')
          );
        } else {
          const attemptsUsed = result.remainingAttempts ? (5 - result.remainingAttempts) : attempts + 1;
          setAttempts(attemptsUsed);
          console.log('Failed attempts:', attemptsUsed);
          
          Alert.alert(
            getText('incorrectPin'), 
            result.error || `${getText('incorrectPin')}. ${result.remainingAttempts || (5 - attemptsUsed)} ${getText('attemptsRemaining')}`
          );
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

  const formatLockoutTime = () => {
    const remaining = Math.max(0, lockoutTime - Date.now());
    const totalMinutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    const totalSeconds = Math.floor(remaining / 1000);
    
    const progress = remaining / (30 * 60 * 1000);
    
    if (totalMinutes > 0) {
      return {
        display: `${totalMinutes}:${seconds.toString().padStart(2, '0')}`,
        minutes: totalMinutes,
        seconds: seconds,
        totalSeconds: totalSeconds,
        progress: Math.min(1, Math.max(0, progress))
      };
    }
    
    return {
      display: `${seconds}s`,
      minutes: 0,
      seconds: seconds,
      totalSeconds: totalSeconds,
      progress: Math.min(1, Math.max(0, progress))
    };
  };

  // Enhanced getText with forgot PIN translations
  const getText = (key) => {
    const texts = {
      en: {
        enterPin: 'Enter Your PIN',
        enterPinSubtitle: 'Enter your 6-digit PIN to continue',
        incorrectPin: 'Incorrect PIN',
        attemptsRemaining: 'attempts remaining',
        accountLocked: 'Account Locked',
        accountLockedMessage: 'Too many failed attempts. Your account has been locked for 30 minutes for security.',
        accountUnlocked: 'Account Unlocked',
        accountUnlockedMessage: 'You can now enter your PIN to continue.',
        accountTemporarilyLocked: 'Account Temporarily Locked',
        tooManyAttempts: 'Too many incorrect PIN attempts',
        securityMeasure: 'This is a security measure to protect your account',
        timeRemaining: 'Time remaining',
        forgotPin: 'Forgot PIN?',
        resetPin: 'Reset PIN',
        resetYourPin: 'Reset Your PIN',
        chooseResetMethod: 'How would you like to reset your PIN?',
        resetViaSms: 'Send code via SMS',
        resetViaEmail: 'Send code via Email',
        sendCode: 'Send Code',
        enterResetCode: 'Enter Reset Code',
        resetCodeSent: 'We sent a 6-digit code to your ',
        enterCodeBelow: 'Enter the code below:',
        verifyCode: 'Verify Code',
        createNewPin: 'Create New PIN',
        enterNewPin: 'Enter your new 6-digit PIN',
        confirmNewPin: 'Confirm your new PIN',
        resetPinButton: 'Reset PIN',
        codeSent: 'Code Sent',
        codeSentToPhone: 'A verification code has been sent to your phone number.',
        codeSentToEmail: 'A verification code has been sent to your email address.',
        error: 'Error',
        success: 'Success',
        selectResetMethod: 'Please select a reset method',
        enterValidCode: 'Please enter a valid 6-digit code',
        enterValidPin: 'Please enter a valid 6-digit PIN',
        pinsDoNotMatch: 'PINs do not match',
        invalidCode: 'Invalid verification code',
        failedToSendCode: 'Failed to send verification code. Please try again.',
        codeVerificationFailed: 'Code verification failed. Please try again.',
        pinResetSuccess: 'Your PIN has been successfully reset!',
        pinResetFailed: 'Failed to reset PIN. Please try again.',
        cancel: 'Cancel',
        back: 'Back',
        useBiometric: `Use ${biometricType}`,
        enterPinInstead: 'Enter PIN Instead',
        biometricTitle: 'Biometric Authentication',
        biometricSubtitle: `Use ${biometricType} to authenticate`,
        authenticating: 'Authenticating...',
        tapToAuthenticate: 'Tap to authenticate',
        biometricFailed: 'Biometric Failed',
        biometricCancelled: 'Biometric Cancelled',
        tryBiometricAgain: 'Try Again',
        fallbackToPinPrompt: 'Use PIN instead?',
        or: 'or',
        initError: 'Authentication Error',
        retryInit: 'Retry',
        logout: 'Logout'
      },
      ru: {
        enterPin: 'Введите PIN-код',
        enterPinSubtitle: 'Введите 6-значный PIN для продолжения',
        incorrectPin: 'Неверный PIN-код',
        attemptsRemaining: 'попыток осталось',
        accountLocked: 'Аккаунт заблокирован',
        accountLockedMessage: 'Слишком много неудачных попыток. Ваш аккаунт заблокирован на 30 минут для безопасности.',
        accountUnlocked: 'Аккаунт разблокирован',
        accountUnlockedMessage: 'Теперь вы можете ввести PIN для продолжения.',
        accountTemporarilyLocked: 'Аккаунт временно заблокирован',
        tooManyAttempts: 'Слишком много неверных попыток ввода PIN',
        securityMeasure: 'Это мера безопасности для защиты вашего аккаунта',
        timeRemaining: 'Время до разблокировки',
        forgotPin: 'Забыли PIN?',
        resetPin: 'Сброс PIN',
        resetYourPin: 'Сброс PIN-кода',
        chooseResetMethod: 'Как вы хотите сбросить PIN?',
        resetViaSms: 'Отправить код по SMS',
        resetViaEmail: 'Отправить код на email',
        sendCode: 'Отправить код',
        enterResetCode: 'Введите код сброса',
        resetCodeSent: 'Мы отправили 6-значный код на ваш ',
        enterCodeBelow: 'Введите код ниже:',
        verifyCode: 'Проверить код',
        createNewPin: 'Создать новый PIN',
        enterNewPin: 'Введите новый 6-значный PIN',
        confirmNewPin: 'Подтвердите новый PIN',
        resetPinButton: 'Сбросить PIN',
        codeSent: 'Код отправлен',
        codeSentToPhone: 'Код подтверждения отправлен на ваш номер телефона.',
        codeSentToEmail: 'Код подтверждения отправлен на вашу электронную почту.',
        error: 'Ошибка',
        success: 'Успешно',
        selectResetMethod: 'Пожалуйста, выберите способ сброса',
        enterValidCode: 'Пожалуйста, введите действительный 6-значный код',
        enterValidPin: 'Пожалуйста, введите действительный 6-значный PIN',
        pinsDoNotMatch: 'PIN-коды не совпадают',
        invalidCode: 'Неверный код подтверждения',
        failedToSendCode: 'Не удалось отправить код. Попробуйте еще раз.',
        codeVerificationFailed: 'Проверка кода не удалась. Попробуйте еще раз.',
        pinResetSuccess: 'Ваш PIN был успешно сброшен!',
        pinResetFailed: 'Не удалось сбросить PIN. Попробуйте еще раз.',
        cancel: 'Отмена',
        back: 'Назад',
        useBiometric: `Использовать ${biometricType}`,
        enterPinInstead: 'Ввести PIN',
        biometricTitle: 'Биометрическая аутентификация', 
        biometricSubtitle: `Используйте ${biometricType} для входа`,
        authenticating: 'Аутентификация...',
        tapToAuthenticate: 'Нажмите для входа',
        biometricFailed: 'Биометрия не удалась',
        biometricCancelled: 'Биометрия отменена',
        tryBiometricAgain: 'Попробовать снова',
        fallbackToPinPrompt: 'Использовать PIN?',
        or: 'или',
        initError: 'Ошибка аутентификации',
        retryInit: 'Повторить',
        logout: 'Выйти'
      },
      ky: {
        enterPin: 'PIN кодун киргизиңиз',
        enterPinSubtitle: 'Улантуу үчүн 6 сандуу PIN киргизиңиз',
        incorrectPin: 'Туура эмес PIN код',
        attemptsRemaining: 'аракет калды',
        accountLocked: 'Аккаунт бөгөттөлдү',
        accountLockedMessage: 'Өтө көп туура эмес аракет. Коопсуздук үчүн аккаунтуңуз 30 мүнөткө бөгөттөлдү.',
        accountUnlocked: 'Аккаунт бөгөттөн чыгарылды',
        accountUnlockedMessage: 'Эми улантуу үчүн PIN кодуңузду киргизе аласыз.',
        accountTemporarilyLocked: 'Аккаунт убактылуу бөгөттөлдү',
        tooManyAttempts: 'PIN кодун туура эмес көп жолу киргизүү',
        securityMeasure: 'Бул аккаунтуңузду коргоо үчүн коопсуздук чарасы',
        timeRemaining: 'Калган убакыт',
        forgotPin: 'PIN код унуттулдубу?',
        resetPin: 'PIN кодун калыбына келтирүү',
        resetYourPin: 'PIN кодуңузду калыбына келтириңиз',
        chooseResetMethod: 'PIN кодуңузду кантип калыбына келтиргиңиз келет?',
        resetViaSms: 'SMS аркылуу код жөнөтүү',
        resetViaEmail: 'Email аркылуу код жөнөтүү',
        sendCode: 'Код жөнөтүү',
        enterResetCode: 'Калыбына келтирүү кодун киргизиңиз',
        resetCodeSent: 'Биз 6 сандуу коддү сиздин ',
        enterCodeBelow: 'Төмөндө коддү киргизиңиз:',
        verifyCode: 'Коддү текшерүү',
        createNewPin: 'Жаңы PIN түзүү',
        enterNewPin: 'Жаңы 6 сандуу PIN киргизиңиз',
        confirmNewPin: 'Жаңы PIN кодуңузду ырастаңыз',
        resetPinButton: 'PIN калыбына келтирүү',
        codeSent: 'Код жөнөтүлдү',
        codeSentToPhone: 'Ырастоо кодду телефон номериңизге жөнөтүлдү.',
        codeSentToEmail: 'Ырастоо кодду электрондук почтаңызга жөнөтүлдү.',
        error: 'Ката',
        success: 'Ийгиликтүү',
        selectResetMethod: 'Калыбына келтирүү ыкмасын тандаңыз',
        enterValidCode: '6 сандуу туура коддү киргизиңиз',
        enterValidPin: '6 сандуу туура PIN киргизиңиз',
        pinsDoNotMatch: 'PIN коддор дал келген жок',
        invalidCode: 'Туура эмес ырастоо коду',
        failedToSendCode: 'Коддү жөнөтүү ийгиликсиз болду. Кайра аракет кылыңыз.',
        codeVerificationFailed: 'Коддү текшерүү ийгиликсиз болду. Кайра аракет кылыңыз.',
        pinResetSuccess: 'PIN кодуңуз ийгиликтүү калыбына келтирилди!',
        pinResetFailed: 'PIN кодун калыбына келтирүү ийгиликсиз болду. Кайра аракет кылыңыз.',
        cancel: 'Жокко чыгаруу',
        back: 'Артка',
        useBiometric: `${biometricType} колдонуу`,
        enterPinInstead: 'PIN киргизүү',
        biometricTitle: 'Биометрикалык аутентификация',
        biometricSubtitle: `Кирүү үчүн ${biometricType} колдоңуз`,
        authenticating: 'Текшерүү...',
        tapToAuthenticate: 'Кирүү үчүн басыңыз',
        biometricFailed: 'Биометрия ийгиликсиз',
        biometricCancelled: 'Биометрия жокко чыгарылды',
        tryBiometricAgain: 'Кайра аракет кылуу',
        fallbackToPinPrompt: 'PIN колдонууму?',
        or: 'же',
        initError: 'Аутентификация катасы',
        retryInit: 'Кайталоо',
        logout: 'Чыгуу'
      }
    };
    return texts[language]?.[key] || texts.en[key] || key;
  };

  const shakeError = () => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate();
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
      const buttonIndex = number === '0' ? 10 : (number === 'delete' ? 11 : parseInt(number) - 1);
      
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

      Animated.timing(pinDotAnimations[pin.length - 1], {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      setPin(pin.slice(0, -1));
    }
  };

  const startBiometricAnimation = () => {
    Animated.spring(biometricScaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

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
        if (showBiometricPrompt) {
          pulse();
        }
      });
    };
    
    setTimeout(pulse, 300);
  };

  // CHANGED: Manual biometric authentication - no auto-prompt
  const handleBiometricLogin = async () => {
    try {
      console.log('Manual biometric authentication triggered...');
      setLoading(true);
      
      const result = await BiometricService.authenticateWithBiometric(
        'Authenticate to access your Akchabar account'
      );

      console.log('Biometric result:', result);

      if (result.success) {
        console.log('Biometric authentication successful');
        setLoading(false);
        onSuccess();
      } else if (result.cancelled) {
        console.log('Biometric cancelled by user');
        setLoading(false);
        // Stay on biometric screen, let user try again or switch to PIN
      } else if (result.locked) {
        console.log('Biometric locked out');
        setLoading(false);
        Alert.alert(
          'Biometric Locked',
          result.error || 'Biometric authentication is temporarily disabled.',
          [{ text: 'Use PIN', onPress: switchToPinEntry }]
        );
      } else {
        console.log('Biometric failed:', result.error);
        setLoading(false);
        Alert.alert(
          getText('biometricFailed'),
          result.error || 'Please try again or use your PIN.',
          [
            { text: getText('tryBiometricAgain'), onPress: () => {} },
            { text: getText('enterPinInstead'), onPress: switchToPinEntry }
          ]
        );
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      setLoading(false);
      Alert.alert(
        getText('biometricFailed'),
        'Biometric authentication failed. Please try again or use your PIN.',
        [{ text: 'Use PIN', onPress: switchToPinEntry }]
      );
    }
  };

  const switchToPinEntry = () => {
    console.log('Switching to PIN entry');
    setShowBiometricPrompt(false);
    setShowPinInput(true);
    setPin('');
  };

  const switchToBiometric = () => {
    if (biometricAvailable && biometricSetup && !isLockedOut) {
      console.log('Switching to biometric');
      setShowPinInput(false);
      setShowBiometricPrompt(true);
      setPin('');
      startBiometricAnimation();
    }
  };

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
              console.log('Setting up biometric...');
              const setupResult = await BiometricService.setupBiometric(user.id);
              if (setupResult.success) {
                Alert.alert('Success', getText('biometricSetupSuccess'));
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

  // UX ENHANCEMENT: Forgot PIN Modal
  const renderForgotPinModal = () => (
    <Modal
      visible={showForgotPinModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowForgotPinModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowForgotPinModal(false)}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{getText('resetYourPin')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.modalContent}>
          {forgotPinStep === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>{getText('chooseResetMethod')}</Text>
              
              <TouchableOpacity
                style={[
                  styles.resetMethodButton,
                  resetMethod === 'sms' && styles.resetMethodButtonSelected
                ]}
                onPress={() => setResetMethod('sms')}
              >
                <Ionicons 
                  name="chatbox" 
                  size={24} 
                  color={resetMethod === 'sms' ? '#000000' : '#ffffff'} 
                />
                <Text style={[
                  styles.resetMethodText,
                  resetMethod === 'sms' && styles.resetMethodTextSelected
                ]}>
                  {getText('resetViaSms')}
                </Text>
                {resetMethod === 'sms' && (
                  <Ionicons name="checkmark-circle" size={20} color="#000000" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.resetMethodButton,
                  resetMethod === 'email' && styles.resetMethodButtonSelected
                ]}
                onPress={() => setResetMethod('email')}
              >
                <Ionicons 
                  name="mail" 
                  size={24} 
                  color={resetMethod === 'email' ? '#000000' : '#ffffff'} 
                />
                <Text style={[
                  styles.resetMethodText,
                  resetMethod === 'email' && styles.resetMethodTextSelected
                ]}>
                  {getText('resetViaEmail')}
                </Text>
                {resetMethod === 'email' && (
                  <Ionicons name="checkmark-circle" size={20} color="#000000" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={sendResetCode}
                disabled={!resetMethod || forgotPinLoading}
              >
                {forgotPinLoading ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.modalButtonText}>{getText('sendCode')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {forgotPinStep === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>{getText('enterResetCode')}</Text>
              <Text style={styles.stepSubtitle}>
                {getText('resetCodeSent')}
                {resetMethod === 'sms' ? 'phone number' : 'email address'}
              </Text>

              <TextInput
                style={styles.codeInput}
                value={resetCode}
                onChangeText={(text) => setResetCode(text.replace(/\D/g, '').substring(0, 6))}
                placeholder="000000"
                placeholderTextColor="#6b7280"
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />

              <View style={styles.modalButtonGroup}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setForgotPinStep(1)}
                >
                  <Text style={styles.modalButtonTextSecondary}>{getText('back')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary, { flex: 1, marginLeft: 12 }]}
                  onPress={verifyResetCode}
                  disabled={resetCode.length !== 6 || forgotPinLoading}
                >
                  {forgotPinLoading ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <Text style={styles.modalButtonText}>{getText('verifyCode')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {forgotPinStep === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>{getText('createNewPin')}</Text>
              <Text style={styles.stepSubtitle}>{getText('enterNewPin')}</Text>

              <View style={styles.pinInputContainer}>
                <Text style={styles.pinInputLabel}>{getText('enterNewPin')}</Text>
                <TextInput
                  style={styles.pinInputField}
                  value={newPin}
                  onChangeText={(text) => setNewPin(text.replace(/\D/g, '').substring(0, 6))}
                  placeholder="••••••"
                  placeholderTextColor="#6b7280"
                  keyboardType="number-pad"
                  maxLength={6}
                  secureTextEntry
                  textAlign="center"
                />
              </View>

              <View style={styles.pinInputContainer}>
                <Text style={styles.pinInputLabel}>{getText('confirmNewPin')}</Text>
                <TextInput
                  style={styles.pinInputField}
                  value={confirmNewPin}
                  onChangeText={(text) => setConfirmNewPin(text.replace(/\D/g, '').substring(0, 6))}
                  placeholder="••••••"
                  placeholderTextColor="#6b7280"
                  keyboardType="number-pad"
                  maxLength={6}
                  secureTextEntry
                  textAlign="center"
                />
              </View>

              <View style={styles.modalButtonGroup}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setForgotPinStep(2)}
                >
                  <Text style={styles.modalButtonTextSecondary}>{getText('back')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary, { flex: 1, marginLeft: 12 }]}
                  onPress={resetPin}
                  disabled={newPin.length !== 6 || confirmNewPin.length !== 6 || forgotPinLoading}
                >
                  {forgotPinLoading ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <Text style={styles.modalButtonText}>{getText('resetPinButton')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderPinDots = () => (
    <View style={styles.pinDotsContainer}>
      {[...Array(6)].map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.pinDotWrapper,
            { transform: [{ scale: pinDotAnimations[index] }] }
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
            {index < pin.length && <View style={styles.pinDotGlow} />}
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
                      { transform: [{ scale: buttonPressAnimations[buttonIndex] }] }
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
                  
                  {!isLockedOut && <View style={styles.buttonGlow} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  // UX ENHANCEMENT: Better lockout screen with automatic countdown
  const renderLockoutScreen = () => {
    const timeData = formatLockoutTime();
    
    return (
      <Animated.View style={[
        styles.lockoutContainer,
        { opacity: fadeAnimation }
      ]}>
        <View style={styles.lockoutIconContainer}>
          <Ionicons 
            name="lock-closed" 
            size={64} 
            color="#ef4444" 
            style={styles.lockoutIcon}
          />
          <View style={styles.lockoutIconGlow} />
        </View>

        <Text style={styles.lockoutTitle}>
          {getText('accountTemporarilyLocked')}
        </Text>
        
        <Text style={styles.lockoutMessage}>
          {getText('tooManyAttempts')}
        </Text>
        
        <Text style={styles.lockoutSubMessage}>
          {getText('securityMeasure')}
        </Text>

        {/* UX ENHANCEMENT: Live countdown with progress ring */}
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

        <View style={styles.lockoutActions}>
          {biometricAvailable && biometricSetup && (
            <>
              <TouchableOpacity
                style={styles.biometricLockoutButton}
                onPress={handleBiometricLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#98DDA6" />
                ) : (
                  <>
                    <Ionicons
                      name={biometricType === 'Face ID' ? 'scan' : 'finger-print'}
                      size={24}
                      color="#98DDA6"
                    />
                    <Text style={styles.biometricLockoutText}>
                      {getText('useBiometric')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              
              <View style={styles.orDivider}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>{getText('or')}</Text>
                <View style={styles.orLine} />
              </View>
            </>
          )}

          {/* UX ENHANCEMENT: Forgot PIN option during lockout */}
          <TouchableOpacity
            style={styles.forgotPinLockoutButton}
            onPress={handleForgotPin}
          >
            <Ionicons name="key" size={20} color="#f59e0b" />
            <Text style={styles.forgotPinLockoutText}>
              {getText('forgotPin')}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

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

  const renderBiometricPrompt = () => (
    <Animated.View style={[styles.biometricContainer, { opacity: fadeAnimation }]}>
      <View style={styles.biometricContent}>
        {/* CHANGED: Removed hexagon background, just the icon */}
        <Animated.View style={[
          styles.biometricIconSimple,
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
        
        {/* CHANGED: Manual button instead of auto-prompt */}
        <TouchableOpacity
          style={[styles.biometricButton, loading && styles.biometricButtonDisabled]}
          onPress={handleBiometricLogin}
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
        
        {/* CHANGED: Logout instead of Cancel */}
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

  // CHANGED: Always show PIN input screen (no more separate biometric screen)
  const renderPinInput = () => {
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

        {renderPinDots()}
        {renderNumberPad()}

        <View style={styles.optionsContainer}>
          {/* UX ENHANCEMENT: Prominent Forgot PIN button */}
          <TouchableOpacity
            style={styles.forgotPinButton}
            onPress={handleForgotPin}
          >
            <Ionicons name="key-outline" size={18} color="#98DDA6" />
            <Text style={styles.forgotPinText}>
              {getText('forgotPin')}
            </Text>
          </TouchableOpacity>

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
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#98DDA6" />
          </View>
        )}
      </Animated.View>
    );
  };

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
      <View style={styles.backgroundOverlay} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>
              Welcome back, {user?.firstName || user?.name || 'User'}!
            </Text>
          </View>

          {onCancel && (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>{getText('logout')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Show biometric screen OR PIN input based on state */}
        {showBiometricPrompt 
          ? renderBiometricPrompt() 
          : renderPinInput()
        }
      </View>

      {/* UX ENHANCEMENT: Forgot PIN Modal */}
      {renderForgotPinModal()}
    </SafeAreaView>
  );
};

// Enhanced styles with forgot PIN modal
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

  // Biometric styles
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
  // NEW: Simple biometric icon without background
  biometricIconSimple: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
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

  // PIN Input styles
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
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 20,
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

  // PIN Dots
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

  // Number Pad
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

  // Options styling
  optionsContainer: {
    alignItems: 'center',
    gap: 20,
    marginTop: 20,
  },
  forgotPinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(152, 221, 166, 0.15)',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(152, 221, 166, 0.4)',
    shadowColor: '#98DDA6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    gap: 8,
  },
  forgotPinText: {
    fontSize: 16,
    color: '#98DDA6',
    fontWeight: '600',
  },
  switchToBiometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(152, 221, 166, 0.1)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(152, 221, 166, 0.3)',
    gap: 6,
  },
  switchToBiometricText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#98DDA6',
  },

  // Lockout Screen styles
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
    backgroundColor: 'rgba(152, 221, 166, 0.15)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(152, 221, 166, 0.4)',
    gap: 8,
  },
  forgotPinLockoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f59e0b',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#05212a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  resetMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4b5563',
    gap: 16,
  },
  resetMethodButtonSelected: {
    backgroundColor: '#98DDA6',
    borderColor: '#98DDA6',
  },
  resetMethodText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  resetMethodTextSelected: {
    color: '#000000',
  },
  codeInput: {
    backgroundColor: '#374151',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 2,
    borderColor: '#4b5563',
    marginBottom: 30,
  },
  pinInputContainer: {
    marginBottom: 20,
  },
  pinInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  pinInputField: {
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 4,
    borderWidth: 2,
    borderColor: '#4b5563',
  },
  modalButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#98DDA6',
    shadowColor: '#98DDA6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalButtonSecondary: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalButtonGroup: {
    flexDirection: 'row',
    marginTop: 30,
  },
});

export default PinEntry;