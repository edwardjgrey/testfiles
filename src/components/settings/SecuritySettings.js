// src/components/settings/SecuritySettings.js - COMPLETE VERSION
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
  ActivityIndicator,
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
  const [lastAttemptTime, setLastAttemptTime] = useState(null);
  const [isLockedOut, setIsLockedOut] = useState(false);

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
        setupPinDesc: 'Setup a PIN to secure your account',
        securityTips: 'Security Tips',
        tipSecurePin: 'Use a PIN that\'s not easily guessable',
        tipBiometric: 'Enable biometric authentication for convenience',
        tipRegularUpdate: 'Update your PIN regularly',
        accountSecurity: 'Account Security',
        deviceSecurity: 'Device Security',
        enabled: 'Enabled',
        disabled: 'Disabled',
        never: 'Never',
        lockoutWarning: 'Your account is currently locked due to too many failed attempts',
        securityScore: 'Security Score'
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
        setupPinDesc: 'Настройте PIN для защиты аккаунта',
        securityTips: 'Советы по безопасности',
        tipSecurePin: 'Используйте PIN, который нелегко угадать',
        tipBiometric: 'Включите биометрическую аутентификацию для удобства',
        tipRegularUpdate: 'Регулярно обновляйте свой PIN',
        accountSecurity: 'Безопасность аккаунта',
        deviceSecurity: 'Безопасность устройства',
        enabled: 'Включено',
        disabled: 'Отключено',
        never: 'Никогда',
        lockoutWarning: 'Ваш аккаунт заблокирован из-за слишком многих неудачных попыток',
        securityScore: 'Оценка безопасности'
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
        setupPinDesc: 'Аккаунтуңузду коргоо үчүн PIN жөндөңүз',
        securityTips: 'Коопсуздук кеңештери',
        tipSecurePin: 'Оңой таанылбаган PIN колдонуңуз',
        tipBiometric: 'Ыңгайлуулук үчүн биометрикалык аутентификацияны иштетиңиз',
        tipRegularUpdate: 'PIN кодуңузду үзгүлтүксүз жаңыртып туруңуз',
        accountSecurity: 'Аккаунт коопсуздугу',
        deviceSecurity: 'Түзмөк коопсуздугу',
        enabled: 'Иштетилген',
        disabled: 'Өчүрүлгөн',
        never: 'Эч качан',
        lockoutWarning: 'Аккаунтуңуз көп жолу туура эмес аракет себеби менен бөгөттөлдү',
        securityScore: 'Коопсуздук баасы'
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
      setIsLockedOut(securityStatus.isLockedOut);
      
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

  // Calculate security score
  const getSecurityScore = () => {
    let score = 0;
    let maxScore = 100;
    
    if (pinSetup) score += 60;
    if (biometricSetup) score += 40;
    
    return Math.round((score / maxScore) * 100);
  };

  const getSecurityScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getSecurityScoreText = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#05212a" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#98DDA6" />
          <Text style={styles.loadingText}>Loading security settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const securityScore = getSecurityScore();

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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Security Score */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#98DDA6" />
            <Text style={styles.sectionTitle}>{getText('securityScore')}</Text>
          </View>
          
          <View style={styles.scoreCard}>
            <View style={styles.scoreCircle}>
              <Text style={[styles.scoreNumber, { color: getSecurityScoreColor(securityScore) }]}>
                {securityScore}
              </Text>
              <Text style={styles.scoreLabel}>%</Text>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={[styles.scoreStatus, { color: getSecurityScoreColor(securityScore) }]}>
                {getSecurityScoreText(securityScore)}
              </Text>
              <Text style={styles.scoreDescription}>
                {securityScore >= 80 ? 'Your account is well protected' :
                 securityScore >= 60 ? 'Your account has good security' :
                 securityScore >= 40 ? 'Your account needs better security' :
                 'Your account is at risk'}
              </Text>
            </View>
          </View>
        </View>

        {/* Lockout Warning */}
        {isLockedOut && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={24} color="#f59e0b" />
            <Text style={styles.warningText}>
              {getText('lockoutWarning')}
            </Text>
          </View>
        )}

        {/* PIN Code Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed" size={24} color="#98DDA6" />
            <Text style={styles.sectionTitle}>{getText('pinCode')}</Text>
            <View style={[styles.statusBadge, pinSetup ? styles.enabledBadge : styles.disabledBadge]}>
              <Text style={[styles.statusBadgeText, pinSetup ? styles.enabledText : styles.disabledText]}>
                {pinSetup ? getText('enabled') : getText('disabled')}
              </Text>
            </View>
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
                <Ionicons name="create-outline" size={20} color="#ffffff" />
                <Text style={styles.optionText}>{getText('changePinCode')}</Text>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.option, styles.dangerOption]}
                onPress={handleRemovePin}
                disabled={loading}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
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
              <Ionicons name="add-circle" size={20} color="#000000" />
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
              <View style={[styles.statusBadge, biometricSetup ? styles.enabledBadge : styles.disabledBadge]}>
                <Text style={[styles.statusBadgeText, biometricSetup ? styles.enabledText : styles.disabledText]}>
                  {biometricSetup ? getText('enabled') : getText('disabled')}
                </Text>
              </View>
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
            <Ionicons name="information-circle" size={24} color="#98DDA6" />
            <Text style={styles.sectionTitle}>{getText('securityStatus')}</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>PIN Setup</Text>
              <Text style={[styles.statusValue, pinSetup && styles.statusValueActive]}>
                {pinSetup ? getText('enabled') : getText('disabled')}
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Biometric Auth</Text>
              <Text style={[styles.statusValue, biometricSetup && styles.statusValueActive]}>
                {biometricSetup ? getText('enabled') : getText('disabled')}
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>{getText('failedAttempts')}</Text>
              <Text style={[styles.statusValue, failedAttempts > 0 && styles.statusValueWarning]}>
                {failedAttempts}/5
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>{getText('lastAttempt')}</Text>
              <Text style={styles.statusValue}>
                {lastAttemptTime ? new Date(lastAttemptTime).toLocaleString() : getText('never')}
              </Text>
            </View>
          </View>
        </View>

        {/* Security Tips Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={24} color="#98DDA6" />
            <Text style={styles.sectionTitle}>{getText('securityTips')}</Text>
          </View>
          
          <View style={styles.tipsContainer}>
            <View style={styles.tip}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.tipText}>{getText('tipSecurePin')}</Text>
            </View>
            
            <View style={styles.tip}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.tipText}>{getText('tipBiometric')}</Text>
            </View>
            
            <View style={styles.tip}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.tipText}>{getText('tipRegularUpdate')}</Text>
            </View>
          </View>
        </View>

        {/* Emergency Reset (Development Only) */}
        {__DEV__ && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="nuclear" size={24} color="#ef4444" />
              <Text style={styles.sectionTitle}>{getText('emergencyReset')}</Text>
            </View>
            
            <Text style={styles.sectionDescription}>
              {getText('emergencyResetDesc')}
            </Text>
            
            <TouchableOpacity
              style={[styles.setupButton, styles.emergencyButton]}
              onPress={handleEmergencyReset}
              disabled={loading}
            >
              <Ionicons name="trash" size={20} color="#ffffff" />
              <Text style={[styles.setupButtonText, styles.emergencyButtonText]}>
                {getText('emergencyReset')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05212a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 16,
    fontSize: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 12,
    flex: 1,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  enabledBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  disabledBadge: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  enabledText: {
    color: '#10b981',
  },
  disabledText: {
    color: '#6b7280',
  },
  
  // Score Card
  scoreCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: -4,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreStatus: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },

  // Warning Card
  warningCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#f59e0b',
    marginLeft: 12,
    fontWeight: '500',
  },

  // Options Container
  optionsContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  dangerOption: {
    borderBottomWidth: 0,
  },
  optionText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 12,
    flex: 1,
  },
  dangerText: {
    color: '#ef4444',
  },

  // Setup Button
  setupButton: {
    backgroundColor: '#98DDA6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  setupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  emergencyButton: {
    backgroundColor: '#ef4444',
  },
  emergencyButtonText: {
    color: '#ffffff',
  },

  // Toggle Container
  toggleContainer: {
    backgroundColor: '#1f2937',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  requirementText: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Status Container
  statusContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  statusLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  statusValueActive: {
    color: '#10b981',
  },
  statusValueWarning: {
    color: '#f59e0b',
  },

  // Tips Container
  tipsContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#d1d5db',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },

  bottomPadding: {
    height: 50,
  },
});