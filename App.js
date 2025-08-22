// App.js - UPDATED with PIN Security Flow
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert, View, Text, ActivityIndicator } from 'react-native';

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

  // Initialize the app
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Initializing Akchabar app...');
      
      try {
        // Check for existing authentication
        await checkExistingAuth();
        
        // Test backend connection (non-blocking)
        testBackendConnection();
        
      } catch (error) {
        console.error('❌ App initialization error:', error);
        // Don't block the app if initialization fails
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Separate function for testing backend connection
  const testBackendConnection = async () => {
    try {
      console.log('🔍 Testing backend connection...');
      const response = await ApiService.testConnection();
      console.log('✅ Backend connection successful:', response);
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      
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
      console.log('🔍 Checking existing authentication...');
      setIsLoading(true);
      
      // First check if we have a token
      const token = await ApiService.getToken();
      
      if (!token) {
        console.log('📝 No existing token found - showing onboarding/auth');
        return;
      }
      
      console.log('🎫 Found existing token, validating...');
      
      // Validate the token with the backend
      const response = await ApiService.validateToken();
      
      if (response.success && response.user) {
        console.log('✅ Token valid, user authenticated:', response.user.firstName || 'User');
        setUser(response.user);
        setIsAuthenticated(true);
        setHasSeenOnboarding(true);
        
        // Check security setup after successful auth
        await checkSecuritySetup();
      } else {
        console.log('❌ Token invalid or expired, clearing auth state');
        // Clear invalid token
        await ApiService.removeToken();
      }
    } catch (error) {
      console.log('⚠️ Auth check failed (this is normal for new users):', error.message);
      
      // If there's any error, clear the auth state and let user start fresh
      await ApiService.removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user needs to setup PIN or authenticate with PIN
  const checkSecuritySetup = async () => {
    try {
      console.log('🔒 Checking security setup status...');
      
      const securityStatus = await SecurityService.getSecurityStatus();
      console.log('🔒 Security status:', securityStatus);
      
      if (!securityStatus.pinSetup) {
        console.log('📌 PIN setup required for new user');
        setPinSetupRequired(true);
        setSecuritySetupComplete(false);
      } else if (securityStatus.isLockedOut) {
        console.log('🔒 Account is locked out');
        setPinAuthRequired(true);
        setSecuritySetupComplete(false);
      } else {
        // PIN is setup, check if we need to authenticate
        const pinAuthNeeded = await SecurityService.requiresPinAuth();
        if (pinAuthNeeded.required) {
          console.log('🔑 PIN authentication required');
          setPinAuthRequired(true);
          setSecuritySetupComplete(false);
        } else {
          console.log('✅ Security setup complete');
          setSecuritySetupComplete(true);
        }
      }
    } catch (error) {
      console.error('❌ Security check failed:', error);
      // If security check fails, require PIN setup for safety
      setPinSetupRequired(true);
      setSecuritySetupComplete(false);
    }
  };

  // Handle successful PIN setup
  const handlePinSetupComplete = async () => {
    console.log('✅ PIN setup completed');
    setPinSetupRequired(false);
    setSecuritySetupComplete(true);
  };

  // Handle successful PIN authentication
  const handlePinAuthSuccess = async () => {
    console.log('✅ PIN authentication successful');
    setPinAuthRequired(false);
    setSecuritySetupComplete(true);
  };

  // ===== EXISTING AUTH METHODS (unchanged) =====
  
  const checkUserExistsEarly = async (email, phone) => {
    try {
      console.log('🔍 Early user existence check for:', { email, phone });
      
      const result = await ApiService.checkUserExists(email, phone);
      
      if (result.exists) {
        console.log('👤 User already exists:', result.user);
        
        if (result.user.email && result.user.authMethod === 'email') {
          console.log('📧 Redirecting to email sign-in');
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
          console.log('📱 Redirecting to phone sign-in');
          setAuthData(prev => ({ 
            ...prev, 
            phone: result.user.phone,
            countryCode: '+996',
            authMethod: 'signin',
            isSignIn: true
          }));
          
          await handlePhoneSignIn(result.user.phone);
          
        } else {
          console.log('🔄 General redirect to sign-in');
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
      
      console.log('✅ User does not exist - can proceed with registration');
      return false;
    } catch (error) {
      console.error('❌ Early user check failed:', error);
      return false;
    }
  };

  const handlePhoneSignIn = async (phone) => {
    try {
      console.log('📱 Starting phone sign-in for:', phone);
      const result = await ApiService.requestPhoneSignIn(phone, '+996');
      
      if (result.success) {
        console.log('✅ SMS sent for sign-in');
        navigateAuth('verify', { phone, isSignIn: true });
        
        Alert.alert(
          'Welcome Back!',
          'We sent a verification code to your phone number.',
          [{ text: 'OK' }]
        );
      } else {
        console.error('❌ Phone sign-in request failed:', result.error);
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('❌ Phone sign-in error:', error);
      Alert.alert('Error', 'Failed to send verification code');
    }
  };

  const handleEmailSignIn = async (email, password) => {
    try {
      console.log('📧 Starting email sign-in for:', email);
      
      const result = await ApiService.signInWithEmail(email, password);
      
      if (result.success) {
        console.log('✅ Email sign-in successful:', result.user);
        setUser(result.user);
        setIsAuthenticated(true);
        
        // Check security setup after successful sign-in
        await checkSecuritySetup();
        
        Alert.alert('Welcome Back!', 'Successfully signed in to your account.');
      } else {
        console.error('❌ Email sign-in failed:', result.error);
        Alert.alert('Sign In Failed', result.error);
      }
    } catch (error) {
      console.error('❌ Email sign-in error:', error);
      Alert.alert('Error', 'Sign in failed. Please try again.');
    }
  };

  // Navigate between auth steps and collect data
  const navigateAuth = (step, data = {}) => {
    console.log('🔄 Collecting data for step:', step, data);
    setAuthData(prev => {
      const updated = { ...prev, ...data };
      console.log('📊 Updated authData:', updated);
      return updated;
    });
    setCurrentAuthView(step);
  };

  // Handle different auth methods with early checks
  const handleAuthMethod = async (method, data = {}) => {
    console.log(`🔐 Starting ${method} authentication`);
    
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
      console.log('📧 handleEmailRegistration called with:', { email });
      
      const userExists = await checkUserExistsEarly(email, null);
      console.log('📋 User existence check result:', userExists);
      
      if (userExists) {
        console.log('👤 User exists - redirected to sign-in');
        return;
      }
      
      console.log('✅ User does not exist - proceeding to profile setup');
      navigateAuth('profile', {
        email,
        password,
        authMethod: 'email',
        isNewUser: true
      });
      
    } catch (error) {
      console.error('❌ Email registration error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  // Phone registration with early check
  const handlePhoneRegistration = async (phone, countryCode) => {
    try {
      console.log('📱 handlePhoneRegistration called with:', { phone, countryCode });
      
      const cleanPhone = phone.replace(/\s/g, '');
      console.log('🔍 Checking if user exists with phone:', cleanPhone);
      
      const userExists = await checkUserExistsEarly(null, cleanPhone);
      console.log('📋 User existence check result:', userExists);
      
      if (userExists) {
        console.log('👤 User exists - redirected to sign-in');
        return;
      }
      
      console.log('✅ User does not exist - proceeding with SMS verification');
      navigateAuth('verify', {
        phone,
        countryCode,
        authMethod: 'phone',
        isNewUser: true
      });
      
    } catch (error) {
      console.error('❌ Phone registration error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
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

  // Handle verification for both registration and sign-in
  const handleCodeVerification = async (code) => {
    try {
      console.log('🔓 Verifying code:', code);
      
      if (authData.isSignIn) {
        // This is a sign-in verification
        console.log('📱 Phone sign-in verification for:', authData.phone);
        
        const cleanPhone = authData.phone.replace(/\s/g, '');
        const result = await ApiService.verifyPhoneSignIn(
          cleanPhone, 
          authData.countryCode, 
          code
        );
        
        if (result.success) {
          console.log('✅ Phone sign-in successful:', result.user);
          setUser(result.user);
          setIsAuthenticated(true);
          
          // Check security setup after successful sign-in
          await checkSecuritySetup();
          
          Alert.alert('Welcome Back!', 'Successfully signed in with your phone number.');
        } else {
          console.error('❌ Phone sign-in failed:', result.error);
          Alert.alert('Verification Failed', result.error);
        }
      } else {
        // This is a registration verification - proceed to profile
        console.log('🔓 Registration verification - proceeding to profile');
        navigateAuth('profile', { verificationCode: code });
      }
    } catch (error) {
      console.error('❌ Verification error:', error);
      Alert.alert('Verification Error', error.message);
    }
  };

  // Complete authentication
  const completeAuth = async (userData = null) => {
    try {
      console.log('🚀 Starting completeAuth...');
      
      if (userData && !authData.isNewUser) {
        // Existing user signing in
        console.log('✅ Existing user signed in');
        setUser(userData);
        setIsAuthenticated(true);
        
        // Check security setup for existing users
        await checkSecuritySetup();
        return;
      }

      // New user registration
      console.log('💾 Starting new user registration...');
      console.log('📊 Current authData:', authData);
      
      // Validate required data
      if (!authData.firstName || !authData.lastName) {
        console.error('❌ Missing name information');
        Alert.alert('Missing Information', 'Please complete your profile first.');
        return;
      }

      if (authData.authMethod === 'email' && !authData.password) {
        console.error('❌ Missing password for email registration');
        Alert.alert('Missing Information', 'Password is required for email registration.');
        return;
      }

      setIsLoading(true);
      
      console.log('📤 Sending registration request...');
      const response = await ApiService.registerUser(authData);
      console.log('📥 Registration response received:', response);
      
      if (response && response.success) {
        console.log('✅ Registration successful!');
        console.log('👤 User data:', response.user);
        
        setUser(response.user);
        setIsAuthenticated(true);
        
        // New users need PIN setup
        setPinSetupRequired(true);
        setSecuritySetupComplete(false);
        
        Alert.alert(
          'Welcome to Akchabar!', 
          `Your ${authData.authMethod} account has been created successfully!`
        );
      } else {
        console.error('❌ Registration failed:', response);
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
      console.error('❌ Complete auth error:', error);
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

  // Loading screen
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={{
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
        </View>
      </SafeAreaProvider>
    );
  }

  // Render screens with security flow
  const renderScreen = () => {
    if (!hasSeenOnboarding) {
      return (
        <OnboardingFlow 
          language={language} 
          setLanguage={setLanguage} 
          onComplete={completeOnboarding}
        />
      );
    }

    // If user is authenticated but needs PIN setup
    if (isAuthenticated && user && pinSetupRequired) {
      return (
        <PinSetup
          language={language}
          user={user}
          onComplete={handlePinSetupComplete}
        />
      );
    }

    // If user is authenticated but needs PIN authentication
    if (isAuthenticated && user && pinAuthRequired) {
      return (
        <PinEntry
          language={language}
          user={user}
          onSuccess={handlePinAuthSuccess}
          onCancel={signOut}
        />
      );
    }

    // If user is fully authenticated and security setup is complete
    if (isAuthenticated && user && securitySetupComplete) {
      return (
        <MainApp 
          authData={user} 
          language={language} 
          onSignOut={signOut}
        />
      );
    }

    // Authentication flow
    switch (currentAuthView) {
      case 'welcome':
        return <AuthWelcome {...authProps} />;
      case 'signin-form':
        return <SignInForm {...authProps} />;
      case 'email':
        return <EmailRegistration {...authProps} />;
      case 'phone':
        return <PhoneEntry {...authProps} />;
      case 'verify':
        return <CodeVerification {...authProps} />;
      case 'profile':
        return <ProfileSetup {...authProps} />;
      case 'subscription':
        return <SubscriptionPlans {...authProps} />;
      case 'financial':
        return <FinancialOnboarding {...authProps} />;
      default:
        return <AuthWelcome {...authProps} />;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      {renderScreen()}
    </SafeAreaProvider>
  );
}