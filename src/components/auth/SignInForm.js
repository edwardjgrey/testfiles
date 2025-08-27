// src/components/auth/SignInForm.js - FIXED undefined countryCode bug
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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../../styles/globalStyles';
import { translations, countryCodes } from '../../utils/translations';
import LanguageSelector from '../common/LanguageSelector';
import KeyboardAwareWrapper from '../common/KeyboardAwareWrapper';
import ApiService from '../../services/apiService';
import BiometricService from '../../services/biometricService';

const { width } = Dimensions.get('window');

const SignInForm = ({ language, setLanguage, navigateAuth, completeAuth, authData, handleEmailSignIn, handlePhoneSignIn }) => {
  const t = translations[language] || translations.en || {};
  const [signInMethod, setSignInMethod] = useState('email');
  const [email, setEmail] = useState(authData?.email || '');
  const [phone, setPhone] = useState(authData?.phone || '');
  
  // FIXED: Ensure countryCode is never undefined with proper validation
  const [countryCode, setCountryCode] = useState(() => {
    const initial = authData?.countryCode || '+996';
    // Validate that the country code exists in our countryCodes array
    const exists = countryCodes.find(c => c.code === initial);
    return exists ? initial : '+996'; // Default to Kyrgyzstan if invalid
  });
  
  const [showCountries, setShowCountries] = useState(false);
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

  // FIXED: Add validation when countryCode changes to prevent undefined issues
  useEffect(() => {
    if (!countryCode || countryCode === 'undefined' || !countryCodes.find(c => c.code === countryCode)) {
      console.log('🔧 Fixing invalid country code:', countryCode);
      setCountryCode('+996');
    }
  }, [countryCode]);

  const checkBiometricStatus = async () => {
    try {
      const biometricInfo = await BiometricService.getBiometricInfo();
      setBiometricAvailable(biometricInfo.available);
      setBiometricSetup(biometricInfo.isSetup);
      setBiometricType(biometricInfo.typeName || '');
    } catch (error) {
      console.log('Biometric check failed - continuing without biometric');
    }
  };

  // FIXED: Get selected country safely with fallback and validation
  const selectedCountry = React.useMemo(() => {
    const found = countryCodes.find(c => c.code === countryCode);
    if (!found) {
      console.warn('⚠️ Country not found for code:', countryCode, 'using fallback');
      return countryCodes[0] || {
        code: '+996',
        country: 'Kyrgyzstan',
        flag: '🇰🇬',
        format: 'XXX XXX XXX',
        length: 9
      };
    }
    return found;
  }, [countryCode]);

  // FIXED: Format phone number safely with validation
  const formatPhone = (text, selectedCountry) => {
    const digits = text.replace(/\D/g, '');
    
    // FIXED: Handle undefined selectedCountry
    if (!selectedCountry || !selectedCountry.code) {
      return digits;
    }
    
    // Limit input length based on country
    const maxLength = selectedCountry.length || 15;
    const limitedDigits = digits.substring(0, maxLength);
    
    // Format based on country
    switch (selectedCountry.code) {
      case '+996': // Kyrgyzstan - 9 digits: XXX XXX XXX
      case '+992': // Tajikistan - 9 digits
        const kg = limitedDigits.match(/^(\d{0,3})(\d{0,3})(\d{0,3})$/);
        if (!kg) return limitedDigits;
        return [kg[1], kg[2], kg[3]].filter(Boolean).join(' ');
        
      case '+44': // UK - 10-11 digits: XXXX XXX XXX
        const uk = limitedDigits.match(/^(\d{0,4})(\d{0,3})(\d{0,4})$/);
        if (!uk) return limitedDigits;
        return [uk[1], uk[2], uk[3]].filter(Boolean).join(' ');
        
      case '+1': // USA - 10 digits: XXX XXX XXXX
        const us = limitedDigits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
        if (!us) return limitedDigits;
        let formatted = '';
        if (us[1]) formatted += us[1];
        if (us[2]) formatted += ` ${us[2]}`;
        if (us[3]) formatted += ` ${us[3]}`;
        return formatted;
        
      case '+7': // Russia/Kazakhstan - 10 digits: XXX XXX XX XX
        const ru = limitedDigits.match(/^(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
        if (!ru) return limitedDigits;
        return [ru[1], ru[2], ru[3], ru[4]].filter(Boolean).join(' ');
        
      default:
        // Generic format for other countries
        const generic = limitedDigits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
        if (!generic) return limitedDigits;
        return [generic[1], generic[2], generic[3]].filter(Boolean).join(' ');
    }
  };

  // FIXED: Handle sign in with proper country code validation
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
        // PHONE SIGN IN - FIXED: Ensure countryCode is never undefined
        if (!phone) {
          Alert.alert('Error', 'Please enter your phone number');
          return;
        }
        
        // FIXED: Ensure countryCode is properly validated and set
        const finalCountryCode = countryCode && countryCode !== 'undefined' ? countryCode : '+996';
        const cleanPhone = phone.replace(/\s/g, '');
        
        // Additional validation to ensure we have a valid country code
        const validCountry = countryCodes.find(c => c.code === finalCountryCode);
        if (!validCountry) {
          console.error('❌ Invalid country code detected:', finalCountryCode);
          Alert.alert('Error', 'Invalid country code. Please select a valid country.');
          return;
        }
        
        console.log('📱 Processing phone sign-in for:', finalCountryCode + cleanPhone);
        
        if (handlePhoneSignIn) {
          await handlePhoneSignIn(cleanPhone, finalCountryCode);
        } else {
          const result = await ApiService.requestPhoneSignIn(cleanPhone, finalCountryCode);
          
          if (result.success) {
            navigateAuth('verify', { phone: cleanPhone, countryCode: finalCountryCode, isSignIn: true });
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

  // FIXED: Safe country selection handler with validation
  const handleCountrySelect = (country) => {
    console.log('🏳️ Country selected:', country.code, country.country);
    
    // Validate the selected country
    if (!country || !country.code || !country.country) {
      console.error('❌ Invalid country selected:', country);
      return;
    }
    
    setCountryCode(country.code);
    
    // Clear phone and validation when country changes
    setPhone('');
    setShowCountries(false);
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
              console.log('Biometric setup failed');
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
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={[globalStyles.authTitleLeft, { flex: 1, color: '#ffffff' }]}>
            {language === 'ru' ? 'Сброс пароля' : 
             language === 'ky' ? 'Сыр сөздү калыбына келтирүү' : 
             'Reset Password'}
          </Text>
        </View>

        {resetStep === 1 && (
          <View>
            <Text style={[globalStyles.authSubtitleLeft, { marginBottom: 20, color: '#9ca3af' }]}>
              {language === 'ru' ? 'Введите ваш email для получения кода сброса' : 
               language === 'ky' ? 'Калыбына келтирүү кодун алуу үчүн emailиңизди киргизиңиз' : 
               'Enter your email to receive a reset code'}
            </Text>
            
            <View style={globalStyles.formGroup}>
              <Text style={globalStyles.formLabel}>
                Email
              </Text>
              <TextInput
                style={globalStyles.formInput}
                value={resetEmail}
                onChangeText={setResetEmail}
                placeholder="your@email.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
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
            <Text style={[globalStyles.authSubtitleLeft, { marginBottom: 20, color: '#9ca3af' }]}>
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
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
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
            <Text style={[globalStyles.authSubtitleLeft, { marginBottom: 20, color: '#9ca3af' }]}>
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
                placeholderTextColor="#9ca3af"
                secureTextEntry
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
                placeholderTextColor="#9ca3af"
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
            paddingTop: 120
          }
        ]}
        extraScrollHeight={50}
      >
        <TouchableOpacity
          style={globalStyles.backButton}
          onPress={() => navigateAuth('welcome')}
        >
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        
        <Text style={[globalStyles.authTitleLeft, { color: '#ffffff' }]}>
          {t.signIn || 'Sign In'}
        </Text>
        <Text style={[globalStyles.authSubtitleLeft, { color: '#9ca3af' }]}>
          {t.welcomeBackSub || 'Welcome back to Akchabar'}
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
            backgroundColor: '#374151',
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
                color: signInMethod === 'email' ? '#05212a' : '#ffffff'
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
                color: signInMethod === 'phone' ? '#05212a' : '#ffffff'
              }}>
                SMS
              </Text>
            </TouchableOpacity>
          </View>

          {signInMethod === 'email' ? (
            <>
              <View style={globalStyles.formGroup}>
                <Text style={globalStyles.formLabel}>
                  {t.email || 'Email'}
                </Text>
                <TextInput
                  style={globalStyles.formInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
              </View>

              <View style={globalStyles.formGroup}>
                <Text style={globalStyles.formLabel}>
                  {t.password || 'Password'}
                </Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={[globalStyles.formInput, { paddingRight: 50 }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleSignIn}
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
                      color="#9ca3af" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={{ alignSelf: 'flex-end', marginBottom: 16 }}
                onPress={handleForgotPassword}
              >
                <Text style={[globalStyles.linkText, { fontSize: 14, color: '#98DDA6' }]}>
                  {t.forgotPassword || 'Forgot Password?'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={globalStyles.formGroup}>
                <Text style={globalStyles.formLabel}>
                  {t.phoneNumber || 'Phone Number'}
                </Text>
                
                {/* FIXED: Phone input with proper country picker and validation */}
                <View style={globalStyles.phoneInputContainer}>
                  <TouchableOpacity
                    style={globalStyles.phoneCountry}
                    onPress={() => setShowCountries(!showCountries)}
                  >
                    <Text style={globalStyles.flagText}>{selectedCountry?.flag || '🇰🇬'}</Text>
                    <Text style={globalStyles.countryCodeText}>{countryCode || '+996'}</Text>
                    <Ionicons name="chevron-down" size={14} color="#9ca3af" />
                  </TouchableOpacity>
                  
                  <TextInput
                    style={globalStyles.phoneInput}
                    placeholder={selectedCountry?.format?.replace(/X/g, '0') || "555 123 456"}
                    placeholderTextColor="#9ca3af"
                    value={phone}
                    onChangeText={(text) => setPhone(formatPhone(text, selectedCountry))}
                    maxLength={selectedCountry?.length + 2 || 13} // +2 for spaces
                    keyboardType="phone-pad"
                    returnKeyType="done"
                    onSubmitEditing={handleSignIn}
                  />
                </View>
                
                <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                  {t.smsSignInHint || 'We\'ll send you a verification code to sign in'}
                </Text>
              </View>

              {/* Country Selection Modal */}
              <Modal
                visible={showCountries}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowCountries(false)}
              >
                <TouchableOpacity
                  style={globalStyles.modalOverlay}
                  onPress={() => setShowCountries(false)}
                >
                  <View style={globalStyles.countryModal}>
                    <Text style={globalStyles.modalTitle}>Select Country</Text>
                    <ScrollView>
                      {countryCodes.map((country, index) => (
                        <TouchableOpacity
                          key={`${country.code}-${index}`} // FIXED: Ensure unique keys
                          style={globalStyles.countryOption}
                          onPress={() => handleCountrySelect(country)}
                        >
                          <Text style={globalStyles.countryOptionText}>
                            {country.flag} {country.code} {country.country}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </TouchableOpacity>
              </Modal>
            </>
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
                {t.signIn || 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Create Account Link */}
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={[globalStyles.alreadyAccountText, { color: '#9ca3af' }]}>
              {t.dontHaveAccount || "Don't have an account?"}{' '}
              <Text
                style={[globalStyles.linkText, { color: '#98DDA6' }]}
                onPress={() => navigateAuth('welcome')}
              >
                {t.createAccount || 'Create Account'}
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
            color: '#9ca3af',
            textAlign: 'center'
          }]}>
            {language === 'en' ? 'By signing in you agree to our ' : 
             language === 'ru' ? 'Входя, вы соглашаетесь с нашими ' :
             'Кирип, биздин '}
            <Text 
              style={[globalStyles.linkText, { 
                color: '#98DDA6', 
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
                color: '#98DDA6', 
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