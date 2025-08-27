// src/services/biometricService.js - FIXED VERSION
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

class BiometricService {
  constructor() {
    this.BIOMETRIC_KEY_BASE = 'biometric_enabled';
    this.BIOMETRIC_TOKEN_KEY_BASE = 'biometric_token';
    
    // FIXED: Prevent race conditions with initialization state
    this.isInitialized = false;
    this.initializationPromise = null;
    this.currentUserId = null;
    
    // FIXED: Cache biometric info to prevent repeated hardware checks
    this.biometricInfoCache = null;
    this.cacheExpiry = null;
    this.CACHE_DURATION = 30000; // 30 seconds cache
    
    // FIXED: Cleanup tracking
    this.activeOperations = new Set();
  }

  // FIXED: Prevent concurrent initialization
  async initialize() {
    if (this.isInitialized) return true;
    if (this.initializationPromise) return this.initializationPromise;
    
    this.initializationPromise = this._performInitialization();
    return this.initializationPromise;
  }

  async _performInitialization() {
    try {
      console.log('🔧 Initializing BiometricService for platform:', Platform.OS);
      
      // Test basic LocalAuthentication availability
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      console.log('📱 Hardware available:', hasHardware);
      
      this.isInitialized = true;
      this.initializationPromise = null;
      return true;
    } catch (error) {
      console.error('❌ BiometricService initialization failed:', error);
      this.initializationPromise = null;
      return false;
    }
  }

  // Helper function to generate user-specific keys
  getUserSpecificKey(baseKey, userId) {
    if (!userId) {
      throw new Error('User ID is required for biometric operations');
    }
    return `${baseKey}_${userId}`;
  }

