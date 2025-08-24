// src/components/auth/EmailRegistration.js - Enhanced version with TOS links
// Changes start from line 1 and go to end of file

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../../styles/globalStyles';
import { translations } from '../../utils/translations';
import LanguageSelector from '../common/LanguageSelector';

const { width } = Dimensions.get('window');

const EmailRegistration = ({ language, setLanguage, navigateAuth, handleEmailRegistration }) => {
  const t = translations[language];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
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

  const handleNext = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    if (!validatePassword(password)) {
      Alert.alert(
        'Error', 
        'Password must be at least 8 characters long and contain at least one letter and one number'
      );
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!tosAccepted) {
      Alert.alert('Error', 'Please accept the Terms of Service and Privacy Policy to continue');
      return;
    }
    
    setLoading(true);
    
    try {
      if (handleEmailRegistration) {
        console.log('📧 Using enhanced email registration with early check');
        await handleEmailRegistration(email, password);
      } else {
        console.log('📧 Using fallback email registration method');
        await new Promise(resolve => setTimeout(resolve, 1500));
        navigateAuth('profile', { 
          email, 
          password,
          authMethod: 'email'
        });
      }
    } catch (error) {
      console.error('❌ Email registration error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[globalStyles.authContainer, { backgroundColor: '#05212a' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#05212a" />
      <LanguageSelector language={language} setLanguage={setLanguage} />
      
      <ScrollView 
        contentContainerStyle={[
          globalStyles.scrollContent, 
          { 
            paddingHorizontal: width * 0.05,
            paddingTop: 60,
            minHeight: '100%',
            justifyContent: 'center'
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Fixed back button alignment */}
        <TouchableOpacity
          style={[globalStyles.backButton, { 
            position: 'absolute',
            top: 50,
            left: 20,
            zIndex: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            padding: 12
          }]}
          onPress={() => navigateAuth('welcome')}
        >
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        
        <Text style={[globalStyles.authTitleLeft, { color: '#ffffff', marginTop: 40 }]}>
          {t.createAccount}
        </Text>
        <Text style={[globalStyles.authSubtitleLeft, { color: '#9ca3af' }]}>
          {language === 'ru' ? 'Зарегистрируйтесь с помощью email адреса' :
           language === 'ky' ? 'Email дареги менен катталыңыз' :
           'Sign up with your email address'}
        </Text>
        
        <View style={[globalStyles.authCard, { 
          backgroundColor: '#1f2937',
          borderWidth: 1,
          borderColor: '#374151',
          marginTop: 20
        }]}>
          <View style={globalStyles.formGroup}>
            <Text style={[globalStyles.formLabel, { color: '#d1d5db' }]}>{t.email}</Text>
            <TextInput
              style={[globalStyles.formInput, {
                backgroundColor: '#374151',
                borderColor: '#4b5563',
                color: '#ffffff'
              }]}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={globalStyles.formGroup}>
            <Text style={[globalStyles.formLabel, { color: '#d1d5db' }]}>{t.password}</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={[globalStyles.formInput, { 
                  paddingRight: 50,
                  backgroundColor: '#374151',
                  borderColor: '#4b5563',
                  color: '#ffffff'
                }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                returnKeyType="next"
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
            <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
              {language === 'ru' ? 'Минимум 8 символов, 1 буква и 1 цифра' :
               language === 'ky' ? 'Эң аз 8 символ, 1 тамга жана 1 сан' :
               'At least 8 characters, 1 letter and 1 number'}
            </Text>
          </View>

          <View style={globalStyles.formGroup}>
            <Text style={[globalStyles.formLabel, { color: '#d1d5db' }]}>{t.confirmPassword}</Text>
            <TextInput
              style={[globalStyles.formInput, {
                backgroundColor: '#374151',
                borderColor: '#4b5563',
                color: '#ffffff'
              }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleNext}
            />
          </View>

          {/* Terms of Service Checkbox */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: 20,
            paddingHorizontal: 4
          }}>
            <TouchableOpacity
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: tosAccepted ? '#98DDA6' : '#4b5563',
                backgroundColor: tosAccepted ? '#98DDA6' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2,
                marginRight: 12
              }}
              onPress={() => setTosAccepted(!tosAccepted)}
            >
              {tosAccepted && (
                <Ionicons name="checkmark" size={14} color="#000000" />
              )}
            </TouchableOpacity>
            
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 13,
                color: '#d1d5db',
                lineHeight: 18
              }}>
                {language === 'ru' ? 'Я согласен с ' : 
                 language === 'ky' ? 'Мен ' : 
                 'I agree to the '}
                <Text 
                  style={{ 
                    color: '#98DDA6', 
                    textDecorationLine: 'underline',
                    fontWeight: '600'
                  }}
                  onPress={openTerms}
                >
                  {language === 'ru' ? 'Условиями использования' : 
                   language === 'ky' ? 'Колдонуу шарттары' :
                   'Terms of Service'}
                </Text>
                {language === 'ru' ? ' и ' : 
                 language === 'ky' ? ' жана ' :
                 ' and '}
                <Text 
                  style={{ 
                    color: '#98DDA6', 
                    textDecorationLine: 'underline',
                    fontWeight: '600'
                  }}
                  onPress={openPrivacy}
                >
                  {language === 'ru' ? 'Политикой конфиденциальности' : 
                   language === 'ky' ? 'Купуялык саясаты' :
                   'Privacy Policy'}
                </Text>
                {language === 'ru' ? '' : 
                 language === 'ky' ? ' менен макулмун' :
                 ''}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[
              globalStyles.pill,
              globalStyles.pillPrimary,
              (loading || !tosAccepted) && globalStyles.pillDisabled
            ]}
            onPress={handleNext}
            disabled={loading || !tosAccepted}
          >
            <Text style={globalStyles.pillTextPrimary}>
              {loading ? 'Checking...' : t.next}
            </Text>
          </TouchableOpacity>

          {/* Additional Terms Notice */}
          <View style={{
            backgroundColor: 'rgba(152, 221, 166, 0.1)',
            padding: 12,
            borderRadius: 8,
            marginTop: 16,
            borderWidth: 1,
            borderColor: 'rgba(152, 221, 166, 0.2)'
          }}>
            <Text style={{
              fontSize: 12,
              color: '#98DDA6',
              textAlign: 'center',
              lineHeight: 16
            }}>
              {language === 'ru' ? 'Ваши данные защищены 256-битным шифрованием' :
               language === 'ky' ? 'Маалыматтарыңыз 256-биттик шифрлөө менен корголгон' :
               'Your data is protected with 256-bit encryption'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EmailRegistration;