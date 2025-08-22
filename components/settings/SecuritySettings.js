// src/components/settings/SecuritySettings.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SecurityService from '../../services/securityService';
import BiometricService from '../../services/biometricService';

const SecuritySettings = ({ language, user, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [pinSetup, setPinSetup] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricSetup, setBiometricSetup] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    loadSecurityStatus();
  }, []);

  const getText = (key) => {
    const texts = {
      en: {
        securitySettings: 'Security Settings',
        pinCode: 'PIN Code',
        pinCodeDesc: 'Secure your app with a 6-digit PIN',
        changePinCode: 'Change PIN Code',
        removePinCode: 'Remove PIN Code',
        biometricAuth: 'Biometric Authentication',
        biometricDesc: `Use ${biometricType} for quick access`,
        enableBiometric: `Enable ${biometricType}`,
        disableBiometric: `Disable ${biometricType}`,
        securityStatus: 'Security Status',
        failedAttempts: 'Failed Attempts',
        lastAttempt: 'Last Attempt',
        emergencyReset: 'Emergency Reset',
        emergencyResetDesc: 'Reset all security settings (Development only)',
        confirmChange: 'Confirm Change',
        confirmRemove: 'Confirm Removal',
        enterCurrentPin: 'Enter your current PIN to continue',
        enterNewPin: 'Enter your new PIN',
        confirmNewPin: 'Confirm your new PIN',
        pinChanged: 'PIN changed successfully',
        pinRemoved: 'PIN removed successfully',
        biometricEnabled: 'Biometric authentication enabled',
        biometricDisabled: 'Biometric authentication disabled',
        setupPin: 'Setup PIN',
        setupPinDesc: 'Setup a PIN to secure your account'
      },
      ru: {
        securitySettings: 'Настройки безопасности',
        pinCode: 'PIN-код',
        pinCodeDesc: 'Защитите приложение 6-значным PIN',
        changePinCode: 'Изменить PIN-код',
        removePinCode: 'Удалить PIN-код',
        biometricAuth: 'Биометрическая аутентификация',
        biometricDesc: `Используйте ${biometricType} для быстрого доступа`,
        enableBiometric: `Включить ${biometricType}`,
        disableBiometric: `Отключить ${biometricType}`,
        securityStatus: 'Статус безопасности',
        failedAttempts: 'Неудачные попытки',
        lastAttempt: 'Последняя попытка',
        emergencyReset: 'Экстренный сброс',
        emergencyResetDesc: 'Сбросить все настройки безопасности (Только для разработки)',
        confirmChange: 'Подтвердить изменение',
        confirmRemove: 'Подтвердить удаление',
        enterCurrentPin: 'Введите текущий PIN для продолжения',
        enterNewPin: 'Введите новый PIN',
        confirmNewPin: 'Подтвердите новый PIN',
        pinChanged: 'PIN успешно изменен',
        pinRemoved: 'PIN успешно удален',
        biometricEnabled: 'Биометрическая аутентификация включена',
        biometricDisabled: 'Биометрическая аутентификация отключена',
        setupPin: 'Настроить PIN',
        setupPinDesc: 'Настройте PIN для защиты аккаунта'
      },
      ky: {
        securitySettings: 'Коопсуздук жөндөөлөрү',
        pinCode: 'PIN коду',
        pinCodeDesc: '6 сандуу PIN менен колдонмону коргоңуз',
        changePinCode: 'PIN кодун өзгөртүү',
        removePinCode: 'PIN кодун алып салуу',
        biometricAuth: 'Биометрикалык аутентификация',
        biometricDesc: `Тез кирүү үчүн ${biometricType} колдонуңуз`,
        enableBiometric: `${biometricType} иштетүү`,
        disableBiometric: `${biometricType} өчүрүү`,
        securityStatus: 'Коопсуздук абалы',
        failedAttempts: 'Ийгиликсиз аракеттер',
        lastAttempt: 'Акыркы аракет',
        emergencyReset: 'Шашылыш калыбына келтирүү',
        emergencyResetDesc: 'Бардык коопсуздук жөндөөлөрүн калыбына келтирүү (Өнүктүрүү үчүн гана)',
        confirmChange: 'Өзгөртүүнү ырастоо',
        confirmRemove: 'Алып салууну ырастоо',
        enterCurrentPin: 'Улантуу үчүн учурдагы PIN киргизиңиз',
        enterNewPin: 'Жаңы PIN киргизиңиз',
        confirmNewPin: 'Жаңы PIN ырастаңыз',
        pinChanged: 'PIN ийгиликтүү өзгөртүлдү',
        pinRemoved: 'PIN ийгиликтүү алынып салынды',
        biometricEnabled: 'Биометрикалык аутентификация иштетилди',
        biometricDisabled: 'Биометрикалык аутентификация өчүрүлдү',
        setupPin: 'PIN жөндөө',
        setupPinDesc: 'Аккаунтуңузду коргоо үчүн PIN жөндөңүз'
      }
    };
    return texts[language]?.[key] || texts.en[key] || key;
  };

  const loadSecurityStatus = async () => {
    try {
      setLoading(true);
      
      // Get security status
      const securityStatus = await SecurityService.getSecurityStatus();
      setPinSetup(securityStatus.pinSetup);
      setFailedAttempts(securityStatus.failedAttempts);
      
      // Get biometric status
      const biometricInfo = await BiometricService.getBiometricInfo();
      setBiometricAvailable(biometricInfo.available);
      setBiometricSetup(biometricInfo.isSetup);
      setBiometricType(biometricInfo.typeName || 'Biometric');
      
    } catch (error) {
      console.error('Load security status error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPin = () => {
    // Navigate to PIN setup
    Alert.alert('Setup PIN', 'PIN setup will be implemented here');
  };

  const handleChangePin = () => {
    Alert.prompt(
      getText('enterCurrentPin'),
      '',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: (currentPin) => {
            if (currentPin && currentPin.length === 6) {
              promptNewPin(currentPin);
            } else {
              Alert.alert('Error', 'Please enter a valid 6-digit PIN');
            }
          }
        }
      ],
      'secure-text'
    );
  };

  const promptNewPin = (currentPin) => {
    Alert.prompt(
      getText('enterNewPin'),
      '',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: (newPin) => {
            if (newPin && newPin.length === 6) {
              confirmNewPin(currentPin, newPin);
            } else {
              Alert.alert('Error', 'Please enter a valid 6-digit PIN');
            }
          }
        }
      ],
      'secure-text'
    );
  };

  const confirmNewPin = (currentPin, newPin) => {
    Alert.prompt(
      getText('confirmNewPin'),
      '',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: async (confirmPin) => {
            if (confirmPin === newPin) {
              await changePin(currentPin, newPin);
            } else {
              Alert.alert('Error', 'PINs do not match');
            }
          }
        }
      ],
      'secure-text'
    );
  };

  const changePin = async (currentPin, newPin) => {
    try {
      setLoading(true);
      
      const result = await SecurityService.changePin(currentPin, newPin, user.id);
      
      if (result.success) {
        Alert.alert('Success', getText('pinChanged'));
        await loadSecurityStatus();
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Change PIN error:', error);
      Alert.alert('Error', 'Failed to change PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePin = () => {
    Alert.alert(
      getText('confirmRemove'),
      'Are you sure you want to remove your PIN? This will make your account less secure.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              getText('enterCurrentPin'),
              '',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: removePin
                }
              ],
              'secure-text'
            );
          }
        }
      ]
    );
  };

  const removePin = async (pin) => {
    try {
      setLoading(true);
      
      const result = await SecurityService.removePin(pin);
      
      if (result.success) {
        Alert.alert('Success', getText('pinRemoved'));
        await loadSecurityStatus();
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Remove PIN error:', error);
      Alert.alert('Error', 'Failed to remove PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricToggle = async (enabled) => {
    try {
      setLoading(true);
      
      if (enabled) {
        const result = await BiometricService.setupBiometric(user.id);
        if (result.success) {
          setBiometricSetup(true);
          Alert.alert('Success', getText('biometricEnabled'));
        } else if (!result.cancelled) {
          Alert.alert('Error', result.error || 'Failed to enable biometric authentication');
        }
      } else {
        const result = await BiometricService.disableBiometric();
        if (result) {
          setBiometricSetup(false);
          Alert.alert('Success', getText('biometricDisabled'));
        } else {
          Alert.alert('Error', 'Failed to disable biometric authentication');
        }
      }
    } catch (error) {
      console.error('Biometric toggle error:', error);
      Alert.alert('Error', 'Failed to change biometric setting');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyReset = () => {
    Alert.alert(
      getText('emergencyReset'),
      'This will reset ALL security settings. Only use in development!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecurityService.emergencyReset();
              await BiometricService.disableBiometric();
              Alert.alert('Success', 'Security settings reset');
              await loadSecurityStatus();
            } catch (error) {
              Alert.alert('Error', 'Failed to reset security settings');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#05212a" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getText('securitySettings')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* PIN Code Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed" size={24} color="#98DDA6" />
            <Text style={styles.sectionTitle}>{getText('pinCode')}</Text>
          </View>
          
          <Text style={styles.sectionDescription}>
            {getText('pinCodeDesc')}
          </Text>

          {pinSetup ? (
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.option}
                onPress={handleChangePin}
                disabled={loading}
              >
                <Text style={styles.optionText}>{getText('changePinCode')}</Text>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.option, styles.dangerOption]}
                onPress={handleRemovePin}
                disabled={loading}
              >
                <Text style={[styles.optionText, styles.dangerText]}>
                  {getText('removePinCode')}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.setupButton}
              onPress={handleSetupPin}
              disabled={loading}
            >
              <Text style={styles.setupButtonText}>{getText('setupPin')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Biometric Authentication Section */}
        {biometricAvailable && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons 
                name={biometricType === 'Face ID' ? 'scan' : 'finger-print'} 
                size={24} 
                color="#98DDA6" 
              />
              <Text style={styles.sectionTitle}>{getText('biometricAuth')}</Text>
            </View>
            
            <Text style={styles.sectionDescription}>
              {getText('biometricDesc')}
            </Text>

            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>
                {biometricSetup ? getText('disableBiometric') : getText('enableBiometric')}
              </Text>
              <Switch
                value={biometricSetup}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: '#374151', true: '#98DDA6' }}
                thumbColor={biometricSetup ? '#ffffff' : '#9ca3af'}
                disabled={loading || !pinSetup}
              />
            </View>
            
            {!pinSetup && (
              <Text style={styles.requirementText}>
                PIN setup required to enable biometric authentication
              </Text>
            )}
          </View>
        )}

        {/* Security Status Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#98DDA6" />
            <Text style={styles.sectionTitle}>{getText('securityStatus')}</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>PIN Setup</Text>
              <Text style={[styles.statusValue, pinSetup && styles.statusValueActive]}>
                {pinSetup ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Biometric Auth</Text>
              <Text style={[styles.statusValue, biometricSetup && styles.statusValueActive]}>
                {biometricSetup ?