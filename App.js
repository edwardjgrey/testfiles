// App.js - Enhanced with proper setup offer handling
import React, { useState, useEffect } from 'react';
import { View, Alert, ActivityIndicator, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Onboarding & Auth Components
import OnboardingFlow from './src/components/onboarding/OnboardingFlow';
import AuthWelcome from './src/components/auth/AuthWelcome';
import PhoneEntry from './src/components/auth/PhoneEntry';
import EmailRegistration from './src/components/auth/EmailRegistration';
import CodeVerification from './src/components/auth/CodeVerification';
import ProfileSetup from './src/components/auth/ProfileSetup';
import SubscriptionPlans from './src/components/auth/SubscriptionPlans';
import FinancialOnboarding from './src/components/auth/FinancialOnboarding';
import GoalsSetup from './src/components/auth/GoalsSetup';
import SignInForm from './src/components/auth/SignInForm';
import PinSetup from './src/components/auth/PinSetup';
import PinEntry from './src/components/auth/PinEntry';
import BiometricSetupOffer from './src/components/auth/BiometricSetupOffer';

// Main App Components
import MainApp from './src/components/MainApp';

// Services
import ApiService from './src/services/apiService';
import SecurityService from './src/services/securityService';
import BiometricService from './src/services/biometricService';
import SubscriptionService from './src/services/subscriptionService';

export default function App() {
  // Core states
  const [loading, setLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requiresPinAuth, setRequiresPinAuth] = useState(false);
  const [language, setLanguage] = useState('en');
  
  // Auth flow states
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [authData, setAuthData] = useState({});
  const [userData, setUserData] = useState(null);


  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing Akchabar...');
      
      // Check if first launch
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      const savedLanguage = await AsyncStorage.getItem('appLanguage');
      
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
      
      if (!hasLaunched) {
        setIsFirstLaunch(true);
        setLoading(false);
        return;
      }
      
      // Check authentication
      const authResult = await checkAuthentication();
      
      if (authResult.authenticated) {
        setUserData(authResult.user);
        
        // Check what setup offers to show for returning user
        await checkSetupOffers(authResult.user);
        
        // Check if PIN authentication is required
        const pinRequired = await checkPinRequirement(authResult.user);
        
        if (pinRequired) {
          setRequiresPinAuth(true);
        } else {
          setIsAuthenticated(true);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Initialization error:', error);
      setLoading(false);
    }
  };

  // Check what setup offers should be shown (NEW)
  const checkSetupOffers = async (user) => {
    try {
      console.log('🔍 Checking setup offers for returning user:', user.id);
      
      const offers = {
        biometric: false,
        subscription: false,
        financial: false,
        goals: false,
        security: false
      };
      
      // Check biometric setup
      const biometricInfo = await BiometricService.getBiometricInfo(user.id);
      if (biometricInfo.available && !biometricInfo.isSetup) {
        offers.biometric = true;
        console.log('📱 Biometric setup offer will be shown');
      }
      
      // Check subscription status
      const subscription = await SubscriptionService.getCurrentSubscription();
      if (subscription?.plan_id === 'basic') {
        const usage = await SubscriptionService.getUsageAnalytics();
        
        // Check if user is using features heavily
        if (usage?.transactions_percentage > 70 || usage?.approaching_limits) {
          offers.subscription = true;
          console.log('💎 Subscription upgrade offer will be shown');
        }
      }
      
      // Check incomplete profile setup
      const profileComplete = await checkProfileCompleteness(user);
      if (!profileComplete.financial) {
        offers.financial = true;
        console.log('💰 Financial setup offer will be shown');
      }
      
      if (!profileComplete.goals) {
        offers.goals = true;
        console.log('🎯 Goals setup offer will be shown');
      }
      
      // Check security setup
      const hasPinSetup = await SecurityService.isPinSetup(user.id);
      if (!hasPinSetup) {
        offers.security = true;
        console.log('🔒 Security setup offer will be shown');
      }
      
      setSetupOffers(offers);
      
      // Schedule offers to show after successful authentication
      scheduleSetupOffers(offers);
      
    } catch (error) {
      console.error('Error checking setup offers:', error);
    }
  };

  // Schedule when to show setup offers (NEW)
  const scheduleSetupOffers = (offers) => {
    // Priority order for showing offers
    if (offers.security) {
      // Security is highest priority - show immediately after auth
      setTimeout(() => {
        Alert.alert(
          'Enhance Your Security',
          'Set up a PIN to secure your financial data',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Set Up PIN', onPress: () => handleSecuritySetup() }
          ]
        );
      }, 2000);
    } else if (offers.biometric) {
      // Biometric is second priority
      setTimeout(() => setShowBiometricOffer(true), 1500);
    } else if (offers.subscription && offers.financial) {
      // Show subscription upgrade if approaching limits
      setTimeout(() => setShowPlanUpgradeOffer(true), 3000);
    } else if (offers.financial || offers.goals) {
      // Show incomplete setup reminder
      setTimeout(() => setShowIncompleteSetupOffer(true), 3000);
    }
  };

  // Check profile completeness (NEW)
  const checkProfileCompleteness = async (user) => {
    try {
      const financialData = await AsyncStorage.getItem(`financial_data_${user.id}`);
      const goalsData = await AsyncStorage.getItem(`goals_data_${user.id}`);
      
      return {
        financial: financialData !== null,
        goals: goalsData !== null,
        profile: user.firstName && user.lastName && user.email
      };
    } catch (error) {
      console.error('Error checking profile completeness:', error);
      return { financial: true, goals: true, profile: true };
    }
  };

  const checkAuthentication = async () => {
    try {
      const token = await ApiService.getToken();
      
      if (!token) {
        console.log('No auth token found');
        return { authenticated: false };
      }
      
      const validationResult = await ApiService.validateToken();
      
      if (validationResult.success) {
        console.log('✅ User authenticated:', validationResult.user);
        return { 
          authenticated: true, 
          user: validationResult.user 
        };
      }
      
      return { authenticated: false };
    } catch (error) {
      console.error('Authentication check error:', error);
      return { authenticated: false };
    }
  };

  const checkPinRequirement = async (user) => {
    try {
      if (!user || !user.id) return false;
      
      SecurityService.setCurrentUser(user.id);
      const hasPinSetup = await SecurityService.isPinSetup(user.id);
      
      console.log('PIN setup status for user', user.id, ':', hasPinSetup);
      return hasPinSetup;
    } catch (error) {
      console.error('PIN requirement check error:', error);
      return false;
    }
  };

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem('hasLaunched', 'true');
    setIsFirstLaunch(false);
  };

  const navigateAuth = (screen, data = {}) => {
    console.log('Navigating to:', screen, 'with data:', data);
    setCurrentScreen(screen);
    setAuthData({ ...authData, ...data });
  };

  const handleAuthMethod = (method, data = {}) => {
    console.log('Auth method selected:', method);
    
    switch (method) {
      case 'phone':
        navigateAuth('phone', data);
        break;
      case 'email':
        navigateAuth('email', data);
        break;
      case 'google':
        handleGoogleAuth(data);
        break;
      case 'apple':
        handleAppleAuth(data);
        break;
      case 'signin':
        navigateAuth('signin-form', data);
        break;
      default:
        console.warn('Unknown auth method:', method);
    }
  };

  const handleGoogleAuth = async (googleData) => {
    try {
      if (googleData.isNewUser) {
        navigateAuth('profile', { 
          ...googleData, 
          authMethod: 'google' 
        });
      } else {
        const authResult = await ApiService.signInWithGoogle(googleData);
        if (authResult.success) {
          await completeAuth(authResult.user);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Google authentication failed');
    }
  };

  const handleAppleAuth = async (appleData) => {
    try {
      if (appleData.isNewUser) {
        navigateAuth('profile', { 
          ...appleData, 
          authMethod: 'apple' 
        });
      } else {
        const authResult = await ApiService.signInWithApple(appleData);
        if (authResult.success) {
          await completeAuth(authResult.user);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Apple authentication failed');
    }
  };

const handlePhoneRegistration = async (phone, countryCode) => {
  try {
    // First check if user exists
    const checkResponse = await ApiService.checkUserExists(phone);
    
    if (checkResponse.exists) {
      Alert.alert(
        'Account Exists',
        'This phone number is already registered. Please sign in instead.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sign In', 
            onPress: () => navigateAuth('signin-form', { phone, countryCode })
          }
        ]
      );
      return;
    }
    
    // Continue with registration if user doesn't exist
    navigateAuth('verify', { phone, countryCode });
  } catch (error) {
    console.error('Registration check error:', error);
  }
};

  const handleEmailRegistration = async (email, password) => {
    try {
      console.log('📧 Processing email registration:', email);
      
      const checkResult = await ApiService.checkUserExists(email, null);
      
      if (checkResult.exists) {
        Alert.alert(
          'Account Exists',
          'An account with this email already exists. Would you like to sign in instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Sign In', 
              onPress: () => {
                navigateAuth('signin-form', { email });
              }
            }
          ]
        );
        return;
      }
      
      navigateAuth('profile', { 
        email, 
        password, 
        authMethod: 'email' 
      });
    } catch (error) {
      console.error('Email registration error:', error);
      Alert.alert('Error', 'Failed to process email. Please try again.');
    }
  };

  const handleCodeVerification = async (code) => {
    try {
      console.log('🔓 Verifying code...');
      
      if (authData.isSignIn) {
        const result = await ApiService.verifyPhoneSignIn(
          authData.phone,
          authData.countryCode,
          code
        );
        
        if (result.success) {
          await completeAuth(result.user);
        } else {
          throw new Error(result.error);
        }
      } else {
        navigateAuth('profile', { verificationCode: code });
      }
    } catch (error) {
      console.error('Code verification error:', error);
      throw error;
    }
  };

  const handleEmailSignIn = async (email, password) => {
    try {
      console.log('📧 Processing email sign-in for:', email);
      
      const result = await ApiService.signInWithEmail(email, password);
      
      if (result.success) {
        await completeAuth(result.user);
      } else {
        Alert.alert('Sign In Failed', result.error || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Email sign-in error:', error);
      Alert.alert('Error', 'Failed to sign in. Please try again.');
    }
  };

  const handlePhoneSignIn = async (phone, countryCode) => {
    try {
      console.log('📱 Processing phone sign-in for:', countryCode + phone);
      
      const result = await ApiService.requestPhoneSignIn(phone, countryCode);
      
      if (result.success) {
        navigateAuth('verify', { 
          phone, 
          countryCode, 
          isSignIn: true 
        });
      } else {
        Alert.alert('Error', result.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Phone sign-in error:', error);
      Alert.alert('Error', 'Failed to process sign-in. Please try again.');
    }
  };

  const completeAuth = async (finalData = {}) => {
    try {
      console.log('🎉 Completing authentication...');
      
      const fullUserData = {
        ...authData,
        ...finalData,
        id: finalData.id || authData.id || Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      
      // For new registrations
      if (!authData.isSignIn && !finalData.isExistingUser) {
        console.log('📝 Registering new user...');
        
        const registrationData = {
          authMethod: authData.authMethod || 'phone',
          phone: authData.phone,
          countryCode: authData.countryCode,
          email: authData.email || finalData.email,
          password: authData.password,
          firstName: authData.firstName || finalData.firstName,
          lastName: authData.lastName || finalData.lastName,
          profilePicture: authData.profilePicture,
          verificationCode: authData.verificationCode,
          selectedPlan: authData.selectedPlan || 'basic',
          currency: authData.currency || finalData.currency || 'KGS',
          monthlyIncome: finalData.monthlyIncome,
          additionalIncome: finalData.additionalIncome,
          financialGoals: finalData.financialGoals,
          googleId: authData.googleId,
          appleId: authData.appleId
        };
        
        const result = await ApiService.registerUser(registrationData);
        
        if (result.success) {
          fullUserData.id = result.user.id;
          fullUserData.token = result.token;
        } else {
          throw new Error(result.error || 'Registration failed');
        }
        
        // Setup PIN for new users
        setUserData(fullUserData);
        SecurityService.setCurrentUser(fullUserData.id);
        setCurrentScreen('pin-setup');
        return;
      }
      
      // For existing users signing in
      setUserData(fullUserData);
      await AsyncStorage.setItem('userData', JSON.stringify(fullUserData));
      
      // Check setup offers for returning users
      await checkSetupOffers(fullUserData);
      
      // Check if PIN is required
      const pinRequired = await checkPinRequirement(fullUserData);
      
      if (pinRequired) {
        SecurityService.setCurrentUser(fullUserData.id);
        setRequiresPinAuth(true);
      } else {
        // Show biometric setup offer if available
        if (setupOffers.biometric) {
          setTimeout(() => setShowBiometricOffer(true), 1000);
        }
        setIsAuthenticated(true);
      }
      
      console.log('✅ Authentication completed successfully');
    } catch (error) {
      console.error('❌ Complete auth error:', error);
      Alert.alert('Authentication Error', error.message || 'Failed to complete authentication');
    }
  };

  const handlePinSetupComplete = () => {
    console.log('✅ PIN setup completed');
    setShowBiometricOffer(true);
  };

  const handleBiometricSetupComplete = (enabled) => {
    console.log('✅ Biometric setup completed:', enabled ? 'Enabled' : 'Skipped');
    setShowBiometricOffer(false);
    setIsAuthenticated(true);
    
    // Check for other setup offers
    if (setupOffers.subscription) {
      setTimeout(() => setShowPlanUpgradeOffer(true), 2000);
    } else if (setupOffers.financial || setupOffers.goals) {
      setTimeout(() => setShowIncompleteSetupOffer(true), 2000);
    }
  };

  const handlePinAuthSuccess = () => {
    console.log('✅ PIN authentication successful');
    setRequiresPinAuth(false);
    setIsAuthenticated(true);
    
    // Show setup offers after successful PIN auth
    if (setupOffers.biometric) {
      setTimeout(() => setShowBiometricOffer(true), 1000);
    } else if (setupOffers.subscription) {
      setTimeout(() => setShowPlanUpgradeOffer(true), 2000);
    }
  };

  const handleSignOut = async () => {
    try {
      await ApiService.signOut();
      await AsyncStorage.removeItem('userData');
      
      setIsAuthenticated(false);
      setRequiresPinAuth(false);
      setUserData(null);
      setAuthData({});
      setCurrentScreen('welcome');
      setSetupOffers({
        biometric: false,
        subscription: false,
        financial: false,
        goals: false,
        security: false
      });
      
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Handle security setup (NEW)
  const handleSecuritySetup = () => {
    setCurrentScreen('pin-setup');
  };

  // Render loading screen
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#05212a' }}>
        <ActivityIndicator size="large" color="#98DDA6" />
        <Text style={{ color: '#98DDA6', marginTop: 16 }}>Loading Akchabar...</Text>
      </View>
    );
  }

  // Show onboarding for first launch
  if (isFirstLaunch) {
    return (
      <OnboardingFlow
        language={language}
        setLanguage={setLanguage}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Show PIN authentication if required
  if (requiresPinAuth && userData) {
    return (
      <PinEntry
        language={language}
        onSuccess={handlePinAuthSuccess}
        onCancel={handleSignOut}
        user={userData}
      />
    );
  }

  // Show biometric setup offer for returning users
  if (showBiometricOffer && userData) {
    return (
      <BiometricSetupOffer
        visible={showBiometricOffer}
        onComplete={handleBiometricSetupComplete}
        onSkip={() => handleBiometricSetupComplete(false)}
        user={userData}
        language={language}
      />
    );
  }

  // Show authenticated app
  if (isAuthenticated && userData) {
    return (
      <>
        <MainApp
          authData={userData}
          language={language}
          onSignOut={handleSignOut}
        />
        
        {/* Plan Upgrade Offer Modal (NEW) */}
        {showPlanUpgradeOffer && (
          <PlanUpgradeOffer
            visible={showPlanUpgradeOffer}
            onClose={() => setShowPlanUpgradeOffer(false)}
            onUpgrade={() => {
              setShowPlanUpgradeOffer(false);
              // Navigate to subscription management
            }}
            language={language}
          />
        )}
        
        {/* Incomplete Setup Offer Modal (NEW) */}
        {showIncompleteSetupOffer && (
          <IncompleteSetupOffer
            visible={showIncompleteSetupOffer}
            onClose={() => setShowIncompleteSetupOffer(false)}
            onContinueSetup={(type) => {
              setShowIncompleteSetupOffer(false);
              // Navigate to appropriate setup screen
            }}
            setupOffers={setupOffers}
            language={language}
          />
        )}
      </>
    );
  }

  // Show auth flow screens
  return (
    <View style={{ flex: 1 }}>
      {currentScreen === 'welcome' && (
        <AuthWelcome
          language={language}
          setLanguage={setLanguage}
          handleAuthMethod={handleAuthMethod}
          navigateAuth={navigateAuth}
        />
      )}
      
      {currentScreen === 'phone' && (
        <PhoneEntry
          authData={authData}
          language={language}
          setLanguage={setLanguage}
          navigateAuth={navigateAuth}
          handlePhoneRegistration={handlePhoneRegistration}
        />
      )}
      
      {currentScreen === 'email' && (
        <EmailRegistration
          language={language}
          setLanguage={setLanguage}
          navigateAuth={navigateAuth}
          handleEmailRegistration={handleEmailRegistration}
        />
      )}
      
      {currentScreen === 'verify' && (
        <CodeVerification
          authData={authData}
          language={language}
          setLanguage={setLanguage}
          navigateAuth={navigateAuth}
          handleCodeVerification={handleCodeVerification}
        />
      )}
      
      {currentScreen === 'profile' && (
        <ProfileSetup
          authData={authData}
          language={language}
          setLanguage={setLanguage}
          navigateAuth={navigateAuth}
        />
      )}
      
      {currentScreen === 'subscription' && (
        <SubscriptionPlans
          authData={authData}
          language={language}
          setLanguage={setLanguage}
          navigateAuth={navigateAuth}
        />
      )}
      
      {currentScreen === 'financial' && (
        <FinancialOnboarding
          authData={authData}
          language={language}
          setLanguage={setLanguage}
          navigateAuth={navigateAuth}
          completeAuth={completeAuth}
        />
      )}
      
      {currentScreen === 'goals' && (
        <GoalsSetup
          authData={authData}
          language={language}
          setLanguage={setLanguage}
          navigateAuth={navigateAuth}
          completeAuth={completeAuth}
        />
      )}
      
      {currentScreen === 'signin-form' && (
        <SignInForm
          language={language}
          setLanguage={setLanguage}
          navigateAuth={navigateAuth}
          completeAuth={completeAuth}
          authData={authData}
          handleEmailSignIn={handleEmailSignIn}
          handlePhoneSignIn={handlePhoneSignIn}
        />
      )}
      
      {currentScreen === 'pin-setup' && userData && (
        <PinSetup
          language={language}
          onComplete={handlePinSetupComplete}
          user={userData}
        />
      )}
    </View>
  );
}

// Additional components for setup offers (NEW)

// Plan Upgrade Offer Component
const PlanUpgradeOffer = ({ visible, onClose, onUpgrade, language }) => {
  if (!visible) return null;
  
  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Implementation in separate file */}
    </View>
  );
};

// Incomplete Setup Offer Component  
const IncompleteSetupOffer = ({ visible, onClose, onContinueSetup, setupOffers, language }) => {
  if (!visible) return null;
  
  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Implementation in separate file */}
    </View>
  );
};