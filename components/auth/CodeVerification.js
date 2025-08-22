// src/components/auth/CodeVerification.js - COMPLETE FILE
import React, { useState, useEffect } from 'react';
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

const CodeVerification = ({ authData, language, setLanguage, navigateAuth, handleCodeVerification }) => {
  const t = translations[language];
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  // Determine if this is sign-in or registration
  const isSignIn = authData.isSignIn || false;
  
  // Clean phone number for display and processing
  const cleanPhone = authData.phone ? authData.phone.replace(/\s/g, '') : '';
  const displayPhone = `${authData.countryCode} ${authData.phone}`;
  
  console.log('🔧 CodeVerification initialized:', {
    isSignIn,
    originalPhone: authData.phone,
    cleanPhone,
    displayPhone,
    authData
  });

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Error', 'Enter the 6-digit code');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔓 Starting verification process:', {
        code,
        isSignIn,
        phone: cleanPhone,
        countryCode: authData.countryCode
      });
      
      // Use the enhanced verification handler from App.js
      if (handleCodeVerification) {
        console.log('✅ Using enhanced verification handler');
        await handleCodeVerification(code);
      } else {
        console.log('⚠️ Fallback verification method');
        // Fallback to old method
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (isSignIn) {
          console.log('🔓 Sign-in verification completed (fallback)');
          // This would typically call completeAuth with user data
        } else {
          console.log('🔓 Registration verification - proceeding to profile (fallback)');
          navigateAuth('profile', { verificationCode: code });
        }
      }
    } catch (error) {
      console.error('❌ Verification failed:', error);
      Alert.alert('Verification Error', error.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    // Reset timer
    setResendTimer(60);
    
    console.log('📱 Resending verification code for:', {
      isSignIn,
      phone: cleanPhone,
      countryCode: authData.countryCode
    });
    
    if (isSignIn) {
      Alert.alert(
        'Code Sent', 
        'New verification code sent to your phone!',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Code Sent', 
        'Verification code sent! (For testing, enter any 6 digits)',
        [{ text: 'OK' }]
      );
    }
  };

  const handleGoBack = () => {
    console.log('🔙 Going back from verification:', { isSignIn });
    
    if (isSignIn) {
      // Go back to sign-in form for sign-in flow
      navigateAuth('signin-form');
    } else {
      // Go back to phone entry for registration flow
      navigateAuth('phone');
    }
  };

  return (
    <SafeAreaView style={globalStyles.authContainer}>
      <StatusBar barStyle="light-content" backgroundColor={globalStyles.authContainer.backgroundColor} />
      <LanguageSelector language={language} setLanguage={setLanguage} />
      <ScrollView contentContainerStyle={globalStyles.scrollContent}>
        {/* Consistent back button with smart behavior */}
        <TouchableOpacity
          style={globalStyles.backButton}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        
        <Text style={[globalStyles.authTitleLeft, { color: '#0f172a' }]}>
          {isSignIn ? 
            (language === 'ru' ? 'Подтвердите вход' : 
             language === 'ky' ? 'Кирүүнү ырастаңыз' : 
             'Verify Sign In') : 
            t.verifyNumber}
        </Text>
        <Text style={[globalStyles.authSubtitleLeft, { color: '#6b7280' }]}>
          {isSignIn ?
            (language === 'ru' ? `Введите код, отправленный на ${displayPhone}` :
             language === 'ky' ? `${displayPhone} номерине жөнөтүлгөн кодду киргизиңиз` :
             `Enter the code sent to ${displayPhone}`) :
            `${t.verifySubtitle} ${displayPhone}`}
        </Text>
        
        {/* Show different notice for sign-in vs registration */}
        {isSignIn ? (
          <View style={{
            backgroundColor: '#0f2a44',
            padding: 12,
            borderRadius: 8,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#1f4a73'
          }}>
            <Text style={{ 
              fontSize: 14, 
              color: '#98DDA6', 
              textAlign: 'center',
              fontWeight: '500'
            }}>
              🔐 Signing in to your existing account
            </Text>
          </View>
        ) : (
          <View style={{
            backgroundColor: '#fef3c7',
            padding: 12,
            borderRadius: 8,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#fcd34d'
          }}>
            <Text style={{ 
              fontSize: 14, 
              color: '#92400e', 
              textAlign: 'center',
              fontWeight: '500'
            }}>
              📱 Testing Mode: Enter any 6 digits to continue
            </Text>
          </View>
        )}
        
        <View style={globalStyles.authCard}>
          <TextInput
            style={globalStyles.verificationInput}
            placeholder="● ● ● ● ● ●"
            placeholderTextColor="#9ca3af"
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, ''))}
            maxLength={6}
            keyboardType="number-pad"
            autoFocus
          />
          
          <View style={globalStyles.resendSection}>
            {resendTimer > 0 ? (
              <Text style={globalStyles.resendText}>
                {language === 'ru' ? `Отправить повторно через ${resendTimer}с` :
                 language === 'ky' ? `${resendTimer}с кийин кайра жөнөтүү` :
                 `Resend in ${resendTimer}s`}
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendCode}>
                <Text style={globalStyles.resendButton}>{t.resendCode}</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            style={[
              globalStyles.pill,
              globalStyles.pillPrimary,
              (loading || code.length !== 6) && globalStyles.pillDisabled
            ]}
            onPress={handleVerify}
            disabled={loading || code.length !== 6}
          >
            <Text style={globalStyles.pillTextPrimary}>
              {loading ? 
                (language === 'ru' ? 'Проверка...' :
                 language === 'ky' ? 'Текшерүү...' :
                 'Verifying...') : 
                (isSignIn ?
                  (language === 'ru' ? 'Войти' :
                   language === 'ky' ? 'Кирүү' :
                   'Sign In') :
                  t.verifyButton)}
            </Text>
          </TouchableOpacity>

          {/* Additional help text for sign-in */}
          {isSignIn && (
            <Text style={{
              fontSize: 12,
              color: "#9ca3af",
              textAlign: 'center',
              marginTop: 16,
              lineHeight: 16
            }}>
              {language === 'ru' ? 'Не получили код? Проверьте SMS или попробуйте войти с email.' :
               language === 'ky' ? 'Код алган жоксузбу? SMS текшериңиз же email менен кирүүгө аракет кылыңыз.' :
               'Didn\'t receive the code? Check your SMS or try signing in with email.'}
            </Text>
          )}
        </View>

        {/* Debug info (remove in production) */}
        {__DEV__ && (
          <View style={{
            backgroundColor: '#f3f4f6',
            padding: 12,
            borderRadius: 8,
            marginTop: 20,
          }}>
            <Text style={{ fontSize: 12, color: '#6b7280' }}>
              Debug: Original phone: {authData.phone}
            </Text>
            <Text style={{ fontSize: 12, color: '#6b7280' }}>
              Debug: Clean phone: {cleanPhone}
            </Text>
            <Text style={{ fontSize: 12, color: '#6b7280' }}>
              Debug: Is sign-in: {isSignIn ? 'Yes' : 'No'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CodeVerification;