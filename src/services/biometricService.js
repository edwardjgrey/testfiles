// src/services/biometricService.js - iOS-Compatible Version
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

class BiometricService {
  constructor() {
    this.BIOMETRIC_KEY_BASE = 'biometric_enabled';
    this.BIOMETRIC_TOKEN_KEY_BASE = 'biometric_token';
    this.isInitialized = false;
  }

  // Helper function to generate user-specific keys
  getUserSpecificKey(baseKey, userId) {
    if (!userId) {
      throw new Error('User ID is required for biometric operations');
    }
    return `${baseKey}_${userId}`;
  }

  // Initialize service with proper error handling
  async initialize() {
    try {
      if (this.isInitialized) return true;
      
      console.log('🔧 Initializing BiometricService for platform:', Platform.OS);
      
      // Test basic LocalAuthentication availability
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      console.log('📱 Hardware available:', hasHardware);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ BiometricService initialization failed:', error);
      return false;
    }
  }

  // Check if biometric authentication is available on device
  async isBiometricAvailable() {
    try {
      await this.initialize();
      
      const compatible = await LocalAuthentication.hasHardwareAsync();
      console.log('🔍 Hardware compatible:', compatible);
      
      if (!compatible) {
        return {
          available: false,
          hasHardware: false,
          isEnrolled: false,
          supportedTypes: [],
          typeName: 'Biometric'
        };
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      console.log('👤 Biometric enrolled:', enrolled);
      
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      console.log('🎯 Supported types:', supportedTypes);

      return {
        available: compatible && enrolled,
        hasHardware: compatible,
        isEnrolled: enrolled,
        supportedTypes: supportedTypes,
        typeName: this.getBiometricTypeName(supportedTypes)
      };
    } catch (error) {
      console.error('❌ Check biometric availability error:', error);
      return {
        available: false,
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
        typeName: 'Biometric',
        error: error.message
      };
    }
  }

  // Get biometric type name for display
  getBiometricTypeName(supportedTypes) {
    try {
      if (Platform.OS === 'ios') {
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          return 'Face ID';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          return 'Touch ID';
        }
      } else {
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          return 'Fingerprint';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          return 'Face Recognition';
        }
      }
      return 'Biometric';
    } catch (error) {
      console.error('Get biometric type error:', error);
      return 'Biometric';
    }
  }

  // Get comprehensive biometric info including setup status
  async getBiometricInfo(userId = null) {
    try {
      console.log('📊 Getting biometric info for user:', userId);
      
      const deviceInfo = await this.isBiometricAvailable();
      let isSetup = false;

      if (userId) {
        isSetup = await this.isBiometricSetup(userId);
      }

      const result = {
        ...deviceInfo,
        isSetup: isSetup
      };

      console.log('📊 Biometric info result:', result);
      return result;
    } catch (error) {
      console.error('❌ Get biometric info error:', error);
      return {
        available: false,
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
        typeName: 'Biometric',
        isSetup: false,
        error: error.message
      };
    }
  }

  // Prompt for biometric authentication with iOS-specific options
  async authenticateWithBiometric(reason = 'Authenticate to access your account') {
    try {
      console.log('🔐 Starting biometric authentication...');

      const biometricStatus = await this.isBiometricAvailable();
      console.log('🔍 Biometric status:', biometricStatus);
      
      if (!biometricStatus.available) {
        const error = !biometricStatus.hasHardware 
          ? 'Your device does not support biometric authentication'
          : 'No biometric data is enrolled on this device. Please set up Face ID or Touch ID in Settings.';
        
        throw new Error(error);
      }

      // iOS-specific authentication options
      const authOptions = {
        promptMessage: reason,
        cancelLabel: 'Cancel',
        disableDeviceFallback: true, // Disable device PIN fallback
        requireConfirmation: false,
      };

      // Add iOS-specific options
      if (Platform.OS === 'ios') {
        authOptions.fallbackLabel = 'Use PIN'; // Custom fallback label
      }

      console.log('🔐 Calling LocalAuthentication.authenticateAsync with options:', authOptions);
      
      const result = await LocalAuthentication.authenticateAsync(authOptions);
      console.log('🔐 Authentication result:', result);

      if (result.success) {
        // Generate a session token for this successful biometric auth
        const sessionToken = await this.generateSessionToken();
        
        return {
          success: true,
          biometricToken: sessionToken
        };
      } else if (result.error === 'user_cancel') {
        return {
          success: false,
          cancelled: true,
          error: 'Authentication was cancelled'
        };
      } else if (result.error === 'user_fallback') {
        return {
          success: false,
          fallback: true,
          error: 'User chose fallback authentication'
        };
      } else if (result.error === 'biometry_lockout') {
        return {
          success: false,
          locked: true,
          error: 'Biometric authentication is temporarily disabled. Please try again later or use your PIN.'
        };
      } else if (result.error === 'biometry_not_available') {
        return {
          success: false,
          error: 'Biometric authentication is not available. Please check your device settings.'
        };
      } else {
        return {
          success: false,
          error: this.getErrorMessage(result.error) || 'Authentication failed'
        };
      }
    } catch (error) {
      console.error('❌ Biometric authentication error:', error);
      return {
        success: false,
        error: error.message || 'Biometric authentication failed'
      };
    }
  }

  // Setup biometric authentication for a user with iOS considerations
  async setupBiometric(userId) {
    try {
      console.log('🔧 Setting up biometric for user:', userId);

      if (!userId) {
        throw new Error('User ID is required to setup biometric authentication');
      }

      const biometricStatus = await this.isBiometricAvailable();
      console.log('🔍 Biometric status for setup:', biometricStatus);
      
      if (!biometricStatus.available) {
        const error = !biometricStatus.hasHardware 
          ? 'Your device does not support biometric authentication'
          : 'Please enable Face ID or Touch ID in your device Settings first';
        
        throw new Error(error);
      }

      // Test biometric authentication first
      const authResult = await this.authenticateWithBiometric(
        `Enable ${biometricStatus.typeName} for secure access to Akchabar`
      );

      console.log('🔐 Setup auth result:', authResult);

      if (authResult.success) {
        // Store biometric setup flag
        const biometricKey = this.getUserSpecificKey(this.BIOMETRIC_KEY_BASE, userId);
        const tokenKey = this.getUserSpecificKey(this.BIOMETRIC_TOKEN_KEY_BASE, userId);
        
        await SecureStore.setItemAsync(biometricKey, 'true');
        await SecureStore.setItemAsync(tokenKey, authResult.biometricToken);

        console.log('✅ Biometric setup completed for user:', userId);
        return { 
          success: true, 
          biometricToken: authResult.biometricToken 
        };
      } else {
        return {
          success: false,
          error: authResult.error || 'Failed to setup biometric authentication',
          cancelled: authResult.cancelled,
          locked: authResult.locked
        };
      }
    } catch (error) {
      console.error('❌ Biometric setup failed for user:', userId, error);
      return {
        success: false,
        error: error.message || 'Failed to setup biometric authentication'
      };
    }
  }

  // Check if biometric is setup for a user
  async isBiometricSetup(userId) {
    try {
      if (!userId) return false;
      
      const biometricKey = this.getUserSpecificKey(this.BIOMETRIC_KEY_BASE, userId);
      const isSetup = await SecureStore.getItemAsync(biometricKey);
      const result = isSetup === 'true';
      
      console.log('🔍 Biometric setup check for user', userId, ':', result);
      return result;
    } catch (error) {
      console.error('❌ Check biometric setup error for user:', userId, error);
      return false;
    }
  }

  // Disable biometric authentication for a user
  async disableBiometric(userId) {
    try {
      console.log('🔧 Disabling biometric for user:', userId);

      if (!userId) {
        throw new Error('User ID is required to disable biometric authentication');
      }

      const biometricKey = this.getUserSpecificKey(this.BIOMETRIC_KEY_BASE, userId);
      const tokenKey = this.getUserSpecificKey(this.BIOMETRIC_TOKEN_KEY_BASE, userId);

      await SecureStore.deleteItemAsync(biometricKey);
      await SecureStore.deleteItemAsync(tokenKey);

      console.log('✅ Biometric disabled for user:', userId);
      return { success: true };
    } catch (error) {
      console.error('❌ Disable biometric failed for user:', userId, error);
      return {
        success: false,
        error: error.message || 'Failed to disable biometric authentication'
      };
    }
  }

  // Generate secure session token
  async generateSessionToken() {
    try {
      const timestamp = Date.now().toString();
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      const randomString = Array.from(randomBytes, byte => 
        byte.toString(16).padStart(2, '0')
      ).join('');
      
      const sessionData = `biometric_${timestamp}_${randomString}`;
      const token = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256, 
        sessionData
      );
      
      console.log('🔑 Generated biometric session token');
      return token;
    } catch (error) {
      console.error('❌ Generate session token error:', error);
      return null;
    }
  }

  // Get iOS-specific error messages
  getErrorMessage(errorCode) {
    const errorMessages = {
      'user_cancel': 'Authentication was cancelled.',
      'user_fallback': 'Fallback authentication method selected.',
      'system_cancel': 'Authentication was cancelled by the system.',
      'passcode_not_set': 'Device passcode is not set. Please set up a passcode in Settings.',
      'biometry_not_available': 'Biometric authentication is not available on this device.',
      'biometry_not_enrolled': 'No biometric data is enrolled. Please set up Face ID or Touch ID in Settings.',
      'biometry_lockout': 'Biometric authentication is temporarily disabled. Please wait or use your device passcode.',
      'app_cancel': 'Authentication was cancelled by the app.',
      'invalid_context': 'Invalid authentication context.',
      'not_interactive': 'Authentication requires user interaction.',
      'touch_id_not_available': 'Touch ID is not available on this device.',
      'touch_id_not_enrolled': 'Touch ID is not set up. Please enable Touch ID in Settings.',
      'touch_id_lockout': 'Touch ID is temporarily disabled. Please wait or use your passcode.',
      'face_id_not_available': 'Face ID is not available on this device.',
      'face_id_not_enrolled': 'Face ID is not set up. Please enable Face ID in Settings.',
      'face_id_lockout': 'Face ID is temporarily disabled. Please wait or use your passcode.',
      'authentication_failed': 'Authentication failed. Please try again.'
    };

    return errorMessages[errorCode] || 'Biometric authentication failed. Please try again.';
  }

  // Emergency reset for development
  async emergencyReset(userId = null) {
    try {
      console.log('🚨 Emergency biometric reset for user:', userId || 'ALL');
      
      if (userId) {
        // Reset for specific user
        const biometricKey = this.getUserSpecificKey(this.BIOMETRIC_KEY_BASE, userId);
        const tokenKey = this.getUserSpecificKey(this.BIOMETRIC_TOKEN_KEY_BASE, userId);
        
        await SecureStore.deleteItemAsync(biometricKey);
        await SecureStore.deleteItemAsync(tokenKey);
      } else {
        // DANGEROUS: This won't work well without knowing all user IDs
        console.warn('⚠️ Emergency reset without user ID - limited functionality');
        
        // Try to clear common patterns (this won't get everything)
        const commonKeys = [
          'biometric_enabled', 'biometric_token'
        ];
        
        for (const key of commonKeys) {
          try {
            await SecureStore.deleteItemAsync(key);
          } catch (e) {
            // Key might not exist, ignore
          }
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Emergency biometric reset error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get biometric settings for a user
  async getBiometricSettings(userId) {
    try {
      const deviceInfo = await this.isBiometricAvailable();
      const isSetup = userId ? await this.isBiometricSetup(userId) : false;

      return {
        deviceSupported: deviceInfo.hasHardware,
        deviceEnrolled: deviceInfo.isEnrolled,
        appEnabled: isSetup,
        biometricType: deviceInfo.typeName,
        available: deviceInfo.available && isSetup,
        error: deviceInfo.error
      };
    } catch (error) {
      console.error('❌ Get biometric settings error:', error);
      return {
        deviceSupported: false,
        deviceEnrolled: false,
        appEnabled: false,
        biometricType: 'Biometric',
        available: false,
        error: error.message
      };
    }
  }

  // Validate biometric token (for API calls)
  async validateBiometricToken(token, userId) {
    try {
      if (!token || !userId) return false;

      const tokenKey = this.getUserSpecificKey(this.BIOMETRIC_TOKEN_KEY_BASE, userId);
      const storedToken = await SecureStore.getItemAsync(tokenKey);
      
      return token === storedToken;
    } catch (error) {
      console.error('❌ Validate biometric token error:', error);
      return false;
    }
  }

  // Quick check if biometric is ready to use (cached check)
  async isReadyToUse(userId) {
    try {
      if (!userId) return false;
      
      // Quick check from cache if available
      const isSetup = await this.isBiometricSetup(userId);
      if (!isSetup) return false;
      
      // Basic hardware check
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      return hasHardware;
    } catch (error) {
      console.error('❌ Ready to use check error:', error);
      return false;
    }
  }
}

export default new BiometricService();