  // FIXED: Cached biometric availability check
  async isBiometricAvailable() {
    // Check cache first
    if (this.biometricInfoCache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
      console.log('🔄 Using cached biometric info');
      return this.biometricInfoCache;
    }

    try {
      await this.initialize();
      
      const compatible = await LocalAuthentication.hasHardwareAsync();
      console.log('🔍 Hardware compatible:', compatible);
      
      if (!compatible) {
        const result = {
          available: false,
          hasHardware: false,
          isEnrolled: false,
          supportedTypes: [],
          typeName: 'Biometric',
          error: 'No biometric hardware available'
        };
        this._setCachedBiometricInfo(result);
        return result;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      console.log('👤 Biometric enrolled:', enrolled);
      
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      console.log('🎯 Supported types:', supportedTypes);

      const result = {
        available: compatible && enrolled,
        hasHardware: compatible,
        isEnrolled: enrolled,
        supportedTypes: supportedTypes,
        typeName: this.getBiometricTypeName(supportedTypes)
      };

      this._setCachedBiometricInfo(result);
      return result;
    } catch (error) {
      console.error('❌ Check biometric availability error:', error);
      const result = {
        available: false,
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
        typeName: 'Biometric',
        error: error.message
      };
      this._setCachedBiometricInfo(result, 5000); // Shorter cache for errors
      return result;
    }
  }

  // FIXED: Cache management
  _setCachedBiometricInfo(info, duration = this.CACHE_DURATION) {
    this.biometricInfoCache = info;
    this.cacheExpiry = Date.now() + duration;
  }

  _clearBiometricCache() {
    this.biometricInfoCache = null;
    this.cacheExpiry = null;
  }

  // FIXED: More robust biometric type detection
  getBiometricTypeName(supportedTypes) {
    try {
      if (!Array.isArray(supportedTypes) || supportedTypes.length === 0) {
        return 'Biometric';
      }

      if (Platform.OS === 'ios') {
        // FIXED: Handle newer iOS biometric types
        const typeMap = {
          [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION]: 'Face ID',
          [LocalAuthentication.AuthenticationType.FINGERPRINT]: 'Touch ID',
          [LocalAuthentication.AuthenticationType.OPTIC_ID]: 'Optic ID' // iPad Pro M4
        };

        for (const type of supportedTypes) {
          if (typeMap[type]) {
            return typeMap[type];
          }
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
        this.currentUserId = userId;
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

  // FIXED: Enhanced authentication with operation tracking
  async authenticateWithBiometric(reason = 'Authenticate to access your account') {
    const operationId = Math.random().toString(36).substr(2, 9);
    
    try {
      console.log('🔐 Starting biometric authentication...', operationId);
      this.activeOperations.add(operationId);

      const biometricStatus = await this.isBiometricAvailable();
      console.log('🔍 Biometric status:', biometricStatus);
      
      if (!biometricStatus.available) {
        const error = !biometricStatus.hasHardware 
          ? 'Your device does not support biometric authentication'
          : 'No biometric data is enrolled on this device. Please set up Face ID or Touch ID in Settings.';
        
        throw new Error(error);
      }

      // FIXED: Better iOS authentication options
      const authOptions = {
        promptMessage: reason,
        disableDeviceFallback: true, // Disable device PIN fallback
      };

      // Platform-specific optimizations
      if (Platform.OS === 'ios') {
        authOptions.fallbackLabel = ''; // Hide fallback button
        authOptions.cancelLabel = 'Cancel';
        
        // FIXED: Handle specific iOS versions and capabilities
        const iosVersion = Platform.Version;
        if (iosVersion >= 15) {
          authOptions.requireConfirmation = false; // Faster on iOS 15+
        }
      } else {
        // Android-specific options
        authOptions.promptMessage = reason;
        authOptions.cancelLabel = 'Cancel';
        authOptions.disableDeviceFallback = true;
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
        // Handle different error types
        return this.handleAuthenticationError(result);
      }
    } catch (error) {
      console.error('❌ Biometric authentication error:', error);
      
      // FIXED: Better error classification
      if (error.message.includes('User cancel') || error.message.includes('cancelled')) {
        return {
          success: false,
          cancelled: true,
          error: 'Authentication was cancelled'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Biometric authentication failed'
      };
    } finally {
      this.activeOperations.delete(operationId);
    }
  }

  // FIXED: Enhanced error handling
  handleAuthenticationError(result) {
    console.log('🔍 Handling authentication error:', result.error);
    
    // Create error mapping for better user experience
    const errorMap = {
      'UserCancel': { cancelled: true, error: 'Authentication was cancelled by user' },
      'user_cancel': { cancelled: true, error: 'Authentication was cancelled' },
      'UserFallback': { fallback: true, error: 'User chose fallback authentication' },
      'user_fallback': { fallback: true, error: 'Fallback authentication selected' },
      'SystemCancel': { cancelled: true, error: 'Authentication was cancelled by the system' },
      'system_cancel': { cancelled: true, error: 'System cancelled authentication' },
      'BiometryNotAvailable': { error: 'Biometric authentication is not available on this device' },
      'biometry_not_available': { error: 'Biometric authentication unavailable' },
      'BiometryNotEnrolled': { error: 'No biometric data is enrolled. Please set up Face ID or Touch ID in Settings' },
      'biometry_not_enrolled': { error: 'No biometric data enrolled' },
      'BiometryLockout': { 
        locked: true, 
        error: 'Biometric authentication is temporarily disabled due to too many failed attempts'
      },
      'biometry_lockout': { locked: true, error: 'Biometric authentication locked' },
      'AuthenticationFailed': { error: 'Authentication failed. Please try again' },
      'authentication_failed': { error: 'Authentication failed' }
    };
    
    const errorInfo = errorMap[result.error] || { 
      error: this.getErrorMessage(result.error) || 'Biometric authentication failed' 
    };
    
    return {
      success: false,
      ...errorInfo
    };
  }

  // Setup biometric authentication for a user
  async setupBiometric(userId) {
    const operationId = Math.random().toString(36).substr(2, 9);
    
    try {
      console.log('🔧 Setting up biometric for user:', userId);
      this.activeOperations.add(operationId);

      if (!userId) {
        throw new Error('User ID is required to setup biometric authentication');
      }

      this.currentUserId = userId;
      const biometricStatus = await this.isBiometricAvailable();
      console.log('🔍 Biometric status for setup:', biometricStatus);
      
      if (!biometricStatus.available) {
        const error = !biometricStatus.hasHardware 
          ? 'Your device does not support biometric authentication'
          : 'Please enable Face ID or Touch ID in your device Settings first';
        
        throw new Error(error);
      }

      // Test biometric authentication first
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

        // Clear cache since setup status changed
        this._clearBiometricCache();

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
    } finally {
      this.activeOperations.delete(operationId);
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
    const operationId = Math.random().toString(36).substr(2, 9);
    
    try {
      console.log('🔧 Disabling biometric for user:', userId);
      this.activeOperations.add(operationId);

      if (!userId) {
        throw new Error('User ID is required to disable biometric authentication');
      }

      const biometricKey = this.getUserSpecificKey(this.BIOMETRIC_KEY_BASE, userId);
      const tokenKey = this.getUserSpecificKey(this.BIOMETRIC_TOKEN_KEY_BASE, userId);

      await SecureStore.deleteItemAsync(biometricKey);
      await SecureStore.deleteItemAsync(tokenKey);

      // Clear cache since setup status changed
      this._clearBiometricCache();

      console.log('✅ Biometric disabled for user:', userId);
      return { success: true };
    } catch (error) {
      console.error('❌ Disable biometric failed for user:', userId, error);
      return {
        success: false,
        error: error.message || 'Failed to disable biometric authentication'
      };
    } finally {
      this.activeOperations.delete(operationId);
    }
  }

  // FIXED: Enhanced session token generation
  async generateSessionToken() {
    try {
      const timestamp = Date.now().toString();
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      const randomString = Array.from(randomBytes, byte => 
        byte.toString(16).padStart(2, '0')
      ).join('');
      
      // Include device info for additional entropy
      const deviceInfo = Platform.OS + Platform.Version + (Platform.isPad ? 'pad' : 'phone');
      const sessionData = `biometric_${timestamp}_${randomString}_${deviceInfo}`;
      
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

  // Get comprehensive error messages
  getErrorMessage(errorCode) {
    const errorMessages = {
      'UserCancel': 'Authentication was cancelled.',
      'user_cancel': 'Authentication was cancelled.',
      'UserFallback': 'Fallback authentication method selected.',
      'user_fallback': 'Fallback authentication method selected.',
      'SystemCancel': 'Authentication was cancelled by the system.',
      'system_cancel': 'Authentication was cancelled by the system.',
      'PasscodeNotSet': 'Device passcode is not set. Please set up a passcode in Settings.',
      'passcode_not_set': 'Device passcode is not set.',
      'BiometryNotAvailable': 'Biometric authentication is not available on this device.',
      'biometry_not_available': 'Biometric authentication is not available.',
      'BiometryNotEnrolled': 'No biometric data is enrolled. Please set up Face ID or Touch ID in Settings.',
      'biometry_not_enrolled': 'No biometric data is enrolled.',
      'BiometryLockout': 'Biometric authentication is temporarily disabled. Please wait or use your device passcode.',
      'biometry_lockout': 'Biometric authentication is temporarily disabled.',
      'AuthenticationFailed': 'Authentication failed. Please try again.',
      'authentication_failed': 'Authentication failed.',
      'AppCancel': 'Authentication was cancelled by the app.',
      'app_cancel': 'Authentication was cancelled by the app.',
      'InvalidContext': 'Invalid authentication context.',
      'invalid_context': 'Invalid authentication context.',
      'NotInteractive': 'Authentication requires user interaction.',
      'not_interactive': 'Authentication requires user interaction.'
    };

    return errorMessages[errorCode] || 'Biometric authentication failed. Please try again.';
  }

  // Quick iOS compatibility check
  async isIOSBiometricSupported() {
    if (Platform.OS !== 'ios') {
      return { supported: false, reason: 'Not iOS device' };
    }

    try {
      await this.initialize();
      
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

  // FIXED: Enhanced cleanup and emergency reset
  async emergencyReset(userId = null) {
    try {
      console.log('🚨 Emergency biometric reset for user:', userId || 'ALL');
      
      // Cancel any active operations
      this.activeOperations.clear();
      
      // Clear cache
      this._clearBiometricCache();
      
      if (userId) {
        // Reset for specific user
        const biometricKey = this.getUserSpecificKey(this.BIOMETRIC_KEY_BASE, userId);
        const tokenKey = this.getUserSpecificKey(this.BIOMETRIC_TOKEN_KEY_BASE, userId);
        
        await SecureStore.deleteItemAsync(biometricKey);
        await SecureStore.deleteItemAsync(tokenKey);
      } else {
        // DANGEROUS: Nuclear option - try to clear all biometric keys
        console.warn('⚠️ Emergency reset without user ID - attempting to clear all biometric keys');
        
        try {
          // If SecureStore supports key enumeration
          if (SecureStore.getAllKeysAsync) {
            const allKeys = await SecureStore.getAllKeysAsync();
            const biometricKeys = allKeys.filter(key => 
              key.includes('biometric_enabled_') || key.includes('biometric_token_')
            );
            
            for (const key of biometricKeys) {
              await SecureStore.deleteItemAsync(key);
            }
          }
        } catch (error) {
          console.error('Could not enumerate keys for reset:', error);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Emergency biometric reset error:', error);
      return { success: false, error: error.message };
    }
  }

  // Validate biometric token
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

  // Quick readiness check with caching
  async isReadyToUse(userId) {
    try {
      if (!userId) return false;
      
      // Quick check from cache if available  
      if (this.currentUserId === userId && this.biometricInfoCache?.isSetup !== undefined) {
        return this.biometricInfoCache.isSetup && this.biometricInfoCache.available;
      }
      
      const isSetup = await this.isBiometricSetup(userId);
      if (!isSetup) return false;
      
      // Use cached hardware check if available
      const biometricInfo = await this.isBiometricAvailable();
      return biometricInfo.available;
    } catch (error) {
      console.error('❌ Ready to use check error:', error);
      return false;
    }
  }

  // Cleanup method to be called on app shutdown/user logout
  cleanup() {
    console.log('🧹 Cleaning up BiometricService');
    this.activeOperations.clear();
    this._clearBiometricCache();
    this.currentUserId = null;
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  // Get current service status (for debugging)
  getServiceStatus() {
    return {
      isInitialized: this.isInitialized,
      hasCache: !!this.biometricInfoCache,
      cacheExpiry: this.cacheExpiry,
      activeOperations: this.activeOperations.size,
      currentUserId: this.currentUserId
    };
  }
}

export default new BiometricService();