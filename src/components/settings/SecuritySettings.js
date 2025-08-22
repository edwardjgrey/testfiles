// src/services/securityService.js - FIXED VERSION with user-specific PIN storage
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Alert } from 'react-native';

class SecurityService {
  constructor() {
    // Base keys - will be combined with user ID for user-specific storage
    this.PIN_KEY_BASE = 'user_pin_hash';
    this.PIN_SALT_KEY_BASE = 'user_pin_salt';
    this.PIN_SETUP_KEY_BASE = 'pin_setup_complete';
    this.FAILED_ATTEMPTS_KEY_BASE = 'pin_failed_attempts';
    this.LOCKOUT_TIME_KEY_BASE = 'pin_lockout_time';
    
    this.MAX_ATTEMPTS = 5;
    this.LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  }

  // Helper function to generate user-specific keys
  getUserSpecificKey(baseKey, userId) {
    if (!userId) {
      throw new Error('User ID is required for PIN operations');
    }
    return `${baseKey}_${userId}`;
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

  // Setup PIN for a specific user - FIXED VERSION
  async setupPin(pin, userId) {
    try {
      console.log('🔐 Setting up PIN for user:', userId);

      if (!userId) {
        throw new Error('User ID is required to setup PIN');
      }

      // Validate PIN
      if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        throw new Error('PIN must be exactly 6 digits');
      }

      // Generate user-specific keys
      const pinKey = this.getUserSpecificKey(this.PIN_KEY_BASE, userId);
      const saltKey = this.getUserSpecificKey(this.PIN_SALT_KEY_BASE, userId);
      const setupKey = this.getUserSpecificKey(this.PIN_SETUP_KEY_BASE, userId);

      // Generate salt and hash PIN
      const salt = await this.generateSalt();
      const hashedPin = await this.hashPin(pin, salt);

      // Store securely with user-specific keys
      await SecureStore.setItemAsync(pinKey, hashedPin);
      await SecureStore.setItemAsync(saltKey, salt);
      await SecureStore.setItemAsync(setupKey, 'true');

      // Reset any failed attempts for this user
      await this.resetFailedAttempts(userId);

      console.log('✅ PIN setup completed successfully for user:', userId);
      return { success: true };
    } catch (error) {
      console.error('❌ PIN setup failed for user:', userId, error);
      return { success: false, error: error.message };
    }
  }

  // Verify PIN for a specific user - FIXED VERSION
  async verifyPin(enteredPin, userId) {
    try {
      console.log('🔍 Verifying PIN for user:', userId);

      if (!userId) {
        throw new Error('User ID is required to verify PIN');
      }

      // Check if user is locked out
      const lockoutCheck = await this.checkLockout(userId);
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
        await this.incrementFailedAttempts(userId);
        return { success: false, error: 'Invalid PIN format' };
      }

      // Generate user-specific keys
      const pinKey = this.getUserSpecificKey(this.PIN_KEY_BASE, userId);
      const saltKey = this.getUserSpecificKey(this.PIN_SALT_KEY_BASE, userId);

      // Get stored PIN hash and salt for this user
      const storedHash = await SecureStore.getItemAsync(pinKey);
      const salt = await SecureStore.getItemAsync(saltKey);

      if (!storedHash || !salt) {
        return { success: false, error: 'PIN not set up for this user' };
      }

      // Hash entered PIN with stored salt
      const enteredHash = await this.hashPin(enteredPin, salt);

      // Compare hashes
      if (enteredHash === storedHash) {
        console.log('✅ PIN verified successfully for user:', userId);
        await this.resetFailedAttempts(userId);
        return { success: true };
      } else {
        console.log('❌ PIN verification failed for user:', userId);
        await this.incrementFailedAttempts(userId);
        
        const attempts = await this.getFailedAttempts(userId);
        const remainingAttempts = this.MAX_ATTEMPTS - attempts;
        
        if (remainingAttempts <= 0) {
          await this.setLockout(userId);
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
      console.error('❌ PIN verification error for user:', userId, error);
      return { success: false, error: 'PIN verification failed' };
    }
  }

  // Check if PIN is set up for a specific user - FIXED VERSION
  async isPinSetup(userId) {
    try {
      if (!userId) {
        return false;
      }
      
      const setupKey = this.getUserSpecificKey(this.PIN_SETUP_KEY_BASE, userId);
      const isSetup = await SecureStore.getItemAsync(setupKey);
      return isSetup === 'true';
    } catch (error) {
      console.error('Check PIN setup error for user:', userId, error);
      return false;
    }
  }

  // Change PIN for a specific user - FIXED VERSION
  async changePin(oldPin, newPin, userId) {
    try {
      console.log('🔄 Changing PIN for user:', userId);

      if (!userId) {
        throw new Error('User ID is required to change PIN');
      }

      // Verify old PIN first
      const oldPinVerification = await this.verifyPin(oldPin, userId);
      if (!oldPinVerification.success) {
        return { success: false, error: 'Current PIN is incorrect' };
      }

      // Setup new PIN
      return await this.setupPin(newPin, userId);
    } catch (error) {
      console.error('❌ PIN change failed for user:', userId, error);
      return { success: false, error: error.message };
    }
  }

  // Remove PIN for a specific user - FIXED VERSION
  async removePin(pin, userId) {
    try {
      console.log('🗑️ Removing PIN for user:', userId);

      if (!userId) {
        throw new Error('User ID is required to remove PIN');
      }

      // Verify PIN first
      const verification = await this.verifyPin(pin, userId);
      if (!verification.success) {
        return { success: false, error: 'Incorrect PIN' };
      }

      // Generate user-specific keys
      const pinKey = this.getUserSpecificKey(this.PIN_KEY_BASE, userId);
      const saltKey = this.getUserSpecificKey(this.PIN_SALT_KEY_BASE, userId);
      const setupKey = this.getUserSpecificKey(this.PIN_SETUP_KEY_BASE, userId);

      // Remove all PIN-related data for this user
      await SecureStore.deleteItemAsync(pinKey);
      await SecureStore.deleteItemAsync(saltKey);
      await SecureStore.deleteItemAsync(setupKey);
      await this.resetFailedAttempts(userId);

      console.log('✅ PIN removed successfully for user:', userId);
      return { success: true };
    } catch (error) {
      console.error('❌ PIN removal failed for user:', userId, error);
      return { success: false, error: error.message };
    }
  }

  // Failed attempts management for specific user - FIXED VERSION
  async getFailedAttempts(userId) {
    try {
      if (!userId) return 0;
      
      const attemptsKey = this.getUserSpecificKey(this.FAILED_ATTEMPTS_KEY_BASE, userId);
      const attempts = await SecureStore.getItemAsync(attemptsKey);
      return parseInt(attempts) || 0;
    } catch (error) {
      return 0;
    }
  }

  async incrementFailedAttempts(userId) {
    try {
      if (!userId) return;
      
      const attemptsKey = this.getUserSpecificKey(this.FAILED_ATTEMPTS_KEY_BASE, userId);
      const current = await this.getFailedAttempts(userId);
      await SecureStore.setItemAsync(attemptsKey, (current + 1).toString());
    } catch (error) {
      console.error('Increment failed attempts error for user:', userId, error);
    }
  }

  async resetFailedAttempts(userId) {
    try {
      if (!userId) return;
      
      const attemptsKey = this.getUserSpecificKey(this.FAILED_ATTEMPTS_KEY_BASE, userId);
      const lockoutKey = this.getUserSpecificKey(this.LOCKOUT_TIME_KEY_BASE, userId);
      
      await SecureStore.deleteItemAsync(attemptsKey);
      await SecureStore.deleteItemAsync(lockoutKey);
    } catch (error) {
      console.error('Reset failed attempts error for user:', userId, error);
    }
  }

  // Lockout management for specific user - FIXED VERSION
  async setLockout(userId) {
    try {
      if (!userId) return;
      
      const lockoutKey = this.getUserSpecificKey(this.LOCKOUT_TIME_KEY_BASE, userId);
      const lockoutTime = Date.now() + this.LOCKOUT_DURATION;
      await SecureStore.setItemAsync(lockoutKey, lockoutTime.toString());
    } catch (error) {
      console.error('Set lockout error for user:', userId, error);
    }
  }

  async checkLockout(userId) {
    try {
      if (!userId) {
        return { allowed: true };
      }
      
      const lockoutKey = this.getUserSpecificKey(this.LOCKOUT_TIME_KEY_BASE, userId);
      const lockoutTimeStr = await SecureStore.getItemAsync(lockoutKey);
      
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
        await this.resetFailedAttempts(userId);
        return { allowed: true };
      }
    } catch (error) {
      console.error('Check lockout error for user:', userId, error);
      return { allowed: true };
    }
  }

  // Get security status for specific user - FIXED VERSION
  async getSecurityStatus(userId) {
    try {
      if (!userId) {
        return {
          pinSetup: false,
          failedAttempts: 0,
          isLockedOut: false,
          lockoutRemainingTime: 0
        };
      }

      const isPinSetup = await this.isPinSetup(userId);
      const failedAttempts = await this.getFailedAttempts(userId);
      const lockoutCheck = await this.checkLockout(userId);

      return {
        pinSetup: isPinSetup,
        failedAttempts,
        isLockedOut: !lockoutCheck.allowed,
        lockoutRemainingTime: lockoutCheck.remainingTime || 0
      };
    } catch (error) {
      console.error('Get security status error for user:', userId, error);
      return {
        pinSetup: false,
        failedAttempts: 0,
        isLockedOut: false,
        lockoutRemainingTime: 0
      };
    }
  }

  // Validate PIN format (unchanged)
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

  // Emergency PIN reset for specific user - FIXED VERSION
  async emergencyReset(userId = null) {
    try {
      console.log('🚨 Emergency PIN reset for user:', userId || 'ALL USERS');
      
      if (userId) {
        // Reset for specific user
        const pinKey = this.getUserSpecificKey(this.PIN_KEY_BASE, userId);
        const saltKey = this.getUserSpecificKey(this.PIN_SALT_KEY_BASE, userId);
        const setupKey = this.getUserSpecificKey(this.PIN_SETUP_KEY_BASE, userId);
        
        await SecureStore.deleteItemAsync(pinKey);
        await SecureStore.deleteItemAsync(saltKey);
        await SecureStore.deleteItemAsync(setupKey);
        await this.resetFailedAttempts(userId);
      } else {
        // DANGEROUS: Reset for all users (development only)
        // This is not practical in production as we don't know all user IDs
        console.warn('⚠️ Emergency reset without user ID - limited functionality');
        
        // Try to clear common patterns (this won't get everything)
        const commonKeys = [
          'user_pin_hash', 'user_pin_salt', 'pin_setup_complete',
          'pin_failed_attempts', 'pin_lockout_time'
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
      console.error('Emergency reset error:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate secure session token (unchanged)
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

  // Check if app requires PIN authentication for specific user - FIXED VERSION
  async requiresPinAuth(userId) {
    if (!userId) {
      return {
        required: false,
        lockedOut: false,
        remainingLockoutTime: 0
      };
    }

    const isSetup = await this.isPinSetup(userId);
    const lockoutCheck = await this.checkLockout(userId);
    
    return {
      required: isSetup,
      lockedOut: !lockoutCheck.allowed,
      remainingLockoutTime: lockoutCheck.remainingTime || 0
    };
  }
}

export default new SecurityService();