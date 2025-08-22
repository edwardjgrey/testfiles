// src/services/securityService.js - FIXED VERSION with user-specific PIN storage
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Alert } from 'react-native';

class SecurityService {
  constructor() {
    this.currentUserId = null;
    this.MAX_ATTEMPTS = 5;
    this.LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  }

  // Set current user ID for PIN operations
  setCurrentUser(userId) {
    console.log('🔐 Setting current user for PIN operations:', userId);
    this.currentUserId = userId;
  }

  // Get user-specific keys
  getUserKeys(userId = null) {
    const id = userId || this.currentUserId;
    if (!id) {
      throw new Error('No user ID set for PIN operations');
    }
    
    return {
      PIN_KEY: `user_pin_hash_${id}`,
      PIN_SALT_KEY: `user_pin_salt_${id}`,
      PIN_SETUP_KEY: `pin_setup_complete_${id}`,
      FAILED_ATTEMPTS_KEY: `pin_failed_attempts_${id}`,
      LOCKOUT_TIME_KEY: `pin_lockout_time_${id}`
    };
  }

  // Generate a random salt for PIN hashing
  async generateSalt() {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Hash PIN with salt
  async hashPin(pin, salt) {
    const pinWithSalt = pin + salt;
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pinWithSalt);
  }

  // Setup PIN for the first time
  async setupPin(pin, userId) {
    try {
      console.log('🔐 Setting up PIN for user:', userId);
      
      // Set current user
      this.setCurrentUser(userId);
      const keys = this.getUserKeys(userId);

      // Validate PIN
      if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        throw new Error('PIN must be exactly 6 digits');
      }

      // Check if PIN already exists for this user
      const existingPin = await SecureStore.getItemAsync(keys.PIN_KEY);
      if (existingPin) {
        console.log('⚠️ PIN already exists for user:', userId, '- removing old PIN first');
        await this.removeExistingPin(userId);
      }

      // Generate salt and hash PIN
      const salt = await this.generateSalt();
      const hashedPin = await this.hashPin(pin, salt);

      console.log('💾 Storing PIN with keys:', {
        pinKey: keys.PIN_KEY,
        saltKey: keys.PIN_SALT_KEY,
        setupKey: keys.PIN_SETUP_KEY
      });

      // Store securely with user-specific keys
      await SecureStore.setItemAsync(keys.PIN_KEY, hashedPin);
      await SecureStore.setItemAsync(keys.PIN_SALT_KEY, salt);
      await SecureStore.setItemAsync(keys.PIN_SETUP_KEY, 'true');

      // Reset any failed attempts for this user
      await this.resetFailedAttempts(userId);

      console.log('✅ PIN setup completed successfully for user:', userId);
      return { success: true };
    } catch (error) {
      console.error('❌ PIN setup failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Remove existing PIN for user
  async removeExistingPin(userId) {
    try {
      const keys = this.getUserKeys(userId);
      await SecureStore.deleteItemAsync(keys.PIN_KEY);
      await SecureStore.deleteItemAsync(keys.PIN_SALT_KEY);
      await SecureStore.deleteItemAsync(keys.PIN_SETUP_KEY);
      await this.resetFailedAttempts(userId);
      console.log('🗑️ Removed existing PIN for user:', userId);
    } catch (error) {
      console.error('Error removing existing PIN:', error);
    }
  }

  // Verify PIN
  async verifyPin(enteredPin, userId = null) {
    try {
      const id = userId || this.currentUserId;
      if (!id) {
        throw new Error('No user ID provided for PIN verification');
      }

      console.log('🔍 Verifying PIN for user:', id);
      const keys = this.getUserKeys(id);

      // Check if user is locked out
      const lockoutCheck = await this.checkLockout(id);
      if (!lockoutCheck.allowed) {
        return {
          success: false,
          error: `Too many failed attempts. Try again in ${Math.ceil(lockoutCheck.remainingTime / 60000)} minutes.`,
          lockedOut: true,
          remainingTime: lockoutCheck.remainingTime
        };
      }

      // Validate input
      if (!enteredPin || enteredPin.length !== 6 || !/^\d{6}$/.test(enteredPin)) {
        await this.incrementFailedAttempts(id);
        return { success: false, error: 'Invalid PIN format' };
      }

      // Get stored PIN hash and salt for this specific user
      const storedHash = await SecureStore.getItemAsync(keys.PIN_KEY);
      const salt = await SecureStore.getItemAsync(keys.PIN_SALT_KEY);

      console.log('🔍 PIN verification details:', {
        userId: id,
        hasStoredHash: !!storedHash,
        hasSalt: !!salt,
        pinKey: keys.PIN_KEY,
        saltKey: keys.PIN_SALT_KEY
      });

      if (!storedHash || !salt) {
        console.log('❌ No PIN found for user:', id);
        return { success: false, error: 'PIN not set up for this user' };
      }

      // Hash entered PIN with stored salt
      const enteredHash = await this.hashPin(enteredPin, salt);

      console.log('🔍 Hash comparison:', {
        enteredPinLength: enteredPin.length,
        storedHashLength: storedHash.length,
        enteredHashLength: enteredHash.length,
        hashesMatch: enteredHash === storedHash
      });

      // Compare hashes
      if (enteredHash === storedHash) {
        console.log('✅ PIN verified successfully for user:', id);
        await this.resetFailedAttempts(id);
        return { success: true };
      } else {
        console.log('❌ PIN verification failed for user:', id);
        await this.incrementFailedAttempts(id);
        
        const attempts = await this.getFailedAttempts(id);
        const remainingAttempts = this.MAX_ATTEMPTS - attempts;
        
        if (remainingAttempts <= 0) {
          await this.setLockout(id);
          return {
            success: false,
            error: 'Too many failed attempts. Account locked for 30 minutes.',
            lockedOut: true
          };
        }
        
        return {
          success: false,
          error: `Incorrect PIN. ${remainingAttempts} attempts remaining.`,
          remainingAttempts
        };
      }
    } catch (error) {
      console.error('❌ PIN verification error:', error);
      return { success: false, error: 'PIN verification failed' };
    }
  }

  // Check if PIN is set up for specific user
  async isPinSetup(userId = null) {
    try {
      const id = userId || this.currentUserId;
      if (!id) {
        console.log('⚠️ No user ID provided for PIN setup check');
        return false;
      }

      const keys = this.getUserKeys(id);
      const isSetup = await SecureStore.getItemAsync(keys.PIN_SETUP_KEY);
      const hasPin = await SecureStore.getItemAsync(keys.PIN_KEY);
      
      console.log('🔍 PIN setup check for user:', id, {
        setupFlag: isSetup === 'true',
        hasPin: !!hasPin,
        setupKey: keys.PIN_SETUP_KEY
      });
      
      return isSetup === 'true' && !!hasPin;
    } catch (error) {
      console.error('Check PIN setup error:', error);
      return false;
    }
  }

  // Change PIN (requires old PIN)
  async changePin(oldPin, newPin, userId) {
    try {
      console.log('🔄 Changing PIN for user:', userId);
      
      // Set current user
      this.setCurrentUser(userId);

      // Verify old PIN first
      const oldPinVerification = await this.verifyPin(oldPin, userId);
      if (!oldPinVerification.success) {
        return { success: false, error: 'Current PIN is incorrect' };
      }

      // Remove old PIN and setup new one
      await this.removeExistingPin(userId);
      return await this.setupPin(newPin, userId);
    } catch (error) {
      console.error('❌ PIN change failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Remove PIN (requires PIN verification)
  async removePin(pin, userId = null) {
    try {
      const id = userId || this.currentUserId;
      console.log('🗑️ Removing PIN for user:', id);

      // Verify PIN first
      const verification = await this.verifyPin(pin, id);
      if (!verification.success) {
        return { success: false, error: 'Incorrect PIN' };
      }

      // Remove all PIN-related data for this user
      await this.removeExistingPin(id);

      console.log('✅ PIN removed successfully for user:', id);
      return { success: true };
    } catch (error) {
      console.error('❌ PIN removal failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Failed attempts management (user-specific)
  async getFailedAttempts(userId = null) {
    try {
      const id = userId || this.currentUserId;
      const keys = this.getUserKeys(id);
      const attempts = await SecureStore.getItemAsync(keys.FAILED_ATTEMPTS_KEY);
      return parseInt(attempts) || 0;
    } catch (error) {
      return 0;
    }
  }

  async incrementFailedAttempts(userId = null) {
    try {
      const id = userId || this.currentUserId;
      const keys = this.getUserKeys(id);
      const current = await this.getFailedAttempts(id);
      await SecureStore.setItemAsync(keys.FAILED_ATTEMPTS_KEY, (current + 1).toString());
      console.log('📈 Incremented failed attempts for user:', id, 'to:', current + 1);
    } catch (error) {
      console.error('Increment failed attempts error:', error);
    }
  }

  async resetFailedAttempts(userId = null) {
    try {
      const id = userId || this.currentUserId;
      const keys = this.getUserKeys(id);
      await SecureStore.deleteItemAsync(keys.FAILED_ATTEMPTS_KEY);
      await SecureStore.deleteItemAsync(keys.LOCKOUT_TIME_KEY);
      console.log('🔄 Reset failed attempts for user:', id);
    } catch (error) {
      console.error('Reset failed attempts error:', error);
    }
  }

  // Lockout management (user-specific)
  async setLockout(userId = null) {
    try {
      const id = userId || this.currentUserId;
      const keys = this.getUserKeys(id);
      const lockoutTime = Date.now() + this.LOCKOUT_DURATION;
      await SecureStore.setItemAsync(keys.LOCKOUT_TIME_KEY, lockoutTime.toString());
      console.log('🔒 Set lockout for user:', id, 'until:', new Date(lockoutTime));
    } catch (error) {
      console.error('Set lockout error:', error);
    }
  }

  async checkLockout(userId = null) {
    try {
      const id = userId || this.currentUserId;
      const keys = this.getUserKeys(id);
      const lockoutTimeStr = await SecureStore.getItemAsync(keys.LOCKOUT_TIME_KEY);
      
      if (!lockoutTimeStr) {
        return { allowed: true };
      }

      const lockoutTime = parseInt(lockoutTimeStr);
      const now = Date.now();

      if (now < lockoutTime) {
        return {
          allowed: false,
          remainingTime: lockoutTime - now
        };
      } else {
        // Lockout expired, reset
        await this.resetFailedAttempts(id);
        return { allowed: true };
      }
    } catch (error) {
      console.error('Check lockout error:', error);
      return { allowed: true };
    }
  }

  // Get security status for specific user
  async getSecurityStatus(userId = null) {
    try {
      const id = userId || this.currentUserId;
      if (!id) {
        return {
          pinSetup: false,
          failedAttempts: 0,
          isLockedOut: false,
          lockoutRemainingTime: 0
        };
      }

      const isPinSetup = await this.isPinSetup(id);
      const failedAttempts = await this.getFailedAttempts(id);
      const lockoutCheck = await this.checkLockout(id);

      console.log('📊 Security status for user:', id, {
        pinSetup: isPinSetup,
        failedAttempts,
        isLockedOut: !lockoutCheck.allowed
      });

      return {
        pinSetup: isPinSetup,
        failedAttempts,
        isLockedOut: !lockoutCheck.allowed,
        lockoutRemainingTime: lockoutCheck.remainingTime || 0
      };
    } catch (error) {
      console.error('Get security status error:', error);
      return {
        pinSetup: false,
        failedAttempts: 0,
        isLockedOut: false,
        lockoutRemainingTime: 0
      };
    }
  }

  // Validate PIN format
  validatePinFormat(pin) {
    if (!pin) {
      return { valid: false, error: 'PIN is required' };
    }

    if (pin.length !== 6) {
      return { valid: false, error: 'PIN must be 6 digits' };
    }

    if (!/^\d{6}$/.test(pin)) {
      return { valid: false, error: 'PIN must contain only numbers' };
    }

    // Check for common weak PINs
    const weakPins = [
      '000000', '111111', '222222', '333333', '444444', '555555',
      '666666', '777777', '888888', '999999', '123456', '654321',
      '123321', '112233', '121212'
    ];

    if (weakPins.includes(pin)) {
      return { valid: false, error: 'Please choose a more secure PIN' };
    }

    return { valid: true };
  }

  // Emergency PIN reset (for development/testing) - removes ALL user PINs
  async emergencyReset() {
    try {
      console.log('🚨 Emergency PIN reset - removing ALL user PINs');
      
      // This is a nuclear option - removes all PIN data
      const allKeys = await SecureStore.getAllKeysAsync?.() || [];
      const pinKeys = allKeys.filter(key => 
        key.includes('user_pin_hash_') || 
        key.includes('user_pin_salt_') || 
        key.includes('pin_setup_complete_') ||
        key.includes('pin_failed_attempts_') ||
        key.includes('pin_lockout_time_')
      );

      for (const key of pinKeys) {
        await SecureStore.deleteItemAsync(key);
      }

      console.log('🗑️ Removed', pinKeys.length, 'PIN-related keys');
      return { success: true };
    } catch (error) {
      console.error('Emergency reset error:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate secure session token
  async generateSessionToken() {
    try {
      const timestamp = Date.now().toString();
      const randomBytes = await Crypto.getRandomBytesAsync(16);
      const randomString = Array.from(randomBytes, byte => 
        byte.toString(16).padStart(2, '0')
      ).join('');
      
      const sessionData = `${timestamp}-${randomString}`;
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256, 
        sessionData
      );
    } catch (error) {
      console.error('Generate session token error:', error);
      return null;
    }
  }

  // Check if app requires PIN authentication for specific user
  async requiresPinAuth(userId = null) {
    try {
      const id = userId || this.currentUserId;
      const isSetup = await this.isPinSetup(id);
      const lockoutCheck = await this.checkLockout(id);
      
      return {
        required: isSetup,
        lockedOut: !lockoutCheck.allowed,
        remainingLockoutTime: lockoutCheck.remainingTime || 0
      };
    } catch (error) {
      console.error('Requires PIN auth error:', error);
      return {
        required: false,
        lockedOut: false,
        remainingLockoutTime: 0
      };
    }
  }

  // Debug: List all stored PIN keys (development only)
  async debugListAllPinKeys() {
    if (!__DEV__) return;
    
    try {
      const allKeys = await SecureStore.getAllKeysAsync?.() || [];
      const pinKeys = allKeys.filter(key => 
        key.includes('user_pin_') || key.includes('pin_')
      );
      
      console.log('🔍 All PIN keys in SecureStore:', pinKeys);
      
      for (const key of pinKeys) {
        const value = await SecureStore.getItemAsync(key);
        console.log(`🔑 ${key}: ${value ? 'EXISTS' : 'NULL'}`);
      }
    } catch (error) {
      console.error('Debug list keys error:', error);
    }
  }
}

export default new SecurityService();