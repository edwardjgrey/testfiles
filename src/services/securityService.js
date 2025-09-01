// src/services/securityService.js - REAL BACKEND INTEGRATION
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import ApiService from './apiService';

class SecurityService {
  constructor() {
    this.currentUserId = null;
    this.maxAttempts = 5;
    this.lockoutDuration = 30 * 60 * 1000; // 30 minutes
  }

  // Set current user for security operations
  setCurrentUser(userId) {
    console.log('🔐 SecurityService: Setting current user to:', userId);
    this.currentUserId = userId;
  }

  // REAL PIN VALIDATION WITH BACKEND
  validatePinFormat(pin) {
    console.log('🔍 Validating PIN format');
    
    if (!pin || pin.length !== 6) {
      return {
        valid: false,
        error: 'PIN must be exactly 6 digits'
      };
    }

    // Check if PIN is all same digits (weak)
    if (/^(\d)\1{5}$/.test(pin)) {
      return {
        valid: false,
        error: 'PIN cannot be all the same digit (e.g., 111111)'
      };
    }

    // Check for sequential patterns (weak)
    if (/123456|654321|012345|987654/.test(pin)) {
      return {
        valid: false,
        error: 'PIN cannot be a sequential pattern (e.g., 123456)'
      };
    }

    // Check for common weak PINs
    const weakPins = ['000000', '111111', '222222', '333333', '444444', 
                     '555555', '666666', '777777', '888888', '999999',
                     '123456', '654321', '000001', '111222', '121212'];
    
    if (weakPins.includes(pin)) {
      return {
        valid: false,
        error: 'This PIN is too common. Please choose a more secure PIN.'
      };
    }

    return { valid: true };
  }

  // Hash PIN using SHA-256 (you might want to use bcrypt on backend instead)
  async hashPin(pin) {
    try {
      console.log('🔒 Hashing PIN');
      
      // Add salt for extra security
      const salt = await AsyncStorage.getItem(`pin_salt_${this.currentUserId}`) || 
                   await this.generateSalt();
      
      const pinWithSalt = pin + salt;
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pinWithSalt,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      
      console.log('✅ PIN hashed successfully');
      return { hash, salt };
    } catch (error) {
      console.error('❌ PIN hashing failed:', error);
      throw new Error('Failed to secure PIN');
    }
  }

  async generateSalt() {
    console.log('🧂 Generating new salt');
    const salt = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    
    if (this.currentUserId) {
      await AsyncStorage.setItem(`pin_salt_${this.currentUserId}`, salt);
    }
    
    return salt;
  }

  // REAL PIN SETUP WITH BACKEND
  async setupPin(pin, userId = null) {
    try {
      const finalUserId = userId || this.currentUserId;
      console.log('🔐 Setting up PIN for user:', finalUserId);

      if (!finalUserId) {
        throw new Error('No user ID provided for PIN setup');
      }

      // Validate PIN format
      const validation = this.validatePinFormat(pin);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Hash the PIN
      const { hash, salt } = await this.hashPin(pin);

      // Save PIN to backend
      const response = await ApiService.setupPin(finalUserId, hash);
      
      if (response.success) {
        // Store salt locally (backend stores hash)
        await AsyncStorage.setItem(`pin_salt_${finalUserId}`, salt);
        await AsyncStorage.setItem(`pin_setup_${finalUserId}`, 'true');
        
        // Reset any failed attempts
        await this.resetFailedAttempts(finalUserId);
        
        console.log('✅ PIN setup successful');
        return { success: true };
      } else {
        console.error('❌ Backend PIN setup failed:', response.error);
        return {
          success: false,
          error: response.error || 'Failed to setup PIN on server'
        };
      }

    } catch (error) {
      console.error('❌ PIN setup error:', error);
      return {
        success: false,
        error: error.message || 'Failed to setup PIN'
      };
    }
  }

  // REAL PIN VERIFICATION WITH BACKEND
  async verifyPin(pin, userId = null) {
    try {
      const finalUserId = userId || this.currentUserId;
      console.log('🔐 Verifying PIN for user:', finalUserId);

      if (!finalUserId) {
        throw new Error('No user ID provided for PIN verification');
      }

      // Check if user is locked out
      const lockoutStatus = await this.checkLockoutStatus(finalUserId);
      if (lockoutStatus.isLockedOut) {
        return {
          success: false,
          lockedOut: true,
          remainingTime: lockoutStatus.remainingTime,
          error: `Account locked. Try again in ${Math.ceil(lockoutStatus.remainingTime / 60000)} minutes.`
        };
      }

      // Hash the entered PIN with stored salt
      const salt = await AsyncStorage.getItem(`pin_salt_${finalUserId}`);
      if (!salt) {
        throw new Error('PIN not properly set up. Please set up PIN again.');
      }

      const pinWithSalt = pin + salt;
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pinWithSalt,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      // Verify with backend
      const response = await ApiService.verifyPin(finalUserId, hash);
      
      if (response.success) {
        console.log('✅ PIN verification successful');
        
        // Reset failed attempts on success
        await this.resetFailedAttempts(finalUserId);
        
        return { success: true };
      } else {
        console.log('❌ PIN verification failed');
        
        // Increment failed attempts
        const failedAttempts = await this.incrementFailedAttempts(finalUserId);
        
        if (failedAttempts >= this.maxAttempts) {
          await this.lockAccount(finalUserId);
          return {
            success: false,
            lockedOut: true,
            remainingTime: this.lockoutDuration,
            error: `Too many failed attempts. Account locked for ${this.lockoutDuration / 60000} minutes.`
          };
        }

        const remainingAttempts = this.maxAttempts - failedAttempts;
        return {
          success: false,
          remainingAttempts,
          error: `Incorrect PIN. ${remainingAttempts} attempts remaining.`
        };
      }

    } catch (error) {
      console.error('❌ PIN verification error:', error);
      
      // Still increment failed attempts even on error
      await this.incrementFailedAttempts(finalUserId || this.currentUserId);
      
      return {
        success: false,
        error: error.message || 'PIN verification failed'
      };
    }
  }

