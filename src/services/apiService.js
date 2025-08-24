// src/services/apiService.js - FIXED VERSION with missing methods
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.0.245:3000/api';

class ApiService {
  static async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      headers: defaultHeaders,
      ...options,
    };

    console.log('🌐 Making request to:', url);
    console.log('📤 Request config:', {
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body ? 'Present' : 'None'
    });

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      console.log('📥 Response status:', response.status);
      console.log('📥 Response data:', data);

      if (!response.ok) {
        console.error(`❌ API Error (${endpoint}):`, data);
        throw new Error(data.error || data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error(`❌ Network error for ${endpoint}:`, error);
      
      if (error.message === 'Network request failed' || error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  // Token management
  static async storeToken(token) {
    try {
      await AsyncStorage.setItem('authToken', token);
      console.log('✅ Auth token stored');
    } catch (error) {
      console.error('❌ Failed to store auth token:', error);
    }
  }

  static async getToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('❌ Failed to get auth token:', error);
      return null;
    }
  }

  static async removeToken() {
    try {
      await AsyncStorage.removeItem('authToken');
      console.log('✅ Auth token removed');
    } catch (error) {
      console.error('❌ Failed to remove auth token:', error);
    }
  }

  // ===== MISSING METHODS - FIXED =====

  // Universal user registration method (MISSING)
  static async registerUser(userData) {
    try {
      console.log('📝 Registering user with universal method:', userData.authMethod);
      
      const response = await this.makeRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.success && response.token) {
        await this.storeToken(response.token);
        console.log('✅ User registration successful');
      }

      return response;
    } catch (error) {
      console.error('❌ User registration failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Validate token method (MISSING)
  static async validateToken() {
    try {
      console.log('🔍 Validating auth token');
      
      const response = await this.makeRequest('/auth/validate', {
        method: 'POST',
      });

      return response;
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      return { success: false, error: error.message };
    }
  }

  // User existence check
  static async checkUserExists(email, phone) {
    try {
      // Clean phone number if provided
      const cleanPhone = phone ? phone.replace(/\s/g, '') : null;
      console.log('🔍 Checking if user exists with clean data:', { email, phone: cleanPhone });
      
      const response = await this.makeRequest('/auth/check-user', {
        method: 'POST',
        body: JSON.stringify({ email, phone: cleanPhone }),
      });

      console.log('📋 User existence check result:', response);
      return response;
    } catch (error) {
      console.error('❌ Check user exists error:', error);
      return { exists: false, error: error.message };
    }
  }

  // Phone Sign-in Request
  static async requestPhoneSignIn(phone, countryCode) {
    try {
      // Clean phone number
      const cleanPhone = phone.replace(/\s/g, '');
      console.log('📱 Requesting phone sign-in for:', countryCode + cleanPhone);
      
      const response = await this.makeRequest('/auth/phone-signin', {
        method: 'POST',
        body: JSON.stringify({ phone: cleanPhone, countryCode }),
      });

      return response;
    } catch (error) {
      console.error('❌ Phone sign-in request failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Phone Sign-in Verification
  static async verifyPhoneSignIn(phone, countryCode, code) {
    try {
      // Clean phone number
      const cleanPhone = phone.replace(/\s/g, '');
      console.log('🔓 Verifying phone sign-in code for clean phone:', cleanPhone);
      
      const response = await this.makeRequest('/auth/verify-phone-signin', {
        method: 'POST',
        body: JSON.stringify({ phone: cleanPhone, countryCode, code }),
      });

      if (response.success && response.token) {
        await this.storeToken(response.token);
        console.log('✅ Phone sign-in verification successful');
      }

      return response;
    } catch (error) {
      console.error('❌ Phone sign-in verification failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Email Sign-in
  static async signInWithEmail(email, password) {
    try {
      console.log('📧 Signing in with email:', email);
      
      const response = await this.makeRequest('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.success && response.token) {
        await this.storeToken(response.token);
        console.log('✅ Email sign-in successful');
      }

      return response;
    } catch (error) {
      console.error('❌ Email sign-in failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Password Reset
  static async forgotPassword(email) {
    try {
      console.log('🔄 Requesting password reset for:', email);
      
      const response = await this.makeRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      return response;
    } catch (error) {
      console.error('❌ Forgot password request failed:', error);
      return { success: false, error: error.message };
    }
  }

  static async resetPassword(email, code, newPassword) {
    try {
      console.log('🔄 Resetting password for:', email);
      
      const response = await this.makeRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code, newPassword }),
      });

      return response;
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Test connection
  static async testConnection() {
    try {
      console.log('🔌 Testing API connection');
      
      const response = await this.makeRequest('/health', {
        method: 'GET',
      });

      console.log('✅ API connection successful');
      return response;
    } catch (error) {
      console.error('❌ API connection failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Sign out
  static async signOut() {
    try {
      console.log('👋 Signing out user');
      
      // Call logout endpoint if available
      try {
        await this.makeRequest('/auth/logout', {
          method: 'POST',
        });
      } catch (error) {
        // Ignore logout endpoint errors
        console.log('⚠️ Logout endpoint not available or failed');
      }

      // Remove token regardless
      await this.removeToken();
      console.log('✅ User signed out');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== FINANCE API METHODS =====

  // Transactions
  static async getTransactions(limit = 20, offset = 0) {
    try {
      console.log('💳 Fetching transactions');
      
      const response = await this.makeRequest(`/finance/transactions?limit=${limit}&offset=${offset}`, {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to fetch transactions:', error);
      return { success: false, error: error.message };
    }
  }

  static async createTransaction(transactionData) {
    try {
      console.log('💳 Creating transaction');
      
      const response = await this.makeRequest('/finance/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to create transaction:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateTransaction(transactionId, transactionData) {
    try {
      console.log('💳 Updating transaction:', transactionId);
      
      const response = await this.makeRequest(`/finance/transactions/${transactionId}`, {
        method: 'PUT',
        body: JSON.stringify(transactionData),
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to update transaction:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteTransaction(transactionId) {
    try {
      console.log('💳 Deleting transaction:', transactionId);
      
      const response = await this.makeRequest(`/finance/transactions/${transactionId}`, {
        method: 'DELETE',
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to delete transaction:', error);
      return { success: false, error: error.message };
    }
  }

  // Accounts
  static async getAccounts() {
    try {
      console.log('🏦 Fetching accounts');
      
      const response = await this.makeRequest('/finance/accounts', {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to fetch accounts:', error);
      return { success: false, error: error.message };
    }
  }

  static async createAccount(accountData) {
    try {
      console.log('🏦 Creating account');
      
      const response = await this.makeRequest('/finance/accounts', {
        method: 'POST',
        body: JSON.stringify(accountData),
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to create account:', error);
      return { success: false, error: error.message };
    }
  }

  // Categories
  static async getCategories() {
    try {
      console.log('📂 Fetching categories');
      
      const response = await this.makeRequest('/finance/categories', {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to fetch categories:', error);
      return { success: false, error: error.message };
    }
  }

  // Budgets
  static async getBudgets() {
    try {
      console.log('📊 Fetching budgets');
      
      const response = await this.makeRequest('/finance/budgets', {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to fetch budgets:', error);
      return { success: false, error: error.message };
    }
  }

  static async createBudget(budgetData) {
    try {
      console.log('📊 Creating budget');
      
      const response = await this.makeRequest('/finance/budgets', {
        method: 'POST',
        body: JSON.stringify(budgetData),
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to create budget:', error);
      return { success: false, error: error.message };
    }
  }

  // Goals
  static async getGoals() {
    try {
      console.log('🎯 Fetching goals');
      
      const response = await this.makeRequest('/finance/goals', {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to fetch goals:', error);
      return { success: false, error: error.message };
    }
  }

  static async createGoal(goalData) {
    try {
      console.log('🎯 Creating goal');
      
      const response = await this.makeRequest('/finance/goals', {
        method: 'POST',
        body: JSON.stringify(goalData),
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to create goal:', error);
      return { success: false, error: error.message };
    }
  }

  // Subscription Management
  static async getCurrentSubscription() {
    try {
      console.log('📋 Fetching current subscription');
      
      const response = await this.makeRequest('/subscriptions/current', {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to fetch subscription:', error);
      return { success: false, error: error.message };
    }
  }

  static async checkFeatureLimit(feature) {
    try {
      console.log('🔍 Checking feature limit for:', feature);
      
      const response = await this.makeRequest('/subscriptions/check-limit', {
        method: 'POST',
        body: JSON.stringify({ feature }),
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to check feature limit:', error);
      return { allowed: false, error: error.message };
    }
  }

  static async incrementUsage(feature, count = 1) {
    try {
      console.log('📈 Incrementing usage for:', feature);
      
      const response = await this.makeRequest('/subscriptions/increment-usage', {
        method: 'POST',
        body: JSON.stringify({ feature, count }),
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to increment usage:', error);
      return { success: false, error: error.message };
    }
  }

  // Analytics
  static async getSpendingAnalytics(timeframe = 'month') {
    try {
      console.log('📈 Fetching spending analytics');
      
      const response = await this.makeRequest(`/analytics/spending?timeframe=${timeframe}`, {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to fetch spending analytics:', error);
      return { success: false, error: error.message };
    }
  }

  static async getIncomeAnalytics(timeframe = 'month') {
    try {
      console.log('📈 Fetching income analytics');
      
      const response = await this.makeRequest(`/analytics/income?timeframe=${timeframe}`, {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to fetch income analytics:', error);
      return { success: false, error: error.message };
    }
  }

  // User Profile
  static async getUserProfile() {
    try {
      console.log('👤 Fetching user profile');
      
      const response = await this.makeRequest('/user/profile', {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateUserProfile(profileData) {
    try {
      console.log('👤 Updating user profile');
      
      const response = await this.makeRequest('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      return { success: false, error: error.message };
    }
  }

  // Biometric Authentication
  static async setupBiometric(biometricToken) {
    try {
      console.log('👆 Setting up biometric authentication');
      
      const response = await this.makeRequest('/auth/setup-biometric', {
        method: 'POST',
        body: JSON.stringify({ biometricToken }),
      });

      return response;
    } catch (error) {
      console.error('❌ Biometric setup failed:', error);
      return { success: false, error: error.message };
    }
  }

  static async signInWithBiometric(biometricToken) {
    try {
      console.log('👆 Signing in with biometric');
      
      const response = await this.makeRequest('/auth/signin-biometric', {
        method: 'POST',
        body: JSON.stringify({ biometricToken }),
      });

      if (response.success && response.token) {
        await this.storeToken(response.token);
        console.log('✅ Biometric sign-in successful');
      }

      return response;
    } catch (error) {
      console.error('❌ Biometric sign-in failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export default ApiService;