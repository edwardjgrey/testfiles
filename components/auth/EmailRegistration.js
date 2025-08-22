// src/components/auth/EmailRegistration.js - COMPLETE FILE
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../../styles/globalStyles';
import { translations } from '../../utils/translations';
import LanguageSelector from '../common/LanguageSelector';

const EmailRegistration = ({ language, setLanguage, navigateAuth, handleEmailRegistration }) => {
  const t = translations[language];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
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
    <SafeAreaView style={globalStyles.authContainer}>
      <StatusBar barStyle="light-content" backgroundColor={globalStyles.authContainer.backgroundColor} />
      <LanguageSelector language={language} setLanguage={setLanguage} />
      <ScrollView contentContainerStyle={globalStyles.scrollContent}>
        {/* Consistent back button */}
        <TouchableOpacity
          style={globalStyles.backButton}
          onPress={() => navigateAuth('welcome')}
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        
        <Text style={[globalStyles.authTitleLeft, { color: '#0f172a' }]}>
          {t.createAccount}
        </Text>
        <Text style={[globalStyles.authSubtitleLeft, { color: '#6b7280' }]}>
          {language === 'ru' ? 'Зарегистрируйтесь с помощью email адреса' :
           language === 'ky' ? 'Email дареги менен катталыңыз' :
           'Sign up with your email address'}
        </Text>
        
        <View style={globalStyles.authCard}>
          <View style={globalStyles.formGroup}>
            <Text style={globalStyles.formLabel}>{t.email}</Text>
            <TextInput
              style={globalStyles.formInput}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              returnKeyType="next"
            />
          </View>

          <View style={globalStyles.formGroup}>
            <Text style={globalStyles.formLabel}>{t.password}</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={[globalStyles.formInput, { paddingRight: 50 }]}
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
            <Text style={globalStyles.formLabel}>{t.confirmPassword}</Text>
            <TextInput
              style={globalStyles.formInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleNext}
            />
          </View>
          
          <TouchableOpacity
            style={[
              globalStyles.pill,
              globalStyles.pillPrimary,
              loading && globalStyles.pillDisabled
            ]}
            onPress={handleNext}
            disabled={loading}
          >
            <Text style={globalStyles.pillTextPrimary}>
              {loading ? 'Checking...' : t.next}
            </Text>
          </TouchableOpacity>

          <Text style={{
            fontSize: 12,
            color: "#9ca3af",
            textAlign: 'center',
            marginTop: 16,
            lineHeight: 16
          }}>
            {language === 'ru' ? 'Продолжая, вы соглашаетесь с нашими Условиями использования и Политикой конфиденциальности' :
             language === 'ky' ? 'Улантып, биздин Колдонуу шарттары жана Купуялык саясаты менен макулсуз' :
             'By continuing, you agree to our Terms of Service and Privacy Policy'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EmailRegistration;