// src/services/biometricService.js - REAL BACKEND INTEGRATION WITH iOS FIX
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import ApiService from './apiService';

class BiometricService {
  constructor() {
    this.isInitialized = false;
    this.biometricInfo = null;
  }

  // iOS-ENHANCED: Comprehensive iOS biometric support check
  async isIOSBiometricSupported() {
    if (Platform.OS !== 'ios') {
      return { supported: true }; // Android handled by expo-local-authentication
    }

    try {
      console.log('🍎 Checking iOS biometric support...');
      
      // Check if hardware is available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      console.log('🍎 iOS hasHardware:', hasHardware);
      
      if (!hasHardware) {
        return { 
          supported: false, 
          reason: 'Biometric hardware not available on this device' 
        };
      }

      // Check if biometric is enrolled
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      console.log('🍎 iOS isEnrolled:', isEnrolled);
      
      if (!isEnrolled) {
        return { 
          supported: false, 
          reason: 'No biometric authentication is set up on this device. Please set up Face ID or Touch ID in Settings.' 
        };
      }

      // Check supported authentication types
      const authTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      console.log('🍎 iOS supported auth types:', authTypes);
      
      if (!authTypes || authTypes.length === 0) {
        return { 
          supported: false, 
          reason: 'No biometric authentication methods available' 
        };
      }

      return { supported: true, authTypes };

    } catch (error) {
      console.error('🍎 iOS biometric check error:', error);
      return { 
        supported: false, 
        reason: `iOS biometric check failed: ${error.message}` 
      };
    }
  }