  // REAL SECURITY STATUS FROM BACKEND + LOCAL
  async getSecurityStatus(userId = null) {
    try {
      const finalUserId = userId || this.currentUserId;
      console.log('📊 Getting security status for user:', finalUserId);

      if (!finalUserId) {
        throw new Error('No user ID provided for security status');
      }

      // Get local security data
      const [pinSetup, failedAttemptsStr, lockoutTimeStr] = await AsyncStorage.multiGet([
        `pin_setup_${finalUserId}`,
        `failed_attempts_${finalUserId}`,
        `lockout_time_${finalUserId}`
      ]);

      const isSetup = pinSetup[1] === 'true';
      const failedAttempts = parseInt(failedAttemptsStr[1] || '0', 10);
      const lockoutTime = parseInt(lockoutTimeStr[1] || '0', 10);

      // Check current lockout status
      const lockoutStatus = await this.checkLockoutStatus(finalUserId);

      // Try to get additional status from backend
      let backendStatus = {};
      try {
        const userProfile = await ApiService.getUserProfile(finalUserId);
        backendStatus = userProfile.security || {};
      } catch (error) {
        console.log('⚠️ Could not fetch backend security status:', error.message);
        // Continue with local data
      }

      const status = {
        pinSetup: isSetup || backendStatus.pinSetup || false,
        failedAttempts,
        isLockedOut: lockoutStatus.isLockedOut,
        lockoutRemainingTime: lockoutStatus.remainingTime,
        lastActivity: backendStatus.lastActivity,
        ...backendStatus
      };

      console.log('📊 Security status:', status);
      return status;

    } catch (error) {
      console.error('❌ Security status error:', error);
      return {
        pinSetup: false,
        failedAttempts: 0,
        isLockedOut: false,
        lockoutRemainingTime: 0,
        error: error.message
      };
    }
  }

  // LOCKOUT MANAGEMENT
  async incrementFailedAttempts(userId) {
    const key = `failed_attempts_${userId}`;
    const current = await AsyncStorage.getItem(key);
    const attempts = parseInt(current || '0', 10) + 1;
    
    await AsyncStorage.setItem(key, attempts.toString());
    
    console.log(`⚠️ Failed attempts incremented to ${attempts} for user ${userId}`);
    return attempts;
  }

  async resetFailedAttempts(userId) {
    const keys = [
      `failed_attempts_${userId}`,
      `lockout_time_${userId}`
    ];
    
    await AsyncStorage.multiRemove(keys);
    console.log(`🔄 Failed attempts reset for user ${userId}`);
  }

  async lockAccount(userId) {
    const lockoutUntil = Date.now() + this.lockoutDuration;
    await AsyncStorage.setItem(`lockout_time_${userId}`, lockoutUntil.toString());
    
    console.log(`🔒 Account locked for user ${userId} until ${new Date(lockoutUntil).toLocaleTimeString()}`);
  }

  async checkLockoutStatus(userId) {
    const lockoutTimeStr = await AsyncStorage.getItem(`lockout_time_${userId}`);
    
    if (!lockoutTimeStr) {
      return { isLockedOut: false, remainingTime: 0 };
    }

    const lockoutTime = parseInt(lockoutTimeStr, 10);
    const now = Date.now();
    
    if (now < lockoutTime) {
      const remainingTime = lockoutTime - now;
      return { 
        isLockedOut: true, 
        remainingTime 
      };
    } else {
      // Lockout expired, clean up
      await this.resetFailedAttempts(userId);
      return { isLockedOut: false, remainingTime: 0 };
    }
  }

  // UTILITIES
  async isPinSet(userId = null) {
    const finalUserId = userId || this.currentUserId;
    const pinSetup = await AsyncStorage.getItem(`pin_setup_${finalUserId}`);
    return pinSetup === 'true';
  }

  async clearUserSecurityData(userId) {
    console.log('🧹 Clearing security data for user:', userId);
    
    const keys = [
      `pin_setup_${userId}`,
      `pin_salt_${userId}`,
      `failed_attempts_${userId}`,
      `lockout_time_${userId}`
    ];
    
    await AsyncStorage.multiRemove(keys);
  }

  // Generate secure backup codes (for future use)
  generateBackupCodes(count = 8) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substr(2, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}

export default new SecurityService();