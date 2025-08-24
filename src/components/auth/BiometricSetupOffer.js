// src/components/auth/BiometricSetupOffer.js - Offer Biometric Setup After PIN
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BiometricService from '../../services/biometricService';

const BiometricSetupOffer = ({ 
  visible, 
  onComplete, 
  onSkip, 
  user, 
  language = 'en' 
}) => {
  const [loading, setLoading] = useState(false);
  const [biometricInfo, setBiometricInfo] = useState(null);

  useEffect(() => {
    if (visible) {
      checkBiometricAvailability();
    }
  }, [visible]);

  const getText = (key) => {
    const texts = {
      en: {
        setupBiometric: 'Setup Biometric Authentication',
        biometricBenefits: 'Quick and secure access to your account',
        setupBiometricDesc: 'Use biometric authentication for faster, more secure sign-ins.',
        enableBiometric: 'Enable Biometric',
        skipForNow: 'Skip for now',
        setupSuccess: 'Biometric Setup Complete!',
        setupSuccessDesc: 'You can now use biometric authentication to sign in quickly.',
        setupFailed: 'Setup Failed',
        notAvailable: 'Biometric Not Available',
        notAvailableDesc: 'Biometric authentication is not available on this device.',
        notEnrolled: 'No Biometric Data Found',
        notEnrolledDesc: 'Please set up biometric authentication in your device settings first.',
        continue: 'Continue',
        tryAgain: 'Try Again'
      },
      ru: {
        setupBiometric: 'Настройка биометрической аутентификации',
        biometricBenefits: 'Быстрый и безопасный доступ к аккаунту',
        setupBiometricDesc: 'Используйте биометрическую аутентификацию для быстрого и безопасного входа.',
        enableBiometric: 'Включить биометрию',
        skipForNow: 'Пропустить пока',
        setupSuccess: 'Биометрия настроена!',
        setupSuccessDesc: 'Теперь вы можете использовать биометрическую аутентификацию для быстрого входа.',
        setupFailed: 'Ошибка настройки',
        notAvailable: 'Биометрия недоступна',
        notAvailableDesc: 'Биометрическая аутентификация недоступна на этом устройстве.',
        notEnrolled: 'Биометрические данные не найдены',
        notEnrolledDesc: 'Сначала настройте биометрическую аутентификацию в настройках устройства.',
        continue: 'Продолжить',
        tryAgain: 'Попробовать снова'
      },
      ky: {
        setupBiometric: 'Биометрикалык аутентификацияны жөндөө',
        biometricBenefits: 'Аккаунтуңузга тез жана коопсуз кирүү',
        setupBiometricDesc: 'Тез жана коопсуз кирүү үчүн биометрикалык аутентификацияны колдонуңуз.',
        enableBiometric: 'Биометрияны иштетүү',
        skipForNow: 'Азырынча өткөрүү',
        setupSuccess: 'Биометрия жөндөлдү!',
        setupSuccessDesc: 'Эми тез кирүү үчүн биометрикалык аутентификацияны колдоно аласыз.',
        setupFailed: 'Жөндөө катасы',
        notAvailable: 'Биометрия жетүүсүз',
        notAvailableDesc: 'Бул түзмөктө биометрикалык аутентификация жетүүсүз.',
        notEnrolled: 'Биометрикалык маалыматтар табылган жок',
        notEnrolledDesc: 'Адегенде түзмөктүн жөндөөлөрүнөн биометрикалык аутентификацияны жөндөңүз.',
        continue: 'Улантуу',
        tryAgain: 'Кайра аракет кылуу'
      }
    };
    return texts[language]?.[key] || texts.en[key] || key;
  };

  const checkBiometricAvailability = async () => {
    try {
      const info = await BiometricService.getBiometricInfo();
      setBiometricInfo(info);
      console.log('🔐 Biometric availability check:', info);
    } catch (error) {
      console.error('❌ Biometric check error:', error);
    }
  };

  const handleSetupBiometric = async () => {
    try {
      setLoading(true);
      console.log('🔐 Starting biometric setup for user:', user?.id);
      
      const result = await BiometricService.setupBiometric(user?.id);
      console.log('🔐 Biometric setup result:', result);

      if (result.success) {
        Alert.alert(
          getText('setupSuccess'),
          getText('setupSuccessDesc'),
          [
            {
              text: getText('continue'),
              onPress: () => onComplete(true) // true = biometric enabled
            }
          ]
        );
      } else {
        Alert.alert(
          getText('setupFailed'),
          result.error || 'Failed to setup biometric authentication',
          [
            {
              text: getText('tryAgain'),
              onPress: handleSetupBiometric
            },
            {
              text: getText('skipForNow'),
              onPress: () => onComplete(false) // false = biometric skipped
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Biometric setup error:', error);
      Alert.alert(
        getText('setupFailed'),
        error.message || 'Failed to setup biometric authentication',
        [
          {
            text: getText('tryAgain'),
            onPress: handleSetupBiometric
          },
          {
            text: getText('skipForNow'),
            onPress: () => onComplete(false)
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  // Don't show if biometric is not available
  if (!biometricInfo?.available) {
    // Auto-skip if biometric is not available
    if (visible && biometricInfo !== null) {
      console.log('🔐 Biometric not available, auto-skipping setup');
      setTimeout(() => onComplete(false), 100);
    }
    return null;
  }

  const getBiometricIcon = () => {
    switch (biometricInfo?.typeName) {
      case 'Face ID':
        return 'scan';
      case 'Fingerprint':
        return 'finger-print';
      case 'Iris':
        return 'eye';
      default:
        return 'shield-checkmark';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleSkip}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#05212a" />
        
        <View style={styles.content}>
          {/* Skip Button */}
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>{getText('skipForNow')}</Text>
          </TouchableOpacity>

          {/* Main Content */}
          <View style={styles.mainContent}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons
                name={getBiometricIcon()}
                size={80}
                color="#98DDA6"
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>
              {getText('setupBiometric')}
            </Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              {getText('setupBiometricDesc')}
            </Text>

            {/* Benefits List */}
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons name="flash" size={24} color="#98DDA6" />
                <Text style={styles.benefitText}>
                  {language === 'ru' ? 'Мгновенный вход' : 
                   language === 'ky' ? 'Заматта кирүү' : 
                   'Instant sign-in'}
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <Ionicons name="shield-checkmark" size={24} color="#98DDA6" />
                <Text style={styles.benefitText}>
                  {language === 'ru' ? 'Максимальная безопасность' : 
                   language === 'ky' ? 'Максималдуу коопсуздук' : 
                   'Enhanced security'}
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <Ionicons name="heart" size={24} color="#98DDA6" />
                <Text style={styles.benefitText}>
                  {language === 'ru' ? 'Удобство использования' : 
                   language === 'ky' ? 'Колдонуу ыңгайлуулугу' : 
                   'Easy to use'}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.enableButton, loading && styles.buttonDisabled]}
              onPress={handleSetupBiometric}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <Ionicons name={getBiometricIcon()} size={20} color="#000000" />
                  <Text style={styles.enableButtonText}>
                    {getText('enableBiometric')}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipLaterButton}
              onPress={handleSkip}
              disabled={loading}
            >
              <Text style={styles.skipLaterText}>
                {getText('skipForNow')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Text */}
          <Text style={styles.infoText}>
            {language === 'ru' ? 'Вы можете изменить это позже в настройках безопасности' : 
             language === 'ky' ? 'Муну кийинчерээк коопсуздук жөндөөлөрүнөн өзгөртө аласыз' : 
             'You can change this later in Security Settings'}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
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
    paddingVertical: 20,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  skipText: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  benefitsList: {
    alignSelf: 'stretch',
    maxWidth: 300,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  benefitText: {
    fontSize: 16,
    color: '#d1d5db',
    marginLeft: 16,
    fontWeight: '500',
  },
  actionButtons: {
    paddingBottom: 20,
  },
  enableButton: {
    backgroundColor: '#98DDA6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#98DDA6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  enableButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  skipLaterButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4b5563',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipLaterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 16,
  },
});

export default BiometricSetupOffer;