  // REAL BIOMETRIC INFO WITH BACKEND INTEGRATION
  async getBiometricInfo(userId = null) {
    try {
      console.log('🔍 Getting comprehensive biometric info for user:', userId);

      // Check hardware support
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      console.log('📱 Biometric hardware available:', hasHardware);

      if (!hasHardware) {
        return {
          available: false,
          hasHardware: false,
          isEnrolled: false,
          isSetup: false,
          typeName: 'Biometric',
          supportedTypes: [],
          error: 'Biometric hardware not available on this device'
        };
      }

      // Check if user has enrolled biometrics on device
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      console.log('👆 Device biometric enrollment status:', isEnrolled);

      if (!isEnrolled) {
        return {
          available: false,
          hasHardware: true,
          isEnrolled: false,
          isSetup: false,
          typeName: 'Biometric',
          supportedTypes: [],
          error: 'Please set up biometric authentication (Face ID/Touch ID/Fingerprint) in your device settings first'
        };
      }

      // Get supported authentication types
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      console.log('🔐 Supported biometric types:', supportedTypes);

      // Determine primary biometric type name
      let typeName = 'Biometric';
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        typeName = Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        typeName = Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        typeName = 'Iris';
      }

      // Check if biometric is set up for this user in our app
      let isSetupInApp = false;
      if (userId) {
        try {
          const setupKey = `biometric_setup_${userId}`;
          const setupStatus = await AsyncStorage.getItem(setupKey);
          isSetupInApp = setupStatus === 'true';

          // Also check with backend
          const userProfile = await ApiService.getUserProfile(userId);
          const backendSetup = userProfile?.security?.biometricEnabled || false;
          
          // Use backend data if available, otherwise use local
          isSetupInApp = backendSetup || isSetupInApp;
          
          console.log('🔗 Biometric setup status - Local:', setupStatus, 'Backend:', backendSetup);
        } catch (error) {
          console.log('⚠️ Could not check biometric setup status:', error.message);
          // Continue with local check only
        }
      }

      const biometricInfo = {
        available: true,
        hasHardware: true,
        isEnrolled: true,
        isSetup: isSetupInApp,
        typeName,
        supportedTypes,
        userId
      };

      console.log('✅ Biometric info compiled:', biometricInfo);
      this.biometricInfo = biometricInfo;
      this.isInitialized = true;

      return biometricInfo;

    } catch (error) {
      console.error('❌ Get biometric info error:', error);
      return {
        available: false,
        hasHardware: false,
        isEnrolled: false,
        isSetup: false,
        typeName: 'Biometric',
        supportedTypes: [],
        error: error.message || 'Failed to check biometric status'
      };
    }
  }

  // REAL BIOMETRIC AUTHENTICATION
  async authenticateWithBiometric(reason = null, userId = null) {
    try {
      console.log('👆 Starting biometric authentication for user:', userId);

      // iOS-Enhanced: Check iOS support first
      if (Platform.OS === 'ios') {
        const iosSupport = await this.isIOSBiometricSupported();
        if (!iosSupport.supported) {
          return {
            success: false,
            error: iosSupport.reason,
            cancelled: false,
            locked: false
          };
        }
      }

      // Get biometric info if not already available
      if (!this.isInitialized && userId) {
        await this.getBiometricInfo(userId);
      }

      // Determine the appropriate prompt message
      const biometricType = this.biometricInfo?.typeName || 'biometric';
      const promptReason = reason || `Use ${biometricType} to authenticate`;

      console.log('🔐 Prompting biometric with reason:', promptReason);

      // Perform biometric authentication
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: promptReason,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use PIN instead',
        requireConfirmation: Platform.OS === 'android', // iOS handles this automatically
        disableDeviceFallback: false // Allow device PIN fallback
      });

      console.log('📊 Biometric auth result:', authResult);

      if (authResult.success) {
        console.log('✅ Biometric authentication successful');

        // Generate a secure biometric token for backend verification
        const biometricToken = await this.generateBiometricToken(userId);

        return {
          success: true,
          biometricToken,
          authResult
        };
      } else if (authResult.error === 'user_cancel' || authResult.error === 'app_cancel') {
        console.log('🚫 Biometric authentication cancelled by user');
        return {
          success: false,
          cancelled: true,
          error: 'Authentication was cancelled'
        };
      } else if (authResult.error === 'lockout' || authResult.error === 'lockout_permanent') {
        console.log('🔒 Biometric authentication locked out');
        return {
          success: false,
          locked: true,
          error: 'Biometric authentication is temporarily disabled due to too many failed attempts'
        };
      } else {
        console.log('❌ Biometric authentication failed:', authResult.error);
        return {
          success: false,
          error: this.translateBiometricError(authResult.error),
          cancelled: false,
          locked: false
        };
      }

    } catch (error) {
      console.error('❌ Biometric authentication error:', error);
      return {
        success: false,
        error: error.message || 'Biometric authentication failed',
        cancelled: false,
        locked: false
      };
    }
  }

  // REAL BIOMETRIC SETUP WITH BACKEND
  async setupBiometric(userId) {
    try {
      console.log('🔧 Setting up biometric authentication for user:', userId);

      if (!userId) {
        throw new Error('User ID is required for biometric setup');
      }

      // First verify that biometrics are available
      const biometricInfo = await this.getBiometricInfo(userId);
      if (!biometricInfo.available) {
        return {
          success: false,
          error: biometricInfo.error || 'Biometric authentication is not available'
        };
      }

      // Test biometric authentication
      const authResult = await this.authenticateWithBiometric(
        `Set up ${biometricInfo.typeName} for Akchabar`,
        userId
      );

      if (!authResult.success) {
        return {
          success: false,
          cancelled: authResult.cancelled,
          error: authResult.error || 'Biometric setup verification failed'
        };
      }

      // Generate and store biometric credentials
      const biometricCredentials = await this.generateBiometricCredentials(userId);

      // Save to backend
      try {
        const backendResponse = await ApiService.setupBiometric(userId, {
          biometricEnabled: true,
          biometricType: biometricInfo.typeName,
          credentialHash: biometricCredentials.hash,
          setupDate: new Date().toISOString()
        });

        if (!backendResponse.success) {
          throw new Error(backendResponse.error || 'Backend setup failed');
        }

        console.log('✅ Backend biometric setup successful');
      } catch (backendError) {
        console.error('⚠️ Backend biometric setup failed:', backendError);
        // Continue with local setup, but log the issue
        // In production, you might want to fail here
      }

      // Store locally
      await AsyncStorage.multiSet([
        [`biometric_setup_${userId}`, 'true'],
        [`biometric_type_${userId}`, biometricInfo.typeName],
        [`biometric_credentials_${userId}`, JSON.stringify(biometricCredentials)]
      ]);

      console.log('✅ Biometric setup completed successfully');

      return {
        success: true,
        biometricType: biometricInfo.typeName
      };

    } catch (error) {
      console.error('❌ Biometric setup error:', error);
      return {
        success: false,
        error: error.message || 'Failed to setup biometric authentication'
      };
    }
  }

  // Generate secure biometric token for API calls
  async generateBiometricToken(userId) {
    try {
      const timestamp = Date.now().toString();
      const randomData = Math.random().toString(36).substring(2);
      const deviceId = Platform.OS; // In production, use a real device ID
      
      const tokenData = `${userId}:${timestamp}:${randomData}:${deviceId}`;
      
      const token = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        tokenData,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      console.log('🔑 Generated biometric token');
      return token;
    } catch (error) {
      console.error('❌ Token generation failed:', error);
      throw new Error('Failed to generate secure biometric token');
    }
  }

  // Generate biometric credentials for storage
  async generateBiometricCredentials(userId) {
    try {
      const timestamp = Date.now().toString();
      const randomKey = Math.random().toString(36).substring(2);
      
      const credentialData = `${userId}:${timestamp}:${randomKey}`;
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        credentialData,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      return {
        hash,
        timestamp,
        userId
      };
    } catch (error) {
      console.error('❌ Credential generation failed:', error);
      throw new Error('Failed to generate biometric credentials');
    }
  }

  // Translate biometric errors to user-friendly messages
  translateBiometricError(error) {
    const errorMap = {
      'not_available': 'Biometric authentication is not available',
      'not_enrolled': 'No biometric authentication is set up on this device',
      'lockout': 'Too many failed attempts. Please try again later',
      'lockout_permanent': 'Biometric authentication has been permanently disabled',
      'user_cancel': 'Authentication was cancelled',
      'app_cancel': 'Authentication was cancelled by the app',
      'invalid_context': 'Invalid authentication context',
      'not_interactive': 'Authentication requires user interaction',
      'passcode_not_set': 'Device passcode is not set up'
    };

    return errorMap[error] || `Biometric authentication failed: ${error}`;
  }

  // DISABLE BIOMETRIC
  async disableBiometric(userId) {
    try {
      console.log('🔧 Disabling biometric authentication for user:', userId);

      // Remove from backend
      try {
        await ApiService.setupBiometric(userId, {
          biometricEnabled: false
        });
      } catch (error) {
        console.error('⚠️ Backend disable failed:', error);
        // Continue with local cleanup
      }

      // Remove local data
      const keys = [
        `biometric_setup_${userId}`,
        `biometric_type_${userId}`,
        `biometric_credentials_${userId}`
      ];
      
      await AsyncStorage.multiRemove(keys);

      console.log('✅ Biometric authentication disabled');
      return { success: true };

    } catch (error) {
      console.error('❌ Disable biometric error:', error);
      return {
        success: false,
        error: error.message || 'Failed to disable biometric authentication'
      };
    }
  }

  // UTILITIES
  async clearBiometricData(userId) {
    console.log('🧹 Clearing biometric data for user:', userId);
    
    const keys = [
      `biometric_setup_${userId}`,
      `biometric_type_${userId}`,
      `biometric_credentials_${userId}`
    ];
    
    await AsyncStorage.multiRemove(keys);
  }

  // Check if biometric is set up for user
  async isBiometricSetup(userId) {
    if (!userId) return false;
    
    const setupStatus = await AsyncStorage.getItem(`biometric_setup_${userId}`);
    return setupStatus === 'true';
  }

  // Get biometric type for user
  async getBiometricType(userId) {
    if (!userId) return null;
    
    const biometricType = await AsyncStorage.getItem(`biometric_type_${userId}`);
    return biometricType || 'Biometric';
  }
}

export default new BiometricService();