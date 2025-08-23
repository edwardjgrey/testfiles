// Fixed AuthWelcome.js - Remove SafeAreaProvider usage
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../../styles/globalStyles';
import { translations } from '../../utils/translations';
import LanguageSelector from '../common/LanguageSelector';
import AkchabarLogo from '../common/AkchabarLogo';

const { width } = Dimensions.get('window');

const AuthWelcome = ({ language, setLanguage, handleAuthMethod, navigateAuth }) => {
  const t = translations[language];
  const [loading, setLoading] = useState(false);

  // Handle email registration
  const handleEmailSignUp = () => {
    handleAuthMethod('email');
  };

  // Handle phone registration
  const handlePhoneSignUp = () => {
    handleAuthMethod('phone');
  };

  // Handle Google sign-up/sign-in
  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      
      // Simulate Google authentication
      // In real app, this would use Google Sign-In SDK
      
      // Mock Google response - replace with real Google Sign-In
      const mockGoogleResponse = {
        isNewUser: true, // This would come from Google's response
        email: 'user@gmail.com',
        firstName: 'John',
        lastName: 'Doe',
        profilePicture: 'https://example.com/photo.jpg',
        googleId: 'google_user_id_123',
        accessToken: 'google_access_token'
      };
      
      handleAuthMethod('google', mockGoogleResponse);
      
    } catch (error) {
      Alert.alert('Google Sign-In Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Apple sign-up/sign-in
  const handleAppleAuth = async () => {
    try {
      setLoading(true);
      
      // Simulate Apple authentication
      // In real app, this would use Apple Sign-In SDK
      
      // Mock Apple response - replace with real Apple Sign-In
      const mockAppleResponse = {
        isNewUser: true, // This would come from Apple's response
        email: 'user@privaterelay.appleid.com',
        firstName: 'Jane',
        lastName: 'Smith',
        appleId: 'apple_user_id_456',
        identityToken: 'apple_identity_token'
      };
      
      handleAuthMethod('apple', mockAppleResponse);
      
    } catch (error) {
      Alert.alert('Apple Sign-In Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle sign in (existing users)
  const handleSignIn = () => {
    handleAuthMethod('signin');
  };

  // Handle opening external links
  const openTerms = () => {
    const termsUrl = 'https://akchabar.com/terms'; // Replace with your actual Terms URL
    Linking.openURL(termsUrl).catch(err => 
      Alert.alert('Error', 'Could not open Terms of Service')
    );
  };

  const openPrivacy = () => {
    const privacyUrl = 'https://akchabar.com/privacy'; // Replace with your actual Privacy URL
    Linking.openURL(privacyUrl).catch(err => 
      Alert.alert('Error', 'Could not open Privacy Policy')
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f8fb' }}>
        <ActivityIndicator size="large" color="#98DDA6" />
        <Text style={{
          marginTop: 16,
          fontSize: 16,
          color: '#6b7280',
          textAlign: 'center'
        }}>
          {language === 'ru' ? 'Аутентификация...' : 
           language === 'ky' ? 'Аутентификация...' : 
           'Authenticating...'}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.authContainer}>
      <StatusBar barStyle="light-content" backgroundColor={globalStyles.authContainer.backgroundColor} />
      <LanguageSelector language={language} setLanguage={setLanguage} />
      
      <ScrollView contentContainerStyle={[
        globalStyles.scrollContent, 
        { 
          paddingHorizontal: width * 0.05,
          paddingTop: 100
        }
      ]}>
        <View style={[globalStyles.authCard, { maxWidth: width * 0.9, alignSelf: 'center' }]}>
          <View style={globalStyles.logoWrap}>
            <AkchabarLogo size="medium" />
          </View>
          
          <Text style={[globalStyles.authTitle, { fontSize: width * 0.065, color: globalStyles.text }]}>
            {t.welcome}
          </Text>
          <Text style={[globalStyles.authSubtitle, { 
            fontSize: width * 0.035,
            marginBottom: 24,
            color: globalStyles.textDim
          }]}>
            {language === 'en' ? 'Your money, your future, your control.' : 
             language === 'ru' ? 'Ваши деньги, ваше будущее, ваш контроль.' :
             'Сиздин акчаңыз, келечегиңиз, көзөмөлүңүз.'}
          </Text>

          {/* Phone Sign-Up Button */}
          <TouchableOpacity
            style={[globalStyles.pill, globalStyles.pillPrimary, { marginVertical: 6 }]}
            onPress={handlePhoneSignUp}
            disabled={loading}
          >
            <Ionicons name="call-outline" size={18} color="black" />
            <Text style={[globalStyles.pillTextPrimary, { fontSize: width * 0.04, marginLeft: 8 }]}>
              {t.signUpPhone || 'Sign up with phone number'}
            </Text>
          </TouchableOpacity>
          
          {/* Email Sign-Up Button */}
          <TouchableOpacity
            style={[globalStyles.pill, globalStyles.pillSecondary, { marginVertical: 6 }]}
            onPress={handleEmailSignUp}
            disabled={loading}
          >
            <Ionicons name="mail-outline" size={18} color={globalStyles.authText} />
            <Text style={[globalStyles.pillTextSecondary, { fontSize: width * 0.04 }]}>
              {t.signUpEmail || 'Sign up with email'}
            </Text>
          </TouchableOpacity>
          
          <View style={[globalStyles.dividerRow, { marginVertical: 8 }]}>
            <View style={globalStyles.divider} />
            <Text style={[globalStyles.dividerText, { color: globalStyles.textDim }]}>
              {t.or || 'or'}
            </Text>
            <View style={globalStyles.divider} />
          </View>
          
          {/* Google Sign-Up Button */}
          <TouchableOpacity
            style={[globalStyles.pill, globalStyles.pillGoogle, { marginVertical: 6 }]}
            onPress={handleGoogleAuth}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={18} color="#ffffff" />
            <Text style={[globalStyles.pillTextGoogle, { 
              fontSize: width * 0.04, 
              marginLeft: 12
            }]}>
              {t.signUpGoogle || 'Continue with Google'}
            </Text>
          </TouchableOpacity>
          
          {/* Apple Sign-Up Button */}
          <TouchableOpacity
            style={[globalStyles.pill, globalStyles.pillApple, { marginVertical: 6 }]}
            onPress={handleAppleAuth}
            disabled={loading}
          >
            <Ionicons name="logo-apple" size={18} color="#ffffff" />
            <Text style={[globalStyles.pillTextApple, { 
              fontSize: width * 0.04,
              marginLeft: 12
            }]}>
              {t.signUpApple || 'Continue with Apple'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Sign In Link */}
        <View style={[globalStyles.authCard, globalStyles.signInCard, { marginTop: 12 }]}>
          <Text style={[globalStyles.alreadyAccountText, { color: globalStyles.textDim }]}>
            {t.alreadyAccount || 'Already have an account?'}{' '}
            <Text
              style={[globalStyles.linkText, { color: globalStyles.primary }]}
              onPress={handleSignIn}
            >
              {t.signIn || 'Sign in'}
            </Text>
          </Text>
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
            {language === 'en' ? 'By signing up you agree to our ' : 
             language === 'ru' ? 'Регистрируясь, вы соглашаетесь с нашими ' :
             'Каттолуп, биздин '}
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default AuthWelcome;