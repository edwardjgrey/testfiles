import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Alert } from 'react-native';

class BiometricService {
  constructor() {
    this.biometricToken = null;
  }

  // Check if biometric authentication is available
  async isBiometricAvailable() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      return {
        available: hasHardware && isEnrolled,
        hasHardware,
        isEnrolled,
        supportedTypes,
        hasFaceID: supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION),
        hasFingerprint: supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT),
      };
    } catch (error) {
      console.error('Biometric availability check error:', error);
      return { available: false };
    }
  }

  // Get biometric type name for display
  getBiometricTypeName(supportedTypes) {
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Fingerprint';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    }
    return 'Biometric';
  }

  // Prompt for biometric authentication
  async authenticate(reason = 'Authenticate to access your account') {
    try {
      const biometricStatus = await this.isBiometricAvailable();
      
      if (!biometricStatus.available) {
        if (!biometricStatus.hasHardware) {
          throw new Error('Your device does not support biometric authentication');
        } else if (!biometricStatus.isEnrolled) {
          throw new Error('No biometric data is enrolled on this device');
        }
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
        requireConfirmation: false,
        disableDeviceFallback: false,
      });

      return result;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      throw error;
    }
  }

  // Setup biometric authentication for the user
  async setupBiometric(userId) {
    try {
      const biometricStatus = await this.isBiometricAvailable();
      
      if (!biometricStatus.available) {
        throw new Error('Biometric authentication is not available on this device');
      }

      const biometricTypeName = this.getBiometricTypeName(biometricStatus.supportedTypes);
      
      // Show confirmation alert
      return new Promise((resolve, reject) => {
        Alert.alert(
          `Enable ${biometricTypeName}`,
          `Use ${biometricTypeName} to quickly and securely access your Akchabar account?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve({ success: false, cancelled: true })
            },
            {
              text: 'Enable',
              onPress: async () => {
                try {
                  // Authenticate first
                  const authResult = await this.authenticate(
                    `Confirm your ${biometricTypeName} to enable biometric login`
                  );

                  if (authResult.success) {
                    // Generate secure biometric token
                    const biometricToken = await this.generateBiometricToken(userId);
                    
                    // Store token securely
                    await SecureStore.setItemAsync('biometricToken', biometricToken);
                    await SecureStore.setItemAsync('biometricUserId', userId.toString());
                    
                    this.biometricToken = biometricToken;
                    
                    resolve({ 
                      success: true, 
                      biometricToken,
                      biometricType: biometricTypeName 
                    });
                  } else {
                    resolve({ success: false, error: authResult.error });
                  }
                } catch (error) {
                  reject(error);
                }
              }
            }
          ]
        );
      });
    } catch (error) {
      console.error('Biometric setup error:', error);
      throw error;
    }
  }

  // Generate secure biometric token
  async generateBiometricToken(userId) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const deviceInfo = `${userId}-${timestamp}-${randomString}`;
    
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      deviceInfo
    );
  }

  // Authenticate with biometrics
  async authenticateWithBiometric() {
    try {
      const storedToken = await SecureStore.getItemAsync('biometricToken');
      const storedUserId = await SecureStore.getItemAsync('biometricUserId');
      
      if (!storedToken || !storedUserId) {
        throw new Error('Biometric authentication is not set up');
      }

      const biometricStatus = await this.isBiometricAvailable();
      const biometricTypeName = this.getBiometricTypeName(biometricStatus.supportedTypes);
      
      const authResult = await this.authenticate(
        `Use ${biometricTypeName} to sign in to Akchabar`
      );

      if (authResult.success) {
        return {
          success: true,
          biometricToken: storedToken,
          userId: storedUserId
        };
      } else {
        return {
          success: false,
          error: authResult.error || 'Authentication failed'
        };
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      throw error;
    }
  }

  // Check if biometric is set up for current device
  async isBiometricSetup() {
    try {
      const storedToken = await SecureStore.getItemAsync('biometricToken');
      const storedUserId = await SecureStore.getItemAsync('biometricUserId');
      return !!(storedToken && storedUserId);
    } catch (error) {
      return false;
    }
  }

  // Disable biometric authentication
  async disableBiometric() {
    try {
      await SecureStore.deleteItemAsync('biometricToken');
      await SecureStore.deleteItemAsync('biometricUserId');
      this.biometricToken = null;
      return true;
    } catch (error) {
      console.error('Disable biometric error:', error);
      return false;
    }
  }

  // Show biometric prompt for sensitive actions
  async promptForSensitiveAction(action = 'Confirm this action') {
    try {
      const biometricStatus = await this.isBiometricAvailable();
      
      if (!biometricStatus.available) {
        // Fallback to password or PIN if biometric not available
        return { success: false, fallbackRequired: true };
      }

      const biometricTypeName = this.getBiometricTypeName(biometricStatus.supportedTypes);
      const result = await this.authenticate(`Use ${biometricTypeName} to ${action.toLowerCase()}`);
      
      return result;
    } catch (error) {
      console.error('Sensitive action prompt error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current biometric info
  async getBiometricInfo() {
    try {
      const biometricStatus = await this.isBiometricAvailable();
      const isSetup = await this.isBiometricSetup();
      
      return {
        ...biometricStatus,
        isSetup,
        typeName: biometricStatus.supportedTypes ? 
          this.getBiometricTypeName(biometricStatus.supportedTypes) : null
      };
    } catch (error) {
      console.error('Get biometric info error:', error);
      return { available: false, isSetup: false };
    }
  }
}

export default new BiometricService();