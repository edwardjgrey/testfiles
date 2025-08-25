// src/services/apiService.js - FIXED SERVER CONNECTION
import AsyncStorage from '@react-native-async-storage/async-storage';

// STEP 1: FIND YOUR COMPUTER'S IP ADDRESS
// Run this in terminal: ip route get 8.8.8.8 | awk -F"src " 'NR==1{split($2,a," ");print a[1]}'
// Replace 192.168.0.245 below with YOUR ACTUAL IP ADDRESS

const API_BASE_URL = __DEV__ ? 
  'http://192.168.0.245:3000/api' : // REPLACE 192.168.0.245 WITH YOUR ACTUAL IP
  'https://your-production-domain.com/api';

console.log('🌐 API_BASE_URL:', API_BASE_URL);

class ApiService {
  // FIXED: Enhanced API call with better connection handling
  async apiCall(endpoint, options = {}) {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout
        
        const token = await this.getToken();
        const url = `${API_BASE_URL}${endpoint}`;
        
        console.log(`📡 API Call attempt ${attempt + 1}: ${url}`);
        
        const response = await fetch(url, {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
          },
          signal: controller.signal,
          ...options,
        });
        
        clearTimeout(timeoutId);
        
        console.log(`📡 Response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Server error (${response.status}):`, errorText);
          
