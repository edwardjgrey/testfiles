// src/services/securityService.js
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Alert } from 'react-native';

class SecurityService {
  constructor() {
    this.PIN_KEY = 'user_pin_hash';
    this.PIN_SALT_KEY = 'user_pin_salt';
    this.PIN_SETUP_KEY = 'pin_setup_complete';
    this.FAILED_ATTEMPTS_KEY = 'pin_failed_attempts';
    this.LOCKOUT_TIME_KEY = 'pin_lockout_time';
    this.MAX_ATTEMPTS = 5;
    this.LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
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

      // Validate PIN
      if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        throw new Error('PIN must be exactly 6 digits');
      }

      // Generate salt and hash PIN
      const salt = await this.generateSalt();
      const hashedPin = await this.hashPin(pin, salt);

      // Store securely
      await SecureStore.setItemAsync(this.PIN_KEY, hashedPin);
      await SecureStore.setItemAsync(this.PIN_SALT_KEY, salt);
      await SecureStore.setItemAsync(this.PIN_SETUP_KEY, 'true');

      // Reset any failed attempts
      await this.resetFailedAttempts();

      console.log('✅ PIN setup completed successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ PIN setup failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify PIN
  async verifyPin(enteredPin) {
    try {
      console.log('🔍 Verifying PIN');

      // Check if user is locked out
      const lockoutCheck = await this.checkLockout();
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
        await this.incrementFailedAttempts();
        return { success: false, error: 'Invalid PIN format' };
      }

      // Get stored PIN hash and salt
      const storedHash = await SecureStore.getItemAsync(this.PIN_KEY);
      const salt = await SecureStore.getItemAsync(this.PIN_SALT_KEY);

      if (!storedHash || !salt) {
        return { success: false, error: 'PIN not set up' };
      }

      // Hash entered PIN with stored salt
      const enteredHash = await this.hashPin(enteredPin, salt);

      // Compare hashes
      if (enteredHash === storedHash) {
        console.log('✅ PIN verified successfully');
        await this.resetFailedAttempts();
        return { success: true };
      } else {
        console.log('❌ PIN verification failed');
        await this.incrementFailedAttempts();
        
        const attempts = await this.getFailedAttempts();
        const remainingAttempts = this.MAX_ATTEMPTS - attempts;
        
        if (remainingAttempts <= 0) {
          await this.setLockout();
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

  // Check if PIN is set up
  async isPinSetup() {
    try {
      const isSetup = await SecureStore.getItemAsync(this.PIN_SETUP_KEY);
      return isSetup === 'true';
    } catch (error) {
      console.error('Check PIN setup error:', error);
      return false;
    }
  }

  // Change PIN (requires old PIN)
  async changePin(oldPin, newPin, userId) {
    try {
      console.log('🔄 Changing PIN for user:', userId);

      // Verify old PIN first
      const oldPinVerification = await this.verifyPin(oldPin);
      if (!oldPinVerification.success) {
        return { success: false, error: 'Current PIN is incorrect' };
      }

      // Setup new PIN
      return await this.setupPin(newPin, userId);
    } catch (error) {
      console.error('❌ PIN change failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Remove PIN (requires PIN verification)
  async removePin(pin) {
    try {
      console.log('🗑️ Removing PIN');

      // Verify PIN first
      const verification = await this.verifyPin(pin);
      if (!verification.success) {
        return { success: false, error: 'Incorrect PIN' };
      }

      // Remove all PIN-related data
      await SecureStore.deleteItemAsync(this.PIN_KEY);
      await SecureStore.deleteItemAsync(this.PIN_SALT_KEY);
      await SecureStore.deleteItemAsync(this.PIN_SETUP_KEY);
      await this.resetFailedAttempts();

      console.log('✅ PIN removed successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ PIN removal failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Failed attempts management
  async getFailedAttempts() {
    try {
      const attempts = await SecureStore.getItemAsync(this.FAILED_ATTEMPTS_KEY);
      return parseInt(attempts) || 0;
    } catch (error) {
      return 0;
    }
  }

  async incrementFailedAttempts() {
    try {
      const current = await this.getFailedAttempts();
      await SecureStore.setItemAsync(this.FAILED_ATTEMPTS_KEY, (current + 1).toString());
    } catch (error) {
      console.error('Increment failed attempts error:', error);
    }
  }

  async resetFailedAttempts() {
    try {
      await SecureStore.deleteItemAsync(this.FAILED_ATTEMPTS_KEY);
      await SecureStore.deleteItemAsync(this.LOCKOUT_TIME_KEY);
    } catch (error) {
      console.error('Reset failed attempts error:', error);
    }
  }

  // Lockout management
  async setLockout() {
    try {
      const lockoutTime = Date.now() + this.LOCKOUT_DURATION;
      await SecureStore.setItemAsync(this.LOCKOUT_TIME_KEY, lockoutTime.toString());
    } catch (error) {
      console.error('Set lockout error:', error);
    }
  }

  async checkLockout() {
    try {
      const lockoutTimeStr = await SecureStore.getItemAsync(this.LOCKOUT_TIME_KEY);
      
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
        await this.resetFailedAttempts();
        return { allowed: true };
      }
    } catch (error) {
      console.error('Check lockout error:', error);
      return { allowed: true };
    }
  }

  // Get security status
  async getSecurityStatus() {
    try {
      const isPinSetup = await this.isPinSetup();
      const failedAttempts = await this.getFailedAttempts();
      const lockoutCheck = await this.checkLockout();

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

  // Emergency PIN reset (for development/testing)
  async emergencyReset() {
    try {
      console.log('🚨 Emergency PIN reset');
      await SecureStore.deleteItemAsync(this.PIN_KEY);
      await SecureStore.deleteItemAsync(this.PIN_SALT_KEY);
      await SecureStore.deleteItemAsync(this.PIN_SETUP_KEY);
      await this.resetFailedAttempts();
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

  // Check if app requires PIN authentication
  async requiresPinAuth() {
    const isSetup = await this.isPinSetup();
    const lockoutCheck = await this.checkLockout();
    
    return {
      required: isSetup,
      lockedOut: !lockoutCheck.allowed,
      remainingLockoutTime: lockoutCheck.remainingTime || 0
    };
  }
}

export default new SecurityService();