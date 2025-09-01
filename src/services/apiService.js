// src/services/apiService.js - ENHANCED with offline mode toggle
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.0.245:3000/api';

class ApiService {
  constructor() {
    this.offlineMode = false;
    this.connectionStatus = 'unknown';
  }

  // NEW: Set offline mode (preserves all existing functionality)
  setOfflineMode(enabled) {
    this.offlineMode = enabled;
    console.log(`📱 Offline mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  // NEW: Get current connection status
  getConnectionStatus() {
    return {
      isOnline: !this.offlineMode && this.connectionStatus === 'online',
      offlineMode: this.offlineMode,
      status: this.connectionStatus
    };
  }

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
      
      console.log('📥 Response status:', response.status);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      let data;
      if (isJson) {
        data = await response.json();
        console.log('📥 Response data:', data);
      } else {
        // Handle non-JSON responses (like HTML error pages)
        const text = await response.text();
        console.log('📥 Response text (first 200 chars):', text.substring(0, 200));
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
        }
        
        // For successful non-JSON responses, return a success object
        data = { success: true, message: 'Request completed' };
      }

      if (!response.ok && isJson) {
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

  // Universal user registration method
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

  // Validate token method - FIXED ENDPOINT
  static async validateToken() {
    try {
      const token = await this.getToken();
      
      if (!token) {
        console.log('🔍 No token found - user not authenticated');
        return { success: false, error: 'No token found' };
      }
      
      console.log('🔍 Validating auth token');
      
      const response = await this.makeRequest('/auth/validate', {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      
      // If token is invalid, remove it
      if (error.message.includes('token') || error.message.includes('unauthorized')) {
        await this.removeToken();
        console.log('🗑️ Removed invalid token');
      }
      
      return { success: false, error: error.message };
    }
  }

  // User existence check - FIXED ENDPOINT
  static async checkUserExists(email, phone) {
    try {
      // Clean phone number if provided
      const cleanPhone = phone ? phone.replace(/\s/g, '') : null;
      console.log('🔍 Checking if user exists with clean data:', { email, phone: cleanPhone });
      
      const params = new URLSearchParams();
      if (email) params.append('email', email);
      if (cleanPhone) params.append('phone', cleanPhone);
      
      const response = await this.makeRequest(`/auth/check-exists?${params.toString()}`, {
        method: 'GET',
      });

      console.log('📋 User existence check result:', response);
      return response;
    } catch (error) {
      console.error('❌ Check user exists error:', error);
      return { exists: false, error: error.message };
    }
  }

  // Phone Sign-in Request - FIXED ENDPOINT PATH
  static async requestPhoneSignIn(phone, countryCode) {
    try {
      // Clean phone number
      const cleanPhone = phone.replace(/\s/g, '');
      console.log('📱 Requesting phone sign-in for:', countryCode + cleanPhone);
      
      const response = await this.makeRequest('/auth/signin/phone/request', {
        method: 'POST',
        body: JSON.stringify({ phone: cleanPhone, countryCode }),
      });

      return response;
    } catch (error) {
      console.error('❌ Phone sign-in request failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Phone Sign-in Verification - FIXED ENDPOINT PATH
  static async verifyPhoneSignIn(phone, countryCode, code) {
    try {
      // Clean phone number
      const cleanPhone = phone.replace(/\s/g, '');
      console.log('🔐 Verifying phone sign-in code for clean phone:', cleanPhone);
      
      const response = await this.makeRequest('/auth/signin/phone/verify', {
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

  // Email Sign-in - FIXED ENDPOINT PATH
  static async signInWithEmail(email, password) {
    try {
      console.log('📧 Signing in with email:', email);
      
      const response = await this.makeRequest('/auth/signin/email', {
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

  // Test connection - ENHANCED with status tracking
  static async testConnection() {
    try {
      console.log('🔌 Testing API connection');
      
      const response = await this.makeRequest('/health', {
        method: 'GET',
      });

      this.connectionStatus = 'online';
      console.log('✅ API connection successful');
      return response;
    } catch (error) {
      this.connectionStatus = 'offline';
      console.error('❌ API connection failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Sign out
  static async signOut() {
    try {
      console.log('👋 Signing out user');
      
      // Skip server logout entirely since it's causing issues
      // Just remove the local token - this is what actually signs the user out
      await this.removeToken();
      console.log('✅ User signed out successfully');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      // Even if there's an error, try to remove the token
      try {
        await this.removeToken();
        console.log('✅ Token removed despite error');
      } catch (tokenError) {
        console.error('❌ Failed to remove token:', tokenError);
      }
      return { success: false, error: error.message };
    }
  }

  // ===== FINANCE API METHODS =====

  // Transactions
  static async getTransactions(limit = 20, offset = 0) {
    try {
      console.log('💳 Fetching transactions');
      
      const response = await this.makeRequest(`/financial/transactions?limit=${limit}&offset=${offset}`, {
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
      
      const response = await this.makeRequest('/financial/transactions', {
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
      
      const response = await this.makeRequest(`/financial/transactions/${transactionId}`, {
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
      
      const response = await this.makeRequest(`/financial/transactions/${transactionId}`, {
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
      
      const response = await this.makeRequest('/financial/accounts', {
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
      
      const response = await this.makeRequest('/financial/accounts', {
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
      
      const response = await this.makeRequest('/financial/categories', {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to fetch categories:', error);
      return { success: false, error: error.message };
    }
  }

  // Budgets - FIXED ENDPOINTS
  static async getBudgets() {
    try {
      console.log('📊 Fetching budgets');
      
      const response = await this.makeRequest('/financial/budget', {
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
      
      const response = await this.makeRequest('/financial/budget', {
        method: 'POST',
        body: JSON.stringify(budgetData),
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to create budget:', error);
      return { success: false, error: error.message };
    }
  }

  // Goals - FIXED ENDPOINTS
  static async getGoals() {
    try {
      console.log('🎯 Fetching goals');
      
      const response = await this.makeRequest('/financial/goals', {
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
      
      const response = await this.makeRequest('/financial/goals', {
        method: 'POST',
        body: JSON.stringify(goalData),
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to create goal:', error);
      return { success: false, error: error.message };
    }
  }

  // Financial Summary - FIXED ENDPOINT
  static async getFinancialSummary() {
    try {
      console.log('📈 Fetching financial summary');
      
      const response = await this.makeRequest('/financial/summary', {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to fetch financial summary:', error);
      return { success: false, error: error.message };
    }
  }

  // Financial Upload - NEW METHOD
  static async uploadFinancialFiles(files) {
    try {
      console.log('📄 Uploading financial files');
      
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('files', file);
      });
      
      const response = await this.makeRequest('/financial/upload', {
        method: 'POST',
        body: formData,
        headers: {} // Let fetch set Content-Type for FormData
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to upload financial files:', error);
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
      console.log('🔒 Checking feature limit for:', feature);
      
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

  // NEW: Helper method to check stored user data
  static async getStoredUser() {
    try {
      const token = await this.getToken();
      if (!token) {
        return { isAuthenticated: false, user: null };
      }

      // Try to validate token and get user data
      const validation = await this.validateToken();
      if (validation.success && validation.user) {
        return { isAuthenticated: true, user: validation.user };
      }

      return { isAuthenticated: false, user: null };
    } catch (error) {
      console.error('❌ Failed to get stored user:', error);
      return { isAuthenticated: false, user: null };
    }
  }

  // NEW: Logout method (alias for signOut)
  static async logout() {
    return await this.signOut();
  }
}

export default ApiService;