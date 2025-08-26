// src/services/securityService.js - FIXED LOCKOUT SYSTEM
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

class SecurityService {
  constructor() {
    this.currentUserId = null;
    this.MAX_ATTEMPTS = 5;
    this.LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  }

  setCurrentUser(userId) {
    console.log('🔐 Setting current user for PIN operations:', userId);
    this.currentUserId = userId;
  }

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
      
      this.setCurrentUser(userId);
      const keys = this.getUserKeys(userId);

      if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        throw new Error('PIN must be exactly 6 digits');
      }

      const existingPin = await SecureStore.getItemAsync(keys.PIN_KEY);
      if (existingPin) {
        console.log('⚠️ PIN already exists for user:', userId, '- removing old PIN first');
        await this.removeExistingPin(userId);
      }

      const salt = await this.generateSalt();
      const hashedPin = await this.hashPin(pin, salt);

      console.log('💾 Storing PIN with keys:', {
        pinKey: keys.PIN_KEY,
        saltKey: keys.PIN_SALT_KEY,
        setupKey: keys.PIN_SETUP_KEY
      });

      await SecureStore.setItemAsync(keys.PIN_KEY, hashedPin);
      await SecureStore.setItemAsync(keys.PIN_SALT_KEY, salt);
      await SecureStore.setItemAsync(keys.PIN_SETUP_KEY, 'true');

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

  // FIX 1: Enhanced PIN verification with better lockout handling
  async verifyPin(enteredPin, userId = null) {
    try {
      const id = userId || this.currentUserId;
      if (!id) {
        throw new Error('No user ID provided for PIN verification');
      }

      console.log('🔍 Verifying PIN for user:', id);
      const keys = this.getUserKeys(id);

      // FIX 2: Enhanced lockout check with detailed logging
      const lockoutCheck = await this.checkLockout(id);
      console.log('🔒 Lockout check result:', lockoutCheck);
      
      if (!lockoutCheck.allowed) {
        const remainingMinutes = Math.ceil(lockoutCheck.remainingTime / 60000);
        console.log('🚫 User is locked out for', remainingMinutes, 'more minutes');
        
        return {
          success: false,
          error: `Too many failed attempts. Try again in ${remainingMinutes} minutes.`,
          lockedOut: true,
          remainingTime: lockoutCheck.remainingTime
        };
      }

      if (!enteredPin || enteredPin.length !== 6 || !/^\d{6}$/.test(enteredPin)) {
        await this.incrementFailedAttempts(id);
        return { success: false, error: 'Invalid PIN format' };
      }

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

      const enteredHash = await this.hashPin(enteredPin, salt);

      console.log('🔍 Hash comparison:', {
        enteredPinLength: enteredPin.length,
        storedHashLength: storedHash.length,
        enteredHashLength: enteredHash.length,
        hashesMatch: enteredHash === storedHash
      });

      if (enteredHash === storedHash) {
        console.log('✅ PIN verified successfully for user:', id);
        await this.resetFailedAttempts(id);
        return { success: true };
      } else {
        console.log('❌ PIN verification failed for user:', id);
        
        // FIX 3: Enhanced failed attempt handling
        const newAttempts = await this.incrementFailedAttempts(id);
        const remainingAttempts = this.MAX_ATTEMPTS - newAttempts;
        
        console.log('📊 Failed attempts status:', {
          newAttempts,
          remainingAttempts,
          maxAttempts: this.MAX_ATTEMPTS
        });
        
        if (remainingAttempts <= 0) {
          console.log('🚨 Maximum attempts reached - setting lockout');
          await this.setLockout(id);
          
          return {
            success: false,
            error: 'Too many failed attempts. Account locked for 30 minutes.',
            lockedOut: true,
            remainingTime: this.LOCKOUT_DURATION
          };
        }
        
        return {
          success: false,
          error: `Incorrect PIN. ${remainingAttempts} attempts remaining.`,
          remainingAttempts: remainingAttempts
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

  // FIX 4: Enhanced failed attempts management with better counting
  async getFailedAttempts(userId = null) {
    try {
      const id = userId || this.currentUserId;
      const keys = this.getUserKeys(id);
      const attempts = await SecureStore.getItemAsync(keys.FAILED_ATTEMPTS_KEY);
      const count = parseInt(attempts) || 0;
      
      console.log('📊 Current failed attempts for user', id, ':', count);
      return count;
    } catch (error) {
      console.error('Get failed attempts error:', error);
      return 0;
    }
  }

  async incrementFailedAttempts(userId = null) {
    try {
      const id = userId || this.currentUserId;
      const keys = this.getUserKeys(id);
      const current = await this.getFailedAttempts(id);
      const newCount = current + 1;
      
      await SecureStore.setItemAsync(keys.FAILED_ATTEMPTS_KEY, newCount.toString());
      console.log('📈 Incremented failed attempts for user:', id, 'from', current, 'to', newCount);
      
      return newCount;
    } catch (error) {
      console.error('Increment failed attempts error:', error);
      return 0;
    }
  }

  async resetFailedAttempts(userId = null) {
    try {
      const id = userId || this.currentUserId;
      const keys = this.getUserKeys(id);
      
      await SecureStore.deleteItemAsync(keys.FAILED_ATTEMPTS_KEY);
      await SecureStore.deleteItemAsync(keys.LOCKOUT_TIME_KEY);
      
      console.log('🔄 Reset failed attempts and lockout for user:', id);
    } catch (error) {
      console.error('Reset failed attempts error:', error);
    }
  }

  // FIX 5: Enhanced lockout management with precise timing
  async setLockout(userId = null) {
    try {
      const id = userId || this.currentUserId;
      const keys = this.getUserKeys(id);
      const lockoutTime = Date.now() + this.LOCKOUT_DURATION;
      
      await SecureStore.setItemAsync(keys.LOCKOUT_TIME_KEY, lockoutTime.toString());
      
      console.log('🔒 Set lockout for user:', id, {
        lockoutDurationMs: this.LOCKOUT_DURATION,
        lockoutDurationMin: this.LOCKOUT_DURATION / 60000,
        lockoutEndTime: new Date(lockoutTime).toLocaleString(),
        currentTime: new Date().toLocaleString()
      });
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
        console.log('🔓 No lockout set for user:', id);
        return { allowed: true };
      }

      const lockoutTime = parseInt(lockoutTimeStr);
      const now = Date.now();
      const remainingTime = lockoutTime - now;

      console.log('🔍 Lockout check details:', {
        userId: id,
        lockoutTime: new Date(lockoutTime).toLocaleString(),
        currentTime: new Date(now).toLocaleString(),
        remainingTimeMs: remainingTime,
        remainingTimeMin: Math.ceil(remainingTime / 60000),
        isLocked: remainingTime > 0
      });

      if (remainingTime > 0) {
        return {
          allowed: false,
          remainingTime: remainingTime
        };
      } else {
        console.log('🔓 Lockout expired, auto-resetting for user:', id);
        await this.resetFailedAttempts(id);
        return { allowed: true };
      }
    } catch (error) {
      console.error('Check lockout error:', error);
      return { allowed: true };
    }
  }

  // FIX 6: Enhanced security status with comprehensive information
  async getSecurityStatus(userId = null) {
    try {
      const id = userId || this.currentUserId;
      if (!id) {
        console.log('⚠️ No user ID for security status check');
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

      const status = {
        pinSetup: isPinSetup,
        failedAttempts: failedAttempts,
        isLockedOut: !lockoutCheck.allowed,
        lockoutRemainingTime: lockoutCheck.remainingTime || 0
      };

      console.log('📊 Complete security status for user:', id, status);
      return status;
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

  // Change PIN (requires old PIN)
  async changePin(oldPin, newPin, userId) {
    try {
      console.log('🔄 Changing PIN for user:', userId);
      
      this.setCurrentUser(userId);

      const oldPinVerification = await this.verifyPin(oldPin, userId);
      if (!oldPinVerification.success) {
        return { success: false, error: 'Current PIN is incorrect' };
      }

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

      const verification = await this.verifyPin(pin, id);
      if (!verification.success) {
        return { success: false, error: 'Incorrect PIN' };
      }

      await this.removeExistingPin(id);

      console.log('✅ PIN removed successfully for user:', id);
      return { success: true };
    } catch (error) {
      console.error('❌ PIN removal failed:', error);
      return { success: false, error: error.message };
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

  // FIX 7: Force unlock method for testing/debugging
  async forceUnlock(userId) {
    try {
      console.log('🚨 Force unlocking user:', userId);
      
      await this.resetFailedAttempts(userId);
      
      console.log('✅ Force unlock completed for user:', userId);
      return { success: true };
    } catch (error) {
      console.error('Force unlock error:', error);
      return { success: false, error: error.message };
    }
  }

  // Emergency PIN reset (removes ALL user PINs)
  async emergencyReset() {
    try {
      console.log('🚨 Emergency PIN reset - removing ALL user PINs');
      
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

  // FIX 8: Debug method to check lockout status in real-time
  async debugLockoutStatus(userId) {
    if (!__DEV__) return;
    
    try {
      const keys = this.getUserKeys(userId);
      const lockoutTimeStr = await SecureStore.getItemAsync(keys.LOCKOUT_TIME_KEY);
      const failedAttempts = await this.getFailedAttempts(userId);
      const now = Date.now();
      
      if (lockoutTimeStr) {
        const lockoutTime = parseInt(lockoutTimeStr);
        const remaining = Math.max(0, lockoutTime - now);
        
        console.log('🔍 DEBUG LOCKOUT STATUS:', {
          userId,
          failedAttempts,
          lockoutEndTime: new Date(lockoutTime).toLocaleString(),
          currentTime: new Date(now).toLocaleString(),
          remainingMs: remaining,
          remainingMinutes: Math.ceil(remaining / 60000),
          isCurrentlyLocked: remaining > 0
        });
      } else {
        console.log('🔍 DEBUG LOCKOUT STATUS:', {
          userId,
          failedAttempts,
          lockoutTime: 'NOT_SET',
          isCurrentlyLocked: false
        });
      }
    } catch (error) {
      console.error('Debug lockout status error:', error);
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