          let errorMessage;
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || `Server error (${response.status})`;
          } catch {
            errorMessage = `Server error (${response.status}): ${response.statusText}`;
          }
          
          throw new Error(errorMessage);
        }
        
        // Parse JSON response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log('✅ API call successful');
          return data;
        } else {
          const text = await response.text();
          console.warn('⚠️ Non-JSON response:', text.substring(0, 200));
          throw new Error('Server returned invalid response format');
        }
        
      } catch (error) {
        attempt++;
        console.error(`❌ API call attempt ${attempt} failed:`, error.message);
        
        if (error.name === 'AbortError') {
          console.error('❌ Request timed out');
          throw new Error('Connection timeout. Please check your network and try again.');
        }
        
        // Check for connection errors
        if (error.message.includes('Network request failed') || 
            error.message.includes('fetch')) {
          console.error('❌ Network connection failed');
          
          if (attempt >= maxRetries) {
            throw new Error(
              `Cannot connect to server at ${API_BASE_URL}.\n\n` +
              `Please check:\n` +
              `1. Server is running (node server.js)\n` +
              `2. Phone and computer on same WiFi\n` +
              `3. Correct IP address: ${API_BASE_URL}`
            );
          }
        } else if (attempt >= maxRetries) {
          throw new Error(`Server error after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Test server connection
  async testConnection() {
    try {
      console.log('🔍 Testing server connection...');
      const response = await this.apiCall('/health');
      
      if (response && response.status === 'healthy') {
        console.log('✅ Server connection successful!');
        return { success: true, message: 'Connected to server' };
      } else {
        throw new Error('Invalid health check response');
      }
    } catch (error) {
      console.error('❌ Server connection failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // FIXED: Robust logout that doesn't depend on backend response
  async signOut() {
    try {
      console.log('🚪 Starting logout process...');
      
      // Step 1: Clear all local data first (most important)
      const keysToRemove = [
        'authToken',
        'refreshToken', 
        'userData',
        'biometricToken',
        'userPreferences',
        'lastLoginTime'
      ];
      
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('✅ Local data cleared successfully');
      
      // Step 2: Try to notify backend, but don't fail if it doesn't work
      try {
        const result = await this.apiCall('/auth/logout', { method: 'POST' });
        console.log('✅ Backend logout successful:', result);
      } catch (logoutError) {
        console.log('⚠️ Backend logout failed (but local cleanup succeeded):', logoutError.message);
      }
      
      return { success: true, message: 'Logout successful' };
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      
      // Even if there's an error, try to clear what we can
      try {
        await AsyncStorage.clear();
        console.log('🔄 Cleared all storage as fallback');
      } catch (clearError) {
        console.error('❌ Failed to clear storage:', clearError);
      }
      
      return { 
        success: false, 
        error: error.message,
        message: 'Logout may have failed - you may need to restart the app'
      };
    }
  }

  // Safe token retrieval
  async getToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Enhanced token validation
  async validateToken() {
    try {
      const token = await this.getToken();
      
      if (!token) {
        return { success: false, error: 'No token found' };
      }
      
      const response = await this.apiCall('/auth/validate');
      
      if (response && response.user) {
        return { success: true, user: response.user };
      } else {
        return { success: false, error: 'Invalid token response' };
      }
      
    } catch (error) {
      console.error('Token validation error:', error);
      
      // If validation fails, clear the invalid token
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        await AsyncStorage.removeItem('authToken');
      }
      
      return { success: false, error: error.message };
    }
  }

  // Input sanitization
  sanitizeInput(input, options = {}) {
    if (typeof input !== 'string') return input;
    
    let sanitized = input.trim();
    
    if (options.allowHTML !== true) {
      sanitized = sanitized
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .replace(/data:/gi, '');
    }
    
    if (options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }
    
    if (options.type === 'email') {
      sanitized = sanitized.toLowerCase();
    }
    
    return sanitized;
  }

  // User registration
  async registerUser(userData) {
    try {
      const sanitizedData = {
        authMethod: userData.authMethod,
        phone: this.sanitizeInput(userData.phone, { maxLength: 20 }),
        countryCode: this.sanitizeInput(userData.countryCode, { maxLength: 5 }),
        email: this.sanitizeInput(userData.email, { type: 'email', maxLength: 100 }),
        firstName: this.sanitizeInput(userData.firstName, { maxLength: 50 }),
        lastName: this.sanitizeInput(userData.lastName, { maxLength: 50 }),
        password: userData.password && userData.password.length > 100 ? 
                  userData.password.substring(0, 100) : userData.password,
        selectedPlan: userData.selectedPlan,
        currency: this.sanitizeInput(userData.currency, { maxLength: 5 }),
        monthlyIncome: userData.monthlyIncome,
        additionalIncome: userData.additionalIncome,
        financialGoals: userData.financialGoals,
        verificationCode: this.sanitizeInput(userData.verificationCode, { maxLength: 10 }),
        googleId: userData.googleId,
        appleId: userData.appleId,
      };

      console.log('📝 Registering user with method:', sanitizedData.authMethod);
      
      const response = await this.apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(sanitizedData),
      });
      
      if (response && response.user && response.token) {
        await AsyncStorage.setItem('authToken', response.token);
        if (response.refreshToken) {
          await AsyncStorage.setItem('refreshToken', response.refreshToken);
        }
        
        return { 
          success: true, 
          user: response.user, 
          token: response.token 
        };
      } else {
        throw new Error('Invalid registration response');
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  // Email sign-in
  async signInWithEmail(email, password) {
    try {
      const sanitizedEmail = this.sanitizeInput(email, { type: 'email', maxLength: 100 });
      
      if (!sanitizedEmail || !password) {
        throw new Error('Email and password are required');
      }
      
      const response = await this.apiCall('/auth/signin/email', {
        method: 'POST',
        body: JSON.stringify({
          email: sanitizedEmail,
          password: password
        }),
      });
      
      if (response && response.user && response.token) {
        await AsyncStorage.setItem('authToken', response.token);
        if (response.refreshToken) {
          await AsyncStorage.setItem('refreshToken', response.refreshToken);
        }
        
        return { success: true, user: response.user };
      } else {
        throw new Error('Invalid credentials');
      }
      
    } catch (error) {
      console.error('Email sign-in error:', error);
      return { success: false, error: error.message };
    }
  }

  // Phone sign-in request
  async requestPhoneSignIn(phone, countryCode) {
    try {
      const sanitizedPhone = this.sanitizeInput(phone, { maxLength: 20 });
      const sanitizedCountryCode = this.sanitizeInput(countryCode, { maxLength: 5 });
      
      const response = await this.apiCall('/auth/signin/phone/request', {
        method: 'POST',
        body: JSON.stringify({
          phone: sanitizedPhone,
          countryCode: sanitizedCountryCode
        }),
      });
      
      if (response && response.success) {
        return { success: true, debug_code: response.debug_code };
      } else {
        throw new Error(response?.error || 'Failed to send verification code');
      }
      
    } catch (error) {
      console.error('Phone sign-in request error:', error);
      return { success: false, error: error.message };
    }
  }

  // Phone verification
  async verifyPhoneSignIn(phone, countryCode, code) {
    try {
      const sanitizedData = {
        phone: this.sanitizeInput(phone, { maxLength: 20 }),
        countryCode: this.sanitizeInput(countryCode, { maxLength: 5 }),
        code: this.sanitizeInput(code, { maxLength: 10 })
      };
      
      const response = await this.apiCall('/auth/signin/phone/verify', {
        method: 'POST',
        body: JSON.stringify(sanitizedData),
      });
      
      if (response && response.user && response.token) {
        await AsyncStorage.setItem('authToken', response.token);
        if (response.refreshToken) {
          await AsyncStorage.setItem('refreshToken', response.refreshToken);
        }
        
        return { success: true, user: response.user };
      } else {
        throw new Error(response?.error || 'Invalid verification code');
      }
      
    } catch (error) {
      console.error('Phone verification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if user exists
  async checkUserExists(emailOrPhone, countryCode = null) {
    try {
      let params = {};
      
      if (emailOrPhone.includes('@')) {
        params.email = this.sanitizeInput(emailOrPhone, { type: 'email', maxLength: 100 });
      } else {
        params.phone = this.sanitizeInput(emailOrPhone, { maxLength: 20 });
        if (countryCode) {
          params.countryCode = this.sanitizeInput(countryCode, { maxLength: 5 });
        }
      }
      
      const queryString = new URLSearchParams(params).toString();
      const response = await this.apiCall(`/auth/check-exists?${queryString}`);
      
      return { exists: Boolean(response?.exists) };
      
    } catch (error) {
      console.error('Check user exists error:', error);
      return { exists: false };
    }
  }
}

export default new ApiService();