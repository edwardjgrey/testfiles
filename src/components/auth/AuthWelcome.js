// src/components/auth/AuthWelcome.js - UPDATED WITH VK BUTTON
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../../styles/globalStyles';
import { translations } from '../../utils/translations';
import LanguageSelector from '../common/LanguageSelector';
import AkchabarLogo from '../common/AkchabarLogo';
import * as AppleAuthentication from 'expo-apple-authentication';

const { width } = Dimensions.get('window');

const AuthWelcome = ({ language, setLanguage, handleAuthMethod, navigateAuth }) => {
  const t = translations[language];
  const [loading, setLoading] = useState(false);
  
  // Smart authentication states
  const [appleSignInAvailable, setAppleSignInAvailable] = useState(false);
  const [regionalLoginAvailable, setRegionalLoginAvailable] = useState(false);
  const [regionalLoginProviders, setRegionalLoginProviders] = useState([]);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuthAvailability();
  }, [language]); // Re-check when language changes

  const checkAuthAvailability = async () => {
    try {
      setCheckingAuth(true);
      
      // Check Apple Sign-In availability (iOS only)
      let appleAvailable = false;
      if (Platform.OS === 'ios') {
        try {
          appleAvailable = await AppleAuthentication.isAvailableAsync();
          console.log('Apple Sign-In availability:', appleAvailable);
        } catch (error) {
          console.error('Error checking Apple Sign-In:', error);
          appleAvailable = false;
        }
      }
      setAppleSignInAvailable(appleAvailable);

      // Check regional login based on language
      const regionalProviders = getRegionalAuthByLanguage(language);
      setRegionalLoginAvailable(regionalProviders.length > 0);
      setRegionalLoginProviders(regionalProviders);
      
      console.log('Regional auth for', language, ':', regionalProviders);
      
    } catch (error) {
      console.error('Error checking auth availability:', error);
      setAppleSignInAvailable(false);
      setRegionalLoginAvailable(false);
      setRegionalLoginProviders([]);
    } finally {
      setCheckingAuth(false);
    }
  };

  // Determine regional login options based on language/region - UPDATED WITH VK
  const getRegionalAuthByLanguage = (lang) => {
    const regionalOptions = {
      'ru': [
        {
          type: 'yandex',
          name: 'Yandex',
          icon: 'logo-yahoo', // Using yahoo icon as substitute
          backgroundColor: '#FFCC00',
          borderColor: '#E6B800'
        },
        {
          type: 'vk',
          name: 'VKontakte',
          icon: 'logo-vk', // VK icon (if not available, will fallback to globe-outline)
          backgroundColor: '#4680C2',
          borderColor: '#3A6FA5'
        }
      ],
      'ky': [
        {
          type: 'yandex',
          name: 'Yandex',
          icon: 'logo-yahoo',
          backgroundColor: '#FFCC00',
          borderColor: '#E6B800',
          
        },
        {
          type: 'vk',
          name: 'VKontakte',
          icon: 'logo-vk',
          backgroundColor: '#4680C2',
          borderColor: '#3A6FA5'
        }
      ],
      'en': [] // No regional auth for English
    };

    return regionalOptions[lang] || [];
  };

  // Handle email registration
  const handleEmailSignUp = () => {
    handleAuthMethod('email');
  };

  // Handle phone registration
  const handlePhoneSignUp = () => {
    handleAuthMethod('phone');
  };

  // Google Sign-In handler - updated to use handleAuthMethod
  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      
      // Mock Google response - replace with real Google Sign-In
      const mockGoogleResponse = {
        isNewUser: true,
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

  // Apple Sign-In handler - updated to use handleAuthMethod  
  const handleAppleAuth = async () => {
    if (!appleSignInAvailable) {
      Alert.alert(
        'Apple Sign-In Unavailable',
        Platform.OS === 'ios' 
          ? 'Apple Sign-In is not available on this device or iOS version.'
          : 'Apple Sign-In is only available on iOS devices.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setLoading(true);
      
      // Mock Apple response - replace with real Apple Sign-In
      const mockAppleResponse = {
        isNewUser: true,
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

  // Regional login handler - UPDATED TO HANDLE SPECIFIC PROVIDERS
  const handleRegionalLogin = async (provider) => {
    const authTexts = {
      'yandex': {
        title: language === 'ru' ? 'Вход через Yandex' : 
               language === 'ky' ? 'Yandex аркылуу кирүү' : 'Yandex Sign-In',
        message: language === 'ru' ? 'Авторизация через Yandex пока не реализована. Пожалуйста, используйте email или телефон.' :
                 language === 'ky' ? 'Yandex аркылуу кирүү азырынча иштебейт. Email же телефон колдонуңуз.' : 
                 'Yandex authentication is not implemented yet. Please use email or phone registration.'
      },
      'vk': {
        title: language === 'ru' ? 'Вход через VKontakte' : 
               language === 'ky' ? 'VKontakte аркылуу кирүү' : 'VKontakte Sign-In',
        message: language === 'ru' ? 'Авторизация через VKontakte пока не реализована. Пожалуйста, используйте email или телефон.' :
                 language === 'ky' ? 'VKontakte аркылуу кирүү азырынча иштебейт. Email же телефон колдонуңуз.' : 
                 'VKontakte authentication is not implemented yet. Please use email or phone registration.'
      }
    };
    
    const authText = authTexts[provider] || authTexts['yandex'];
    Alert.alert(
      authText.title,
      authText.message,
      [{ text: 'OK' }]
    );
  };

  // Handle sign in (existing users)
  const handleSignIn = () => {
    handleAuthMethod('signin');
  };

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

  // Google Icon Component (keeping original)
  const GoogleIcon = () => (
    <View style={{ width: 18, height: 18 }}>
      <Ionicons name="logo-google" size={18} color="#ffffff" />
    </View>
  );

  // Apple Icon Component (keeping original)
  const AppleIcon = () => (
    <View style={{ width: 18, height: 18 }}>
      <Ionicons name="logo-apple" size={18} color="#ffffff" />
    </View>
  );

  // Show loading while checking authentication availability
  if (checkingAuth) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#05212A" />
        <ActivityIndicator size="large" color="#98DDA6" />
        <Text style={styles.loadingText}>
          {language === 'ru' ? 'Проверка доступных способов входа...' : 
           language === 'ky' ? 'Жеткиликтүү кирүү ыкмаларын текшерүү...' :
           'Checking authentication options...'}
        </Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#05212A" />
        <ActivityIndicator size="large" color="#98DDA6" />
        <Text style={styles.loadingText}>
          {language === 'ru' ? 'Аутентификация...' : 
           language === 'ky' ? 'Аутентификация...' : 
           'Authenticating...'}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#05212A" />
      <SafeAreaView style={styles.safeArea}>
        
        {/* Language Selector */}
        <LanguageSelector language={language} setLanguage={setLanguage} />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentContainer}>
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <AkchabarLogo size="large" />
            </View>
            
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>
                {t.welcome}
              </Text>
              <Text style={styles.subtitle}>
                {language === 'en' ? 'Your money, your future, your control.' : 
                 language === 'ru' ? 'Ваши деньги, ваше будущее, ваш контроль.' :
                 'Сиздин акчаңыз, келечегиңиз, көзөмөлүңүз.'}
              </Text>
            </View>

            {/* Button Section */}
            <View style={styles.buttonSection}>
              {/* Phone Sign-Up Button */}
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handlePhoneSignUp}
                disabled={loading}
              >
                <Ionicons name="call-outline" size={18} color="#05212A" />
                <Text style={styles.primaryButtonText}>
                  {t.signUpPhone || 'Sign up with phone number'}
                </Text>
              </TouchableOpacity>
              
              {/* Email Sign-Up Button */}
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleEmailSignUp}
                disabled={loading}
              >
                <Ionicons name="mail-outline" size={18} color="#ffffff" />
                <Text style={styles.secondaryButtonText}>
                  {t.signUpEmail || 'Sign up with email'}
                </Text>
              </TouchableOpacity>
              
              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  {t.or || 'or'}
                </Text>
                <View style={styles.dividerLine} />
              </View>
              
              {/* Google Sign-Up Button */}
              <TouchableOpacity
                style={[styles.button, styles.googleButton]}
                onPress={handleGoogleAuth}
                disabled={loading}
              >
                <Ionicons name="logo-google" size={18} color="#ffffff" />
                <Text style={styles.googleButtonText}>
                  {t.signUpGoogle || 'Continue with Google'}
                </Text>
              </TouchableOpacity>
              
              {/* Apple Sign-Up Button - Only show if available (iOS only) */}
              {appleSignInAvailable && (
                <TouchableOpacity
                  style={[styles.button, styles.appleButton]}
                  onPress={handleAppleAuth}
                  disabled={loading}
                >
                  <Ionicons name="logo-apple" size={18} color="#ffffff" />
                  <Text style={styles.appleButtonText}>
                    {t.signUpApple || 'Continue with Apple'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Regional Login Buttons - UPDATED TO SHOW MULTIPLE */}
              {regionalLoginAvailable && regionalLoginProviders.map((provider, index) => (
                <TouchableOpacity
                  key={provider.type}
                  style={[styles.button, {
                    backgroundColor: provider.backgroundColor,
                    borderColor: provider.borderColor,
                    borderWidth: 1,
                    marginTop: index === 0 ? 6 : 0, // Add spacing for first regional button
                  }]}
                  onPress={() => handleRegionalLogin(provider.type)}
                  disabled={loading}
                >
                  <Ionicons 
                    name={provider.icon || "globe-outline"} 
                    size={18} 
                    color="#ffffff" 
                  />
                  <Text style={[styles.googleButtonText, { marginLeft: 12 }]}>
                    {language === 'ru' ? `Войти через ${provider.name}` :
                     language === 'ky' ? `${provider.name} аркылуу кирүү` :
                     `Continue with ${provider.name}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Sign In Link */}
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>
                {t.alreadyAccount || 'Already have an account?'}{' '}
                <Text
                  style={styles.signInLink}
                  onPress={handleSignIn}
                >
                  {t.signIn || 'Sign in'}
                </Text>
              </Text>
            </View>

            {/* Terms Section */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                {language === 'en' ? 'By signing up you agree to our ' : 
                 language === 'ru' ? 'Регистрируясь, вы соглашаетесь с нашими ' :
                 'Каттолуп, биздин '}
                <Text 
                  style={styles.termsLink}
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
                  style={styles.termsLink}
                  onPress={openPrivacy}
                >
                  {language === 'en' ? 'Privacy Policy' : 
                   language === 'ru' ? 'Политикой конфиденциальности' :
                   'Купуялык саясатыбыз'}
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#05212A',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#05212A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#05212A',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center'
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: width * 0.05,
    paddingVertical: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  logoSection: {
    marginBottom: 40,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: width * 0.08,
    fontWeight: '800',
    color: '#ffffff', // FIXED: Changed to white
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: width * 0.1,
  },
  subtitle: {
    fontSize: width * 0.035,
    color: '#9ca3af', // FIXED: Better contrast for subtitle
    textAlign: 'center',
    fontStyle: "italic",
    lineHeight: width * 0.045,
    paddingHorizontal: 20,
  },
  buttonSection: {
    width: '100%',
    maxWidth: 350,
    marginBottom: 30,
  },
  button: {
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButton: {
    backgroundColor: '#98DDA6',
  },
  secondaryButton: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  googleButton: {
    backgroundColor: '#111111',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  primaryButtonText: {
    color: '#05212A',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  googleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  appleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#374151',
  },
  dividerText: {
    color: '#9ca3af',
    fontSize: 14,
    marginHorizontal: 16,
  },
  signInContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  signInText: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
  },
  signInLink: {
    color: '#98DDA6',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  termsContainer: {
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#98DDA6',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
};

export default AuthWelcome;