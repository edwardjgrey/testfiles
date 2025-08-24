// src/services/securityService.js - Complete Production Security Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

class SecurityService {
  constructor() {
    this.currentUserId = null;
    this.SECURITY_PREFIX = 'security_';
    this.PIN_KEY = 'pin_data';
    this.ATTEMPTS_KEY = 'failed_attempts';
    this.LOCKOUT_KEY = 'lockout_time';
    this.MAX_ATTEMPTS = 5;
    this.LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
  }

  // Set current user ID for security operations
  setCurrentUser(userId) {
    this.currentUserId = userId;
    console.log('🔐 SecurityService: Current user set to', userId);
  }

  // Clear current user
  clearCurrentUser() {
    this.currentUserId = null;
    console.log('🔐 SecurityService: Current user cleared');
  }

  // Get storage key for user-specific data
  getUserKey(key, userId = null) {
    const userIdToUse = userId || this.currentUserId;
    if (!userIdToUse) {
      throw new Error('User ID is required for security operations');
    }
    return `${this.SECURITY_PREFIX}${userIdToUse}_${key}`;
  }

  // Generate salt for password hashing
  generateSalt() {
    return CryptoJS.lib.WordArray.random(128/8).toString();
  }

  // Hash PIN with salt
  hashPin(pin, salt) {
    return CryptoJS.PBKDF2(pin, salt, {
      keySize: 256/32,
      iterations: 10000
    }).toString();
  }

  // Validate PIN format and strength
  validatePinFormat(pin) {
    if (!pin || typeof pin !== 'string') {
      return {
        valid: false,
        error: 'PIN must be a string'
      };
    }

    if (pin.length !== 6) {
      return {
        valid: false,
        error: 'PIN must be exactly 6 digits'
      };
    }

    if (!/^\d{6}$/.test(pin)) {
      return {
        valid: false,
        error: 'PIN must contain only numbers'
      };
    }

    // Check for weak PINs
    const weakPins = [
      '123456', '654321', '111111', '222222', '333333', 
      '444444', '555555', '666666', '777777', '888888', 
      '999999', '000000', '121212', '101010', '123123',
      '456789', '987654', '147258', '852741', '159753'
    ];

    if (weakPins.includes(pin)) {
      return {
        valid: false,
        error: 'This PIN is too common. Please choose a more secure PIN.'
      };
    }

    // Check for sequential patterns
    const isSequential = /(\d)\1{2,}|012|123|234|345|456|567|678|789|987|876|765|654|543|432|321|210/.test(pin);
    if (isSequential) {
      return {
        valid: false,
        error: 'PIN cannot contain sequential or repeating patterns. Please choose a more secure PIN.'
      };
    }

    return { valid: true };
  }

