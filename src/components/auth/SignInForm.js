// src/components/auth/SignInForm.js - FIXED with consistent styling
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../../styles/globalStyles';
import { translations } from '../../utils/translations';
import LanguageSelector from '../common/LanguageSelector';
import KeyboardAwareWrapper from '../common/KeyboardAwareWrapper';
import ApiService from '../../services/apiService';
import BiometricService from '../../services/biometricService';

const { width } = Dimensions.get('window');

const SignInForm = ({ language, setLanguage, navigateAuth, completeAuth, authData, handleEmailSignIn, handlePhoneSignIn }) => {
  const t = translations[language];
  const [signInMethod, setSignInMethod] = useState('email');
  const [email, setEmail] = useState(authData?.email || '');
  const [phone, setPhone] = useState(authData?.phone || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricSetup, setBiometricSetup] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  
  // Password Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetStep, setResetStep] = useState(1);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    checkBiometricStatus();
    
    // Set appropriate sign-in method based on what data we have
    if (authData?.email) {
      setSignInMethod('email');
    } else if (authData?.phone) {
      setSignInMethod('phone');
    }
  }, [authData]);

  const checkBiometricStatus = async () => {
    try {
      const biometricInfo = await BiometricService.getBiometricInfo();
      setBiometricAvailable(biometricInfo.available);
      setBiometricSetup(biometricInfo.isSetup);
      setBiometricType(biometricInfo.typeName || '');
    } catch (error) {
      // Biometric check failed - continue without it
    }
  };

  const handleSignIn = async () => {
    try {
      setLoading(true);
      
      if (signInMethod === 'email') {
        if (!email || !password) {
          Alert.alert('Error', 'Please enter both email and password');
          return;
        }

        if (handleEmailSignIn) {
          await handleEmailSignIn(email, password);
        } else {
          const result = await ApiService.signInWithEmail(email, password);
          
          if (result.success) {
            if (biometricAvailable && !biometricSetup) {
              setTimeout(() => offerBiometricSetup(result.user), 1000);
            }
            completeAuth(result.user);
          } else {
            Alert.alert('Sign In Failed', result.error);
          }
        }
      } else {
        if (!phone) {
          Alert.alert('Error', 'Please enter your phone number');
          return;
        }
        
        // Clean phone number before processing
        const cleanPhone = phone.replace(/\s/g, '');
        
        if (handlePhoneSignIn) {
          await handlePhoneSignIn(cleanPhone);
        } else {
          const result = await ApiService.requestPhoneSignIn(cleanPhone, '+996');
          
          if (result.success) {
            navigateAuth('verify', { phone: cleanPhone, isSignIn: true });
          } else {
            Alert.alert('Error', result.error);
          }
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricSignIn = async () => {
    try {
      setLoading(true);
      const result = await BiometricService.authenticateWithBiometric();
      
      if (result.success) {
        const authResult = await ApiService.signInWithBiometric(result.biometricToken);
        
        if (authResult.success) {
          completeAuth(authResult.user);
        } else {
          Alert.alert('Authentication Failed', authResult.error);
        }
      } else {
        Alert.alert('Biometric Authentication Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const offerBiometricSetup = (user) => {
    Alert.alert(
      `Enable ${biometricType}?`,
      `Use ${biometricType} to quickly and securely sign in to your account?`,
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Enable',
          onPress: async () => {
            try {
              const setupResult = await BiometricService.setupBiometric(user.id);
              if (setupResult.success) {
                await ApiService.setupBiometric(setupResult.biometricToken);
                Alert.alert('Success', `${biometricType} has been enabled for your account.`);
              }
            } catch (error) {
              // Biometric setup failed - continue without it
            }
          }
        }
      ]
    );
  };

  const handleForgotPassword = () => {
    setResetEmail(email);
    setShowResetModal(true);
    setResetStep(1);
  };

  const sendResetCode = async () => {
    if (!resetEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setResetLoading(true);
      const result = await ApiService.forgotPassword(resetEmail);
      
      if (result.success) {
        setResetStep(2);
        Alert.alert('Success', 'Password reset code sent to your email');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset code. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const verifyResetCode = () => {
    if (!resetCode) {
      Alert.alert('Error', 'Please enter the reset code');
      return;
    }
    setResetStep(3);
  };

  const resetPassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    try {
      setResetLoading(true);
      const result = await ApiService.resetPassword(resetEmail, resetCode, newPassword);
      
      if (result.success) {
        setShowResetModal(false);
        setResetStep(1);
        setResetEmail('');
        setResetCode('');
        setNewPassword('');
        setConfirmNewPassword('');
        Alert.alert('Success', 'Password reset successfully. You can now sign in with your new password.');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetStep(1);
    setResetEmail('');
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  // Handle opening external links
  const openTerms = () => {
    const termsUrl = 'https://akchabar.com/terms';
    Linking.openURL(termsUrl).catch(err => 
      Alert.alert('Error', 'Could not open Terms of Service')
    );
  };

  const openPrivacy = () => {
    const privacyUrl = 'https://akchabar.com/privacy';
    Linking.openURL(privacyUrl).catch(err => 
      Alert.alert('Error', 'Could not open Privacy Policy')
    );
  };

  const renderResetModal = () => (
    <Modal
      visible={showResetModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeResetModal}
    >
      <SafeAreaView style={[globalStyles.authContainer, { padding: 20 }]}>
        <StatusBar barStyle="light-content" />
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30 }}>
          <TouchableOpacity onPress={closeResetModal} style={{ marginRight: 15 }}>
            <Ionicons name="close" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={[globalStyles.authTitleLeft, { flex: 1 }]}>
            {language === 'ru' ? 'Сброс пароля' : 
             language === 'ky' ? 'Сыр сөздү калыбына келтирүү' : 
             'Reset Password'}
          </Text>
        </View>

        {resetStep === 1 && (
          <View>
            <Text style={[globalStyles.authSubtitleLeft, { marginBottom: 20 }]}>
              {language === 'ru' ? 'Введите ваш email для получения кода сброса' : 
               language === 'ky' ? 'Калыбына келтирүү кодун алуу үчүн emailиңизди киргизиңиз' : 
               'Enter your email to receive a reset code'}
            </Text>
            
            <View style={globalStyles.formGroup}>
              <Text style={globalStyles.formLabel}>Email</Text>
              <TextInput
                style={globalStyles.formInput}
                value={resetEmail}
                onChangeText={setResetEmail}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[globalStyles.pill, globalStyles.pillPrimary, resetLoading && globalStyles.pillDisabled]}
              onPress={sendResetCode}
              disabled={resetLoading}
            >
              {resetLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={globalStyles.pillTextPrimary}>
                  {language === 'ru' ? 'Отправить код' : 
                   language === 'ky' ? 'Кодду жөнөтүү' : 
                   'Send Code'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {resetStep === 2 && (
          <View>
            <Text style={[globalStyles.authSubtitleLeft, { marginBottom: 20 }]}>
              {language === 'ru' ? `Введите код, отправленный на ${resetEmail}` : 
               language === 'ky' ? `${resetEmail} дарегине жөнөтүлгөн кодду киргизиңиз` : 
               `Enter the code sent to ${resetEmail}`}
            </Text>
            
            <View style={globalStyles.formGroup}>
              <Text style={globalStyles.formLabel}>
                {language === 'ru' ? 'Код сброса' : 
                 language === 'ky' ? 'Калыбына келтирүү коду' : 
                 'Reset Code'}
              </Text>
              <TextInput
                style={globalStyles.formInput}
                value={resetCode}
                onChangeText={setResetCode}
                placeholder="12345678"
                keyboardType="number-pad"
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[globalStyles.pill, globalStyles.pillPrimary]}
              onPress={verifyResetCode}
            >
              <Text style={globalStyles.pillTextPrimary}>
                {language === 'ru' ? 'Продолжить' : 
                 language === 'ky' ? 'Улантуу' : 
                 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {resetStep === 3 && (
          <View>
            <Text style={[globalStyles.authSubtitleLeft, { marginBottom: 20 }]}>
              {language === 'ru' ? 'Создайте новый пароль' : 
               language === 'ky' ? 'Жаңы сыр сөз түзүңүз' : 
               'Create a new password'}
            </Text>
            
            <View style={globalStyles.formGroup}>
              <Text style={globalStyles.formLabel}>
                {language === 'ru' ? 'Новый пароль' : 
                 language === 'ky' ? 'Жаңы сыр сөз' : 
                 'New Password'}
              </Text>
              <TextInput
                style={globalStyles.formInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="••••••••"
                secureTextEntry
                autoFocus
              />
            </View>

            <View style={globalStyles.formGroup}>
              <Text style={globalStyles.formLabel}>
                {language === 'ru' ? 'Подтвердите пароль' : 
                 language === 'ky' ? 'Сыр сөздү ырастаңыз' : 
                 'Confirm Password'}
              </Text>
              <TextInput
                style={globalStyles.formInput}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                placeholder="••••••••"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[globalStyles.pill, globalStyles.pillPrimary, resetLoading && globalStyles.pillDisabled]}
              onPress={resetPassword}
              disabled={resetLoading}
            >
              {resetLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={globalStyles.pillTextPrimary}>
                  {language === 'ru' ? 'Сбросить пароль' : 
                   language === 'ky' ? 'Сыр сөздү калыбына келтирүү' : 
                   'Reset Password'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={globalStyles.authContainer}>
      <StatusBar barStyle="light-content" backgroundColor={globalStyles.authContainer.backgroundColor} />
      <LanguageSelector language={language} setLanguage={setLanguage} />
      
      <KeyboardAwareWrapper
        contentContainerStyle={[
          globalStyles.scrollContent, 
          { 
            paddingHorizontal: width * 0.05,
            paddingTop: 80
          }
        ]}
        extraScrollHeight={50}
      >
        {/* FIXED: Consistent back button to match other auth screens */}
        <TouchableOpacity
          style={globalStyles.backButton}
          onPress={() => navigateAuth('welcome')}
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        
        {/* FIXED: Consistent title styling */}
        <Text style={[globalStyles.authTitleLeft, { color: '#0f172a' }]}>
          {t.signIn}
        </Text>
        <Text style={[globalStyles.authSubtitleLeft, { color: '#6b7280' }]}>
          {t.welcomeBackSub}
        </Text>

        {/* Biometric Sign In Button (if available and setup) */}
        {biometricAvailable && biometricSetup && (
          <TouchableOpacity
            style={[globalStyles.pill, globalStyles.pillPrimary, { marginBottom: 20 }]}
            onPress={handleBiometricSignIn}
            disabled={loading}
          >
            <Ionicons 
              name={biometricType === 'Face ID' ? 'scan' : 'finger-print'} 
              size={18} 
              color="#05212a" 
            />
            <Text style={[globalStyles.pillTextPrimary, { marginLeft: 8 }]}>
              {language === 'ru' ? `Войти с ${biometricType}` : 
               language === 'ky' ? `${biometricType} менен кирүү` : 
               `Sign in with ${biometricType}`}
            </Text>
          </TouchableOpacity>
        )}
        
        <View style={[globalStyles.authCard, { maxWidth: width * 0.9, alignSelf: 'center' }]}>
          {/* Sign-in method toggle */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#f3f4f6',
            borderRadius: 12,
            padding: 4,
            marginBottom: 20,
          }}>
            <TouchableOpacity
              style={[
                {
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                },
                signInMethod === 'email' && { 
                  backgroundColor: '#98DDA6', 
                  shadowColor: '#000', 
                  shadowOffset: { width: 0, height: 1 }, 
                  shadowOpacity: 0.1, 
                  shadowRadius: 2, 
                  elevation: 2 
                }
              ]}
              onPress={() => setSignInMethod('email')}
            >
              <Text style={{ 
                fontWeight: signInMethod === 'email' ? '600' : '400',
                color: signInMethod === 'email' ? '#05212a' : '#0f172a'
              }}>
                Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                {
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                },
                signInMethod === 'phone' && { 
                  backgroundColor: '#98DDA6', 
                  shadowColor: '#000', 
                  shadowOffset: { width: 0, height: 1 }, 
                  shadowOpacity: 0.1, 
                  shadowRadius: 2, 
                  elevation: 2 
                }
              ]}
              onPress={() => setSignInMethod('phone')}
            >
              <Text style={{ 
                fontWeight: signInMethod === 'phone' ? '600' : '400',
                color: signInMethod === 'phone' ? '#05212a' : '#0f172a'
              }}>
                SMS
              </Text>
            </TouchableOpacity>
          </View>

          {signInMethod === 'email' ? (
            <>
              <View style={globalStyles.formGroup}>
                <Text style={[globalStyles.formLabel, { color: '#6b7280' }]}>
                  {t.email}
                </Text>
                <TextInput
                  style={[globalStyles.formInput, { 
                    backgroundColor: '#ffffff',
                    borderColor: '#d1d5db',
                    color: '#0f172a'
                  }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus={!authData?.email}
                  returnKeyType="next"
                />
              </View>

              <View style={globalStyles.formGroup}>
                <Text style={[globalStyles.formLabel, { color: '#6b7280' }]}>
                  {t.password}
                </Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={[globalStyles.formInput, { 
                      paddingRight: 50,
                      backgroundColor: '#ffffff',
                      borderColor: '#d1d5db',
                      color: '#0f172a'
                    }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleSignIn}
                    autoFocus={!!authData?.email}
                  />
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: 14,
                    }}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? 'eye-off' : 'eye'} 
                      size={18} 
                      color="#6b7280" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={{ alignSelf: 'flex-end', marginBottom: 16 }}
                onPress={handleForgotPassword}
              >
                <Text style={[globalStyles.linkText, { fontSize: 14, color: '#98DDA6' }]}>
                  {t.forgotPassword}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={globalStyles.formGroup}>
              <Text style={[globalStyles.formLabel, { color: '#6b7280' }]}>
                {t.phoneNumber}
              </Text>
              <TextInput
                style={[globalStyles.formInput, { 
                  backgroundColor: '#ffffff',
                  borderColor: '#d1d5db',
                  color: '#0f172a'
                }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="+996 555 123 456"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                autoFocus={!authData?.phone}
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
              />
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                {t.smsSignInHint}
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[
              globalStyles.pill,
              globalStyles.pillPrimary,
              loading && globalStyles.pillDisabled
            ]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={globalStyles.pillTextPrimary}>
                {t.signIn}
              </Text>
            )}
          </TouchableOpacity>

          {/* Create Account Link */}
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={[globalStyles.alreadyAccountText, { color: '#6b7280' }]}>
              {t.dontHaveAccount}{' '}
              <Text
                style={[globalStyles.linkText, { color: '#98DDA6' }]}
                onPress={() => navigateAuth('welcome')}
              >
                {t.createAccount}
              </Text>
            </Text>
          </View>
        </View>

        {/* Terms with Hyperlinks */}
        <View style={{ 
          marginTop: 16, 
          paddingHorizontal: 20,
          alignItems: 'center'
        }}>
          <Text style={[globalStyles.footerText, { 
            fontSize: width * 0.03,
            color: globalStyles.textDim,
            textAlign: 'center'
          }]}>
            {language === 'en' ? 'By signing in you agree to our ' : 
             language === 'ru' ? 'Входя, вы соглашаетесь с нашими ' :
             'Кирип, биздин '}
            <Text 
              style={[globalStyles.linkText, { 
                color: '#6d28d9', 
                textDecorationLine: 'underline'
              }]}
              onPress={openTerms}
            >
              {language === 'en' ? 'Terms of Service' : 
               language === 'ru' ? 'Условиями использования' :
               'Шарттарыбыз'}
            </Text>
            {language === 'en' ? ' and ' : 
             language === 'ru' ? ' и ' :
             ' жана '}
            <Text 
              style={[globalStyles.linkText, { 
                color: '#6d28d9', 
                textDecorationLine: 'underline'
              }]}
              onPress={openPrivacy}
            >
              {language === 'en' ? 'Privacy Policy' : 
               language === 'ru' ? 'Политикой конфиденциальности' :
               'Купуялык саясатыбыз'}
            </Text>
          </Text>
        </View>
      </KeyboardAwareWrapper>

      {/* Password Reset Modal */}
      {renderResetModal()}
    </SafeAreaView>
  );
};

export default SignInForm;