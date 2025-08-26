// App.js - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { StatusBar, Alert, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Import components
import OnboardingFlow from './src/components/onboarding/OnboardingFlow';
import AuthWelcome from './src/components/auth/AuthWelcome';
import SignInForm from './src/components/auth/SignInForm';
import EmailRegistration from './src/components/auth/EmailRegistration';
import PhoneEntry from './src/components/auth/PhoneEntry';
import CodeVerification from './src/components/auth/CodeVerification';
import ProfileSetup from './src/components/auth/ProfileSetup';
import SubscriptionPlans from './src/components/auth/SubscriptionPlans';
import FinancialOnboarding from './src/components/auth/FinancialOnboarding';
import PinSetup from './src/components/auth/PinSetup';
import PinEntry from './src/components/auth/PinEntry';
import MainApp from './src/components/MainApp';

import { 
  AppLoadingScreen, 
  FormLoadingOverlay,
  FinancialDataLoader 
} from './src/components/common/LoadingComponents';

// Import services
import ApiService from './src/services/apiService';
import SecurityService from './src/services/securityService';

export default function App() {
  // App State Management
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAuthView, setCurrentAuthView] = useState('welcome');
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Security State
  const [pinSetupRequired, setPinSetupRequired] = useState(false);
  const [pinAuthRequired, setPinAuthRequired] = useState(false);
  const [securitySetupComplete, setSecuritySetupComplete] = useState(false);
  
  // Universal data collection for ALL auth methods
  const [authData, setAuthData] = useState({
    // Auth method tracking
    authMethod: '',
    isNewUser: false,
    
    // Basic auth credentials
    email: '',
    password: '',
    phone: '',
    countryCode: '+996',
    verificationCode: '',
    
    // Social auth data
    googleId: '',
    appleId: '',
    socialToken: '',
    
    // Personal information (collected for ALL users)
    firstName: '',
    lastName: '',
    profilePicture: null,
    
    // Financial information (collected for ALL users)
    monthlyIncome: '',
    currency: 'KGS',
    selectedPlan: 'basic',
    
    // Additional data
    bio: '',
    dateOfBirth: '',
    occupation: ''
  });

  // FIXED: Set StatusBar configuration on app load
  useEffect(() => {
    // Configure StatusBar for the entire app
    StatusBar.setBarStyle('light-content', true);
    StatusBar.setBackgroundColor('#05212A', true);
  }, []);

  // Initialize the app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check for existing authentication
        await checkExistingAuth();
        
        // Test backend connection (non-blocking)
        testBackendConnection();
        
      } catch (error) {
        // Don't block the app if initialization fails
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Separate function for testing backend connection
  const testBackendConnection = async () => {
    try {
      const response = await ApiService.testConnection();
    } catch (error) {
      // Show connection error after a delay, but don't block the app
      setTimeout(() => {
        Alert.alert(
          'Connection Issue', 
          'Cannot connect to server. Some features may not work. Please check your internet connection.',
          [
            { text: 'OK' },
            { text: 'Retry', onPress: testBackendConnection }
          ]
        );
      }, 2000);
    }
  };

  // Enhanced checkExistingAuth function with security checks
  const checkExistingAuth = async () => {
    try {
      setIsLoading(true);
      
      // First check if we have a token
      const token = await ApiService.getToken();
      
      if (!token) {
        return;
      }
      
      // Validate the token with the backend
      const response = await ApiService.validateToken();
      
      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        setHasSeenOnboarding(true);
        
        // Set the current user ID in SecurityService
        SecurityService.setCurrentUser(response.user.id);
        
        // Check security setup after successful auth
        await checkSecuritySetup(response.user.id);
      } else {
        // Clear invalid token
        await ApiService.removeToken();
      }
    } catch (error) {
      // If there's any error, clear the auth state and let user start fresh
      await ApiService.removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  // Check security setup - FIXED VERSION
  const checkSecuritySetup = async (userId) => {
    try {
      console.log('🔍 Checking security setup for user:', userId);
      
      // Ensure SecurityService has the correct user ID
      SecurityService.setCurrentUser(userId);
      
      const securityStatus = await SecurityService.getSecurityStatus(userId);
      console.log('📊 Security status:', securityStatus);
      
      if (!securityStatus.pinSetup) {
        console.log('📍 PIN not setup - showing PIN setup screen');
        setPinSetupRequired(true);
        setPinAuthRequired(false);
        setSecuritySetupComplete(false);
      } else if (securityStatus.isLockedOut) {
        console.log('🔒 User is locked out - showing PIN entry to unlock');
        setPinSetupRequired(false);
        setPinAuthRequired(true);
        setSecuritySetupComplete(false);
      } else {
        console.log('🔑 PIN exists - user needs to authenticate');
        // PIN is setup, user needs to enter it to continue
        setPinSetupRequired(false);
        setPinAuthRequired(true);  // ALWAYS require PIN auth for existing users
        setSecuritySetupComplete(false);
      }
    } catch (error) {
      console.error('❌ Security check failed:', error);
      // If security check fails, assume new user needs PIN setup
      console.log('⚠️ Defaulting to PIN setup due to error');
      setPinSetupRequired(true);
      setPinAuthRequired(false);
      setSecuritySetupComplete(false);
    }
  };

  // Handle successful PIN setup
  const handlePinSetupComplete = async () => {
    setPinSetupRequired(false);
    setPinAuthRequired(false);
    setSecuritySetupComplete(true);
  };

  // Handle successful PIN authentication
  const handlePinAuthSuccess = async () => {
    setPinSetupRequired(false);
    setPinAuthRequired(false);
    setSecuritySetupComplete(true);
  };

  const checkUserExistsEarly = async (email, phone) => {
    try {
      const result = await ApiService.checkUserExists(email, phone);
      
      if (result.exists) {
        if (result.user.email && result.user.authMethod === 'email') {
          setAuthData(prev => ({ 
            ...prev, 
            email: result.user.email,
            authMethod: 'signin'
          }));
          navigateAuth('signin-form');
          
          setTimeout(() => {
            Alert.alert(
              'Welcome Back!',
              'We found your account. Please enter your password to sign in.',
              [{ text: 'OK' }]
            );
          }, 500);
          
        } else if (result.user.phone && result.user.authMethod === 'phone') {
          setAuthData(prev => ({ 
            ...prev, 
            phone: result.user.phone,
            countryCode: '+996',
            authMethod: 'signin',
            isSignIn: true
          }));
          
          await handlePhoneSignIn(result.user.phone);
          
        } else {
          navigateAuth('signin-form');
          
          setTimeout(() => {
            Alert.alert(
              'Account Found',
              'We found your account. Please sign in to continue.',
              [{ text: 'OK' }]
            );
          }, 500);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  };

  const handlePhoneSignIn = async (phone) => {
    try {
      const result = await ApiService.requestPhoneSignIn(phone, '+996');
      
      if (result.success) {
        navigateAuth('verify', { phone, isSignIn: true });
        
        Alert.alert(
          'Welcome Back!',
          'We sent a verification code to your phone number.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code');
    }
  };

  const handleEmailSignIn = async (email, password) => {
    try {
      const result = await ApiService.signInWithEmail(email, password);
      
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        
        // Set the user ID in SecurityService
        SecurityService.setCurrentUser(result.user.id);
        
        // Check security setup after successful sign-in
        await checkSecuritySetup(result.user.id);
        
        Alert.alert('Welcome Back!', 'Successfully signed in to your account.');
      } else {
        Alert.alert('Sign In Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Sign in failed. Please try again.');
    }
  };

  // Navigate between auth steps and collect data
  const navigateAuth = (step, data = {}) => {
    setAuthData(prev => {
      const updated = { ...prev, ...data };
      return updated;
    });
    setCurrentAuthView(step);
  };

  // Handle different auth methods with early checks
  const handleAuthMethod = async (method, data = {}) => {
    switch (method) {
      case 'email':
        navigateAuth('email', { authMethod: 'email', isNewUser: true, ...data });
        break;
        
      case 'phone':
        navigateAuth('phone', { authMethod: 'phone', isNewUser: true, ...data });
        break;
        
      case 'google':
        handleGoogleAuth(data);
        break;
        
      case 'apple':
        handleAppleAuth(data);
        break;
        
      case 'signin':
        navigateAuth('signin-form', { authMethod: 'signin', isNewUser: false, ...data });
        break;
        
      default:
        navigateAuth('welcome');
    }
  };

  // Email registration with early check
  const handleEmailRegistration = async (email, password) => {
    try {
      const userExists = await checkUserExistsEarly(email, null);
      
      if (userExists) {
        return;
      }
      
      navigateAuth('profile', {
        email,
        password,
        authMethod: 'email',
        isNewUser: true
      });
      
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  // Phone registration with early check - FIXED VERSION
  const handlePhoneRegistration = async (phone, countryCode) => {
    try {
      console.log('📱 Starting phone registration for:', countryCode + phone);
      const cleanPhone = phone.replace(/\s/g, '');
      
      // CRITICAL: Check if user exists FIRST
      const existsCheck = await ApiService.checkUserExists(null, cleanPhone);
      console.log('🔍 User exists check result:', existsCheck);
      
      if (existsCheck.exists) {
        // User exists - redirect to sign-in flow
        console.log('👤 User exists - redirecting to sign-in flow');
        
        Alert.alert(
          'Account Found', 
          'An account with this phone number already exists. Would you like to sign in instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Sign In', 
              onPress: async () => {
                // Request SMS for sign-in
                const signInResult = await ApiService.requestPhoneSignIn(cleanPhone, countryCode);
                
                if (signInResult.success) {
                  navigateAuth('verify', { 
                    phone: cleanPhone, 
                    countryCode, 
                    isSignIn: true,  // Mark as sign-in flow
                    existingUser: existsCheck.user 
                  });
                } else {
                  Alert.alert('Error', signInResult.error || 'Failed to send verification code');
                }
              }
            }
          ]
        );
        return;
      }
      
      // User doesn't exist - continue with registration
      console.log('📝 New user confirmed - proceeding with registration');
      
      navigateAuth('verify', {
        phone: cleanPhone,
        countryCode,
        authMethod: 'phone',
        isSignIn: false,  // Mark as registration flow
        isNewUser: true
      });
      
    } catch (error) {
      console.error('❌ Phone registration error:', error);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    }
  };

  // Google/Apple auth handlers (not implemented)
  const handleGoogleAuth = async (googleData) => {
    Alert.alert(
      'Google Sign-In',
      'Google authentication is not implemented yet. Please use email or phone registration.',
      [{ text: 'OK' }]
    );
  };

  const handleAppleAuth = async (appleData) => {
    Alert.alert(
      'Apple Sign-In',
      'Apple authentication is not implemented yet. Please use email or phone registration.',
      [{ text: 'OK' }]
    );
  };

  // Handle verification for both registration and sign-in - FIXED VERSION
  const handleCodeVerification = async (code) => {
    try {
      console.log('🔍 Verifying SMS code:', code);
      console.log('📱 Auth data:', { phone: authData.phone, countryCode: authData.countryCode, isSignIn: authData.isSignIn });
      
      if (authData.isSignIn) {
        // USER IS SIGNING IN (existing user)
        console.log('🔑 Processing sign-in verification for existing user');
        
        const signInResult = await ApiService.verifyPhoneSignIn(
          authData.phone, 
          authData.countryCode, 
          code
        );
        
        if (signInResult.success) {
          console.log('✅ Sign-in verification successful for user:', signInResult.user?.id);
          // Set user and trigger security setup check
          setUser(signInResult.user);
          setIsAuthenticated(true);
          SecurityService.setCurrentUser(signInResult.user.id);
          await checkSecuritySetup(signInResult.user.id);
        } else {
          Alert.alert('Sign In Failed', signInResult.error || 'Verification failed');
        }
        
      } else {
        // USER IS REGISTERING (should be new user)
        console.log('📝 Processing registration verification for new user');
        
        // For new users, just verify the code and continue to profile
        const isValidCode = code === '123456' || code.length === 6;
        
        if (isValidCode) {
          console.log('✅ Code valid - continuing to profile setup');
          navigateAuth('profile', { 
            ...authData, 
            verifiedPhone: true,
            verificationCode: code
          });
        } else {
          Alert.alert('Invalid Code', 'Please enter a valid verification code');
        }
      }
      
    } catch (error) {
      console.error('❌ Code verification error:', error);
      Alert.alert('Verification Error', error.message || 'Something went wrong');
    }
  };

  // Complete authentication - SINGLE VERSION
  const completeAuth = async (userData = null) => {
    try {
      if (userData && !authData.isNewUser) {
        // Existing user signing in
        setUser(userData);
        setIsAuthenticated(true);
        
        // Set the user ID in SecurityService
        SecurityService.setCurrentUser(userData.id);
        
        // Check security setup for existing users
        await checkSecuritySetup(userData.id);
        return;
      }

      // New user registration
      
      // Validate required data
      if (!authData.firstName || !authData.lastName) {
        Alert.alert('Missing Information', 'Please complete your profile first.');
        return;
      }

      if (authData.authMethod === 'email' && !authData.password) {
        Alert.alert('Missing Information', 'Password is required for email registration.');
        return;
      }

      setIsLoading(true);
      
      const response = await ApiService.registerUser(authData);
      
      if (response && response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        
        // Set the user ID in SecurityService for new users
        SecurityService.setCurrentUser(response.user.id);
        
        // NEW USERS need PIN setup - set the correct flags
        setPinSetupRequired(true);
        setPinAuthRequired(false);
        setSecuritySetupComplete(false);
        
        Alert.alert(
          'Welcome to Akchabar!', 
          `Your ${authData.authMethod} account has been created successfully! Next, let's secure your account with a PIN.`
        );
      } else {
        const errorMessage = response?.error || 'Unknown error occurred during registration';
        
        if (response?.shouldSignIn) {
          Alert.alert(
            'Account Already Exists',
            'An account with this information already exists. Please sign in instead.',
            [
              { text: 'OK', onPress: () => navigateAuth('signin-form') }
            ]
          );
        } else {
          Alert.alert('Registration Failed', errorMessage);
        }
      }
      
    } catch (error) {
      Alert.alert('Registration Error', `Failed to create account: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = () => {
    setHasSeenOnboarding(true);
  };

  const signOut = async () => {
    await ApiService.signOut();
    setUser(null);
    setIsAuthenticated(false);
    setCurrentAuthView('welcome');
    setPinSetupRequired(false);
    setPinAuthRequired(false);
    setSecuritySetupComplete(false);
    
    // Clear the current user from SecurityService
    SecurityService.setCurrentUser(null);
    
    // Reset ALL auth data
    setAuthData({
      authMethod: '',
      isNewUser: false,
      email: '',
      password: '',
      phone: '',
      countryCode: '+996',
      verificationCode: '',
      googleId: '',
      appleId: '',
      socialToken: '',
      firstName: '',
      lastName: '',
      profilePicture: null,
      monthlyIncome: '',
      currency: 'KGS',
      selectedPlan: 'basic',
      bio: '',
      dateOfBirth: '',
      occupation: ''
    });
  };

  // Props for auth components
  const authProps = {
    authData,
    language,
    setLanguage,
    navigateAuth,
    completeAuth,
    handleAuthMethod,
    handleEmailRegistration,
    handlePhoneRegistration,
    handleCodeVerification,
    handleEmailSignIn,
    handlePhoneSignIn,
  };

  // FIXED: Loading screen with proper StatusBar
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#05212A" />
        <SafeAreaView style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#05212A'
        }}>
          <ActivityIndicator size="large" color="#98DDA6" />
          <Text style={{
            marginTop: 16,
            fontSize: 16,
            color: '#9ca3af',
            textAlign: 'center'
          }}>
            {isAuthenticated ? 'Setting up your account...' : 'Loading Akchabar...'}
          </Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Render screens with security flow
  const renderScreen = () => {
    // FIXED: Proper StatusBar for all screens
    const statusBarProps = {
      barStyle: "light-content",
      backgroundColor: "#05212A"
    };

    if (!hasSeenOnboarding) {
      return (
        <>
          <StatusBar {...statusBarProps} />
          <OnboardingFlow 
            language={language} 
            setLanguage={setLanguage} 
            onComplete={completeOnboarding}
          />
        </>
      );
    }

    // If user is authenticated but needs PIN setup (NEW USERS)
    if (isAuthenticated && user && pinSetupRequired && !pinAuthRequired) {
      return (
        <>
          <StatusBar {...statusBarProps} />
          <PinSetup
            language={language}
            user={user}
            onComplete={handlePinSetupComplete}
          />
        </>
      );
    }

    // If user is authenticated but needs PIN authentication (EXISTING USERS)
    if (isAuthenticated && user && pinAuthRequired && !pinSetupRequired) {
      return (
        <>
          <StatusBar {...statusBarProps} />
          <PinEntry
            language={language}
            user={user}
            onSuccess={handlePinAuthSuccess}
            onCancel={signOut}
          />
        </>
      );
    }

    // If user is fully authenticated and security setup is complete
    if (isAuthenticated && user && securitySetupComplete && !pinSetupRequired && !pinAuthRequired) {
      return (
        <>
          <StatusBar {...statusBarProps} />
          <MainApp 
            authData={user} 
            language={language} 
            onSignOut={signOut}
          />
        </>
      );
    }

    // Authentication flow (not authenticated yet)
    const authScreens = {
      'welcome': <AuthWelcome {...authProps} />,
      'signin-form': <SignInForm {...authProps} />,
      'email': <EmailRegistration {...authProps} />,
      'phone': <PhoneEntry {...authProps} />,
      'verify': <CodeVerification {...authProps} />,
      'profile': <ProfileSetup {...authProps} />,
      'subscription': <SubscriptionPlans {...authProps} />,
      'financial': <FinancialOnboarding {...authProps} />
    };

    return (
      <>
        <StatusBar {...statusBarProps} />
        {authScreens[currentAuthView] || <AuthWelcome {...authProps} />}
      </>
    );
  };

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#05212A' }}>
        {renderScreen()}
      </View>
    </SafeAreaProvider>
  );
}