import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import ApiService from './apiService';

WebBrowser.maybeCompleteAuthSession();

class SocialAuthService {
  constructor() {
    this.googleConfig = {
      iosClientId: 'your-ios-client-id.apps.googleusercontent.com',
      androidClientId: 'your-android-client-id.apps.googleusercontent.com',
      webClientId: 'your-web-client-id.apps.googleusercontent.com',
      expoClientId: 'your-expo-client-id.apps.googleusercontent.com',
    };
  }


// Google Sign-In
    async signInWithGoogle() {
    try {
        // Note: This should be called from a React component, not a service
        // Move the useAuthRequest hook to the component that calls this
        console.log('Google Sign-In: Move hook to component');
        
        // For now, return a placeholder
        return {
        success: false,
        error: 'Google Sign-In should be implemented in component'
        };
    } catch (error) {
        console.error('Google Sign-In Error:', error);
        return {
        success: false,
        error: error.message || 'Google authentication failed',
        };
    }
    }

  // Apple Sign-In
  async signInWithApple() {
    try {
      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      
      if (!isAvailable) {
        throw new Error('Apple Sign-In is not available on this device');
      }

      // Request Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential) {
        // Send to your backend for processing
        const authResponse = await ApiService.makeRequest('/auth/apple', {
          method: 'POST',
          body: JSON.stringify({
            appleId: credential.user,
            email: credential.email,
            firstName: credential.fullName?.givenName,
            lastName: credential.fullName?.familyName,
            identityToken: credential.identityToken,
            authorizationCode: credential.authorizationCode,
          }),
        });

        if (authResponse.token) {
          await ApiService.setAuthToken(authResponse.token);
        }

        return {
          success: true,
          user: authResponse.user,
          token: authResponse.token,
          isNewUser: authResponse.isNewUser,
        };
      } else {
        throw new Error('Apple authentication failed');
      }
    } catch (error) {
      console.error('Apple Sign-In Error:', error);
      
      if (error.code === 'ERR_CANCELED') {
        return {
          success: false,
          cancelled: true,
          error: 'User cancelled Apple sign-in',
        };
      }
      
      return {
        success: false,
        error: error.message || 'Apple authentication failed',
      };
    }
  }

  // Link Google account to existing user
  async linkGoogleAccount() {
    try {
      const result = await this.signInWithGoogle();
      
      if (result.success) {
        const linkResponse = await ApiService.makeRequest('/auth/link-google', {
          method: 'POST',
          body: JSON.stringify({
            googleId: result.user.googleId,
            email: result.user.email,
          }),
        });

        return {
          success: true,
          message: 'Google account linked successfully',
          user: linkResponse.user,
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Link Google account error:', error);
      return {
        success: false,
        error: error.message || 'Failed to link Google account',
      };
    }
  }

  // Link Apple account to existing user
  async linkAppleAccount() {
    try {
      const result = await this.signInWithApple();
      
      if (result.success) {
        const linkResponse = await ApiService.makeRequest('/auth/link-apple', {
          method: 'POST',
          body: JSON.stringify({
            appleId: result.user.appleId,
            email: result.user.email,
          }),
        });

        return {
          success: true,
          message: 'Apple account linked successfully',
          user: linkResponse.user,
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Link Apple account error:', error);
      return {
        success: false,
        error: error.message || 'Failed to link Apple account',
      };
    }
  }

  // Unlink social accounts
  async unlinkSocialAccount(provider) {
    try {
      const response = await ApiService.makeRequest(`/auth/unlink-${provider}`, {
        method: 'POST',
      });

      return {
        success: true,
        message: `${provider} account unlinked successfully`,
      };
    } catch (error) {
      console.error(`Unlink ${provider} account error:`, error);
      return {
        success: false,
        error: error.message || `Failed to unlink ${provider} account`,
      };
    }
  }

  // Get linked social accounts
  async getLinkedAccounts() {
    try {
      const response = await ApiService.makeRequest('/user/linked-accounts');
      return response;
    } catch (error) {
      console.error('Get linked accounts error:', error);
      return {
        google: false,
        apple: false,
      };
    }
  }

  // Check if device supports Apple Sign-In
  async isAppleSignInAvailable() {
    try {
      if (Platform.OS !== 'ios') {
        return false;
      }
      return await AppleAuthentication.isAvailableAsync();
    } catch (error) {
      return false;
    }
  }

  // Revoke Apple authentication (for account deletion)
  async revokeAppleAuthentication() {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign-In is only available on iOS');
      }

      const result = await AppleAuthentication.revokeAsync();
      return {
        success: true,
        message: 'Apple authentication revoked successfully',
      };
    } catch (error) {
      console.error('Revoke Apple authentication error:', error);
      return {
        success: false,
        error: error.message || 'Failed to revoke Apple authentication',
      };
    }
  }
}

export default new SocialAuthService();