  // Setup PIN for user
  async setupPin(pin, userId = null) {
    try {
      const userIdToUse = userId || this.currentUserId;
      console.log('🔐 Setting up PIN for user:', userIdToUse);

      if (!userIdToUse) {
        throw new Error('User ID is required for PIN setup');
      }

      // Validate PIN
      const validation = this.validatePinFormat(pin);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Generate salt and hash PIN
      const salt = this.generateSalt();
      const hashedPin = this.hashPin(pin, salt);

      // Create PIN data
      const pinData = {
        hash: hashedPin,
        salt: salt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store PIN data
      await AsyncStorage.setItem(
        this.getUserKey(this.PIN_KEY, userIdToUse), 
        JSON.stringify(pinData)
      );

      // Clear any existing failed attempts
      await this.clearFailedAttempts(userIdToUse);

      console.log('✅ PIN setup successful for user:', userIdToUse);
      return { success: true };

    } catch (error) {
      console.error('❌ PIN setup error:', error);
      return {
        success: false,
        error: error.message || 'Failed to setup PIN'
      };
    }
  }

  // Verify PIN
  async verifyPin(enteredPin, userId = null) {
    try {
      const userIdToUse = userId || this.currentUserId;
      console.log('🔐 Verifying PIN for user:', userIdToUse);

      if (!userIdToUse) {
        throw new Error('User ID is required for PIN verification');
      }

      // Check if user is locked out
      const lockoutStatus = await this.isLockedOut(userIdToUse);
      if (lockoutStatus.isLockedOut) {
        return {
          success: false,
          lockedOut: true,
          remainingTime: lockoutStatus.remainingTime,
          error: `Account is locked. Try again in ${Math.ceil(lockoutStatus.remainingTime / 60000)} minutes.`
        };
      }

      // Get stored PIN data
      const pinData = await this.getPinData(userIdToUse);
      if (!pinData) {
        return {
          success: false,
          error: 'PIN not found. Please set up your PIN first.'
        };
      }

      // Validate entered PIN format
      const validation = this.validatePinFormat(enteredPin);
      if (!validation.valid) {
        await this.recordFailedAttempt(userIdToUse);
        return {
          success: false,
          error: validation.error
        };
      }

      // Hash entered PIN with stored salt
      const hashedEnteredPin = this.hashPin(enteredPin, pinData.salt);

      if (hashedEnteredPin === pinData.hash) {
        // PIN is correct - clear failed attempts
        await this.clearFailedAttempts(userIdToUse);
        console.log('✅ PIN verification successful for user:', userIdToUse);
        return { success: true };
      } else {
        // PIN is incorrect - record failed attempt
        const attemptsResult = await this.recordFailedAttempt(userIdToUse);
        console.log('❌ PIN verification failed for user:', userIdToUse);
        
        if (attemptsResult.lockedOut) {
          return {
            success: false,
            lockedOut: true,
            remainingTime: this.LOCKOUT_DURATION,
            error: 'Too many failed attempts. Account is locked for 30 minutes.'
          };
        } else {
          const remainingAttempts = this.MAX_ATTEMPTS - attemptsResult.attempts;
          return {
            success: false,
            remainingAttempts,
            error: `Incorrect PIN. ${remainingAttempts} attempts remaining.`
          };
        }
      }

    } catch (error) {
      console.error('❌ PIN verification error:', error);
      return {
        success: false,
        error: error.message || 'PIN verification failed'
      };
    }
  }

  // Get PIN data
  async getPinData(userId = null) {
    try {
      const userIdToUse = userId || this.currentUserId;
      const pinDataString = await AsyncStorage.getItem(this.getUserKey(this.PIN_KEY, userIdToUse));
      return pinDataString ? JSON.parse(pinDataString) : null;
    } catch (error) {
      console.error('❌ Get PIN data error:', error);
      return null;
    }
  }

  // Check if PIN exists for user
  async hasPinSetup(userId = null) {
    try {
      const pinData = await this.getPinData(userId);
      return pinData !== null;
    } catch (error) {
      console.error('❌ Check PIN setup error:', error);
      return false;
    }
  }

  // Record failed attempt
  async recordFailedAttempt(userId = null) {
    try {
      const userIdToUse = userId || this.currentUserId;
      const attemptsKey = this.getUserKey(this.ATTEMPTS_KEY, userIdToUse);
      
      // Get current attempts
      const currentAttemptsString = await AsyncStorage.getItem(attemptsKey);
      const currentAttempts = currentAttemptsString ? parseInt(currentAttemptsString) : 0;
      const newAttempts = currentAttempts + 1;

      // Store new attempts count
      await AsyncStorage.setItem(attemptsKey, newAttempts.toString());

      console.log(`🔐 Failed attempt recorded for user ${userIdToUse}: ${newAttempts}/${this.MAX_ATTEMPTS}`);

      // Check if user should be locked out
      if (newAttempts >= this.MAX_ATTEMPTS) {
        await this.lockoutUser(userIdToUse);
        return {
          attempts: newAttempts,
          lockedOut: true
        };
      }

      return {
        attempts: newAttempts,
        lockedOut: false
      };

    } catch (error) {
      console.error('❌ Record failed attempt error:', error);
      return { attempts: 0, lockedOut: false };
    }
  }

  // Clear failed attempts
  async clearFailedAttempts(userId = null) {
    try {
      const userIdToUse = userId || this.currentUserId;
      await AsyncStorage.removeItem(this.getUserKey(this.ATTEMPTS_KEY, userIdToUse));
      await AsyncStorage.removeItem(this.getUserKey(this.LOCKOUT_KEY, userIdToUse));
      console.log('🔐 Failed attempts cleared for user:', userIdToUse);
    } catch (error) {
      console.error('❌ Clear failed attempts error:', error);
    }
  }

  // Lockout user
  async lockoutUser(userId = null) {
    try {
      const userIdToUse = userId || this.currentUserId;
      const lockoutTime = Date.now() + this.LOCKOUT_DURATION;
      await AsyncStorage.setItem(
        this.getUserKey(this.LOCKOUT_KEY, userIdToUse), 
        lockoutTime.toString()
      );
      console.log('🔐 User locked out until:', new Date(lockoutTime).toISOString());
    } catch (error) {
      console.error('❌ Lockout user error:', error);
    }
  }

  // Check if user is locked out
  async isLockedOut(userId = null) {
    try {
      const userIdToUse = userId || this.currentUserId;
      const lockoutTimeString = await AsyncStorage.getItem(
        this.getUserKey(this.LOCKOUT_KEY, userIdToUse)
      );

      if (!lockoutTimeString) {
        return { isLockedOut: false, remainingTime: 0 };
      }

      const lockoutTime = parseInt(lockoutTimeString);
      const currentTime = Date.now();

      if (currentTime < lockoutTime) {
        return { 
          isLockedOut: true, 
          remainingTime: lockoutTime - currentTime 
        };
      } else {
        // Lockout expired, clear it
        await this.clearFailedAttempts(userIdToUse);
        return { isLockedOut: false, remainingTime: 0 };
      }

    } catch (error) {
      console.error('❌ Check lockout error:', error);
      return { isLockedOut: false, remainingTime: 0 };
    }
  }

  // Get security status
  async getSecurityStatus(userId = null) {
    try {
      const userIdToUse = userId || this.currentUserId;
      
      const [pinData, attemptsString, lockoutStatus] = await Promise.all([
        this.getPinData(userIdToUse),
        AsyncStorage.getItem(this.getUserKey(this.ATTEMPTS_KEY, userIdToUse)),
        this.isLockedOut(userIdToUse)
      ]);

      const failedAttempts = attemptsString ? parseInt(attemptsString) : 0;

      return {
        hasPin: pinData !== null,
        failedAttempts,
        isLockedOut: lockoutStatus.isLockedOut,
        lockoutRemainingTime: lockoutStatus.remainingTime,
        pinCreatedAt: pinData?.createdAt || null,
        pinUpdatedAt: pinData?.updatedAt || null
      };

    } catch (error) {
      console.error('❌ Get security status error:', error);
      return {
        hasPin: false,
        failedAttempts: 0,
        isLockedOut: false,
        lockoutRemainingTime: 0,
        pinCreatedAt: null,
        pinUpdatedAt: null
      };
    }
  }

  // Change PIN (requires current PIN)
  async changePin(currentPin, newPin, userId = null) {
    try {
      const userIdToUse = userId || this.currentUserId;
      console.log('🔐 Changing PIN for user:', userIdToUse);

      // Verify current PIN first
      const currentPinResult = await this.verifyPin(currentPin, userIdToUse);
      if (!currentPinResult.success) {
        return currentPinResult;
      }

      // Setup new PIN
      return await this.setupPin(newPin, userIdToUse);

    } catch (error) {
      console.error('❌ Change PIN error:', error);
      return {
        success: false,
        error: error.message || 'Failed to change PIN'
      };
    }
  }

  // Remove PIN (requires current PIN)
  async removePin(currentPin, userId = null) {
    try {
      const userIdToUse = userId || this.currentUserId;
      console.log('🔐 Removing PIN for user:', userIdToUse);

      // Verify current PIN first
      const currentPinResult = await this.verifyPin(currentPin, userIdToUse);
      if (!currentPinResult.success) {
        return currentPinResult;
      }

      // Remove PIN data
      await AsyncStorage.removeItem(this.getUserKey(this.PIN_KEY, userIdToUse));
      await this.clearFailedAttempts(userIdToUse);

      console.log('✅ PIN removed for user:', userIdToUse);
      return { success: true };

    } catch (error) {
      console.error('❌ Remove PIN error:', error);
      return {
        success: false,
        error: error.message || 'Failed to remove PIN'
      };
    }
  }

  // Reset all security data for user (for development/testing)
  async resetUserSecurity(userId = null) {
    try {
      const userIdToUse = userId || this.currentUserId;
      console.log('🔄 Resetting security data for user:', userIdToUse);

      await Promise.all([
        AsyncStorage.removeItem(this.getUserKey(this.PIN_KEY, userIdToUse)),
        AsyncStorage.removeItem(this.getUserKey(this.ATTEMPTS_KEY, userIdToUse)),
        AsyncStorage.removeItem(this.getUserKey(this.LOCKOUT_KEY, userIdToUse))
      ]);

      console.log('✅ Security data reset for user:', userIdToUse);
      return { success: true };

    } catch (error) {
      console.error('❌ Reset security error:', error);
      return {
        success: false,
        error: error.message || 'Failed to reset security data'
      };
    }
  }

  // Get all security keys for a user (for debugging)
  async getUserSecurityKeys(userId = null) {
    try {
      const userIdToUse = userId || this.currentUserId;
      const keys = [
        this.getUserKey(this.PIN_KEY, userIdToUse),
        this.getUserKey(this.ATTEMPTS_KEY, userIdToUse),
        this.getUserKey(this.LOCKOUT_KEY, userIdToUse)
      ];
      
      const data = {};
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        data[key] = value;
      }
      
      return data;
    } catch (error) {
      console.error('❌ Get security keys error:', error);
      return {};
    }
  }
}

export default new SecurityService();