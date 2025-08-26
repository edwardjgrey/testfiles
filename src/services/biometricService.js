// src/services/biometricService.js - iOS-Compatible Fixed Version
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

  // Get biometric type name for display - iOS SPECIFIC FIX
  getBiometricTypeName(supportedTypes) {
    try {
      if (Platform.OS === 'ios') {
        // iOS 13+ Face ID check
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          return 'Face ID';
        } 
        // iOS Touch ID check
        else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          return 'Touch ID';
        }
        // iOS Optic ID (iPad Pro M4)
        else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.OPTIC_ID)) {
          return 'Optic ID';
        }
      } else {
        // Android biometric types
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

  // iOS-SPECIFIC AUTHENTICATION FIX
  async authenticateWithBiometric(reason = 'Authenticate to access your account') {
    try {
      console.log('🔐 Starting biometric authentication for iOS...');

      const biometricStatus = await this.isBiometricAvailable();
      console.log('🔍 Biometric status:', biometricStatus);
      
      if (!biometricStatus.available) {
        const error = !biometricStatus.hasHardware 
          ? 'Your device does not support biometric authentication'
          : 'No biometric data is enrolled on this device. Please set up Face ID or Touch ID in Settings.';
        
        throw new Error(error);
      }

      // iOS-SPECIFIC AUTHENTICATION OPTIONS - CRITICAL FIX
      const authOptions = {
        promptMessage: reason,
        disableDeviceFallback: true, // IMPORTANT: Disable device PIN fallback
      };

      // iOS-specific fallback configuration
      if (Platform.OS === 'ios') {
        authOptions.fallbackLabel = ''; // Empty string to hide fallback button
        authOptions.cancelLabel = 'Cancel';
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
      } else {
        // Handle different iOS error types
        return this.handleAuthenticationError(result);
      }
    } catch (error) {
      console.error('❌ Biometric authentication error:', error);
      return {
        success: false,
        error: error.message || 'Biometric authentication failed'
      };
    }
  }

  // iOS-SPECIFIC ERROR HANDLING
  handleAuthenticationError(result) {
    console.log('🔍 Handling authentication error:', result.error);
    
    switch (result.error) {
      case 'UserCancel':
      case 'user_cancel':
        return {
          success: false,
          cancelled: true,
          error: 'Authentication was cancelled by user'
        };
      
      case 'UserFallback':
      case 'user_fallback':
        return {
          success: false,
          fallback: true,
          error: 'User chose fallback authentication'
        };
      
      case 'SystemCancel':
      case 'system_cancel':
        return {
          success: false,
          cancelled: true,
          error: 'Authentication was cancelled by the system'
        };
      
      case 'BiometryNotAvailable':
      case 'biometry_not_available':
        return {
          success: false,
          error: 'Biometric authentication is not available on this device'
        };
      
      case 'BiometryNotEnrolled':
      case 'biometry_not_enrolled':
        return {
          success: false,
          error: 'No biometric data is enrolled. Please set up Face ID or Touch ID in Settings'
        };
      
      case 'BiometryLockout':
      case 'biometry_lockout':
        return {
          success: false,
          locked: true,
          error: 'Biometric authentication is temporarily disabled due to too many failed attempts. Please wait or use your device passcode to unlock'
        };
      
      case 'AuthenticationFailed':
      case 'authentication_failed':
        return {
          success: false,
          error: 'Authentication failed. Please try again'
        };
      
      case 'InvalidContext':
      case 'invalid_context':
        return {
          success: false,
          error: 'Invalid authentication context'
        };
      
      case 'NotInteractive':
      case 'not_interactive':
        return {
          success: false,
          error: 'Authentication requires user interaction'
        };
      
      default:
        return {
          success: false,
          error: this.getErrorMessage(result.error) || 'Biometric authentication failed'
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

      // Test biometric authentication first with iOS-optimized prompt
      const authReason = Platform.OS === 'ios' 
        ? `Enable ${biometricStatus.typeName} for secure access to Akchabar`
        : 'Enable biometric authentication for secure access to Akchabar';

      const authResult = await this.authenticateWithBiometric(authReason);

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
      'UserCancel': 'Authentication was cancelled.',
      'user_cancel': 'Authentication was cancelled.',
      'UserFallback': 'Fallback authentication method selected.',
      'user_fallback': 'Fallback authentication method selected.',
      'SystemCancel': 'Authentication was cancelled by the system.',
      'system_cancel': 'Authentication was cancelled by the system.',
      'PasscodeNotSet': 'Device passcode is not set. Please set up a passcode in Settings.',
      'passcode_not_set': 'Device passcode is not set. Please set up a passcode in Settings.',
      'BiometryNotAvailable': 'Biometric authentication is not available on this device.',
      'biometry_not_available': 'Biometric authentication is not available on this device.',
      'BiometryNotEnrolled': 'No biometric data is enrolled. Please set up Face ID or Touch ID in Settings.',
      'biometry_not_enrolled': 'No biometric data is enrolled. Please set up Face ID or Touch ID in Settings.',
      'BiometryLockout': 'Biometric authentication is temporarily disabled. Please wait or use your device passcode.',
      'biometry_lockout': 'Biometric authentication is temporarily disabled. Please wait or use your device passcode.',
      'AppCancel': 'Authentication was cancelled by the app.',
      'app_cancel': 'Authentication was cancelled by the app.',
      'InvalidContext': 'Invalid authentication context.',
      'invalid_context': 'Invalid authentication context.',
      'NotInteractive': 'Authentication requires user interaction.',
      'not_interactive': 'Authentication requires user interaction.',
      'TouchIDNotAvailable': 'Touch ID is not available on this device.',
      'touch_id_not_available': 'Touch ID is not available on this device.',
      'TouchIDNotEnrolled': 'Touch ID is not set up. Please enable Touch ID in Settings.',
      'touch_id_not_enrolled': 'Touch ID is not set up. Please enable Touch ID in Settings.',
      'TouchIDLockout': 'Touch ID is temporarily disabled. Please wait or use your passcode.',
      'touch_id_lockout': 'Touch ID is temporarily disabled. Please wait or use your passcode.',
      'FaceIDNotAvailable': 'Face ID is not available on this device.',
      'face_id_not_available': 'Face ID is not available on this device.',
      'FaceIDNotEnrolled': 'Face ID is not set up. Please enable Face ID in Settings.',
      'face_id_not_enrolled': 'Face ID is not set up. Please enable Face ID in Settings.',
      'FaceIDLockout': 'Face ID is temporarily disabled. Please wait or use your passcode.',
      'face_id_lockout': 'Face ID is temporarily disabled. Please wait or use your passcode.',
      'AuthenticationFailed': 'Authentication failed. Please try again.',
      'authentication_failed': 'Authentication failed. Please try again.'
    };

    return errorMessages[errorCode] || 'Biometric authentication failed. Please try again.';
  }

  // iOS Permission Check - NEW METHOD
  async requestBiometricPermission() {
    try {
      if (Platform.OS !== 'ios') {
        return { granted: true };
      }

      // On iOS, biometric permission is implicit through hardware/enrollment checks
      const biometricInfo = await this.isBiometricAvailable();
      
      return {
        granted: biometricInfo.available,
        hasHardware: biometricInfo.hasHardware,
        isEnrolled: biometricInfo.isEnrolled,
        error: biometricInfo.error
      };
    } catch (error) {
      console.error('❌ Request biometric permission error:', error);
      return {
        granted: false,
        error: error.message
      };
    }
  }

  // Quick iOS compatibility check
  async isIOSBiometricSupported() {
    if (Platform.OS !== 'ios') {
      return { supported: false, reason: 'Not iOS device' };
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return { supported: false, reason: 'No biometric hardware' };
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return { supported: false, reason: 'No biometric data enrolled' };
      }

      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const typeName = this.getBiometricTypeName(supportedTypes);

      return {
        supported: true,
        biometricType: typeName,
        supportedTypes: supportedTypes
      };
    } catch (error) {
      return {
        supported: false,
        reason: error.message
      };
    }
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