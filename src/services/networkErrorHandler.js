// src/services/networkErrorHandler.js - Advanced Network Error Handling
import { Alert, NetInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NetworkErrorHandler {
  constructor() {
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000; // Start with 1 second
    this.isOnline = true;
    this.requestQueue = [];
    this.setupNetworkListener();
  }

  // Setup network connectivity listener
  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;
      
      console.log('🌐 Network status changed:', {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable
      });

      if (wasOffline && this.isOnline) {
        // Just came back online - process queued requests
        console.log('📶 Back online - processing queued requests');
        this.processQueuedRequests();
      }
    });
  }

  // Enhanced network request with retry logic
  async makeNetworkRequest(url, options = {}, retryConfig = {}) {
    const config = {
      maxRetries: retryConfig.maxRetries || this.maxRetries,
      retryDelay: retryConfig.retryDelay || this.retryDelay,
      exponentialBackoff: retryConfig.exponentialBackoff !== false,
      retryOn: retryConfig.retryOn || [408, 429, 500, 502, 503, 504],
      ...retryConfig
    };

    // Add request timeout if not specified
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

    const requestOptions = {
      ...options,
      signal: controller.signal
    };

    let lastError = null;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        // Check if we're online before making request
        if (!this.isOnline) {
          throw new Error('No internet connection');
        }

        console.log(`🌐 Network request attempt ${attempt + 1}/${config.maxRetries + 1}:`, url);

        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        // Check if we should retry based on status code
        if (!response.ok && config.retryOn.includes(response.status)) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Success - reset retry attempts for future requests
        this.retryAttempts = 0;
        return response;

      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;
        
        console.log(`❌ Network request failed (attempt ${attempt + 1}):`, error.message);

        // Don't retry on certain errors
        if (this.shouldNotRetry(error) || attempt >= config.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = config.exponentialBackoff 
          ? config.retryDelay * Math.pow(2, attempt)
          : config.retryDelay;

        console.log(`⏳ Retrying in ${delay}ms...`);
        await this.delay(delay);
      }
    }

    // All retries failed
    return this.handleNetworkError(lastError, url, requestOptions);
  }

  // Determine if we should not retry this error
  shouldNotRetry(error) {
    // Don't retry on these conditions:
    return (
      error.name === 'AbortError' || // Request was cancelled
      error.message.includes('401') || // Unauthorized
      error.message.includes('403') || // Forbidden
      error.message.includes('404') || // Not found
      error.message.includes('422') || // Validation error
      error.message.includes('400')    // Bad request
    );
  }

  // Handle network errors with user-friendly messages
  handleNetworkError(error, url, options) {
    const errorType = this.classifyError(error);
    
    console.error('🚨 Network error classified as:', errorType, error);

    switch (errorType) {
      case 'OFFLINE':
        return this.handleOfflineError(url, options);
      
      case 'TIMEOUT':
        return this.handleTimeoutError();
      
      case 'SERVER_ERROR':
        return this.handleServerError(error);
      
      case 'AUTH_ERROR':
        return this.handleAuthError();
      
      case 'VALIDATION_ERROR':
        return this.handleValidationError(error);
      
      default:
        return this.handleGenericError(error);
    }
  }

  // Classify error types
  classifyError(error) {
    if (!this.isOnline || error.message.includes('Network request failed')) {
      return 'OFFLINE';
    }
    
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return 'TIMEOUT';
    }
    
    if (error.message.includes('500') || error.message.includes('502') || 
        error.message.includes('503') || error.message.includes('504')) {
      return 'SERVER_ERROR';
    }
    
    if (error.message.includes('401') || error.message.includes('403')) {
      return 'AUTH_ERROR';
    }
    
    if (error.message.includes('400') || error.message.includes('422')) {
      return 'VALIDATION_ERROR';
    }
    
    return 'UNKNOWN';
  }

  // Handle offline errors
  handleOfflineError(url, options) {
    // Add to queue for later processing
    this.queueRequest(url, options);
    
    return {
      success: false,
      error: 'No internet connection. Your request has been queued and will be sent when connection is restored.',
      errorType: 'OFFLINE',
      queued: true
    };
  }

  // Handle timeout errors
  handleTimeoutError() {
    return {
      success: false,
      error: 'Request timed out. Please check your internet connection and try again.',
      errorType: 'TIMEOUT',
      retry: true
    };
  }

  // Handle server errors
  handleServerError(error) {
    return {
      success: false,
      error: 'Server is temporarily unavailable. Please try again in a few minutes.',
      errorType: 'SERVER_ERROR',
      retry: true
    };
  }

  // Handle authentication errors
  handleAuthError() {
    // Clear auth token and redirect to login
    this.clearAuthAndRedirect();
    
    return {
      success: false,
      error: 'Your session has expired. Please sign in again.',
      errorType: 'AUTH_ERROR',
      requiresAuth: true
    };
  }

  // Handle validation errors
  handleValidationError(error) {
    return {
      success: false,
      error: error.message || 'Invalid data provided. Please check your input and try again.',
      errorType: 'VALIDATION_ERROR',
      retry: false
    };
  }

  // Handle generic errors
  handleGenericError(error) {
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      errorType: 'UNKNOWN',
      retry: true,
      details: error.message
    };
  }

  // Queue request for later when connection is restored
  queueRequest(url, options) {
    const queuedRequest = {
      url,
      options,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    };
    
    this.requestQueue.push(queuedRequest);
    console.log('📥 Request queued:', queuedRequest.id, url);
    
    // Persist queue to storage
    this.saveQueueToStorage();
  }

  // Process queued requests when back online
  async processQueuedRequests() {
    if (this.requestQueue.length === 0) return;

    console.log(`📤 Processing ${this.requestQueue.length} queued requests...`);
    
    const results = [];
    
    for (const queuedRequest of this.requestQueue) {
      try {
        const result = await this.makeNetworkRequest(
          queuedRequest.url, 
          queuedRequest.options,
          { maxRetries: 1 } // Reduce retries for queued requests
        );
        
        results.push({ success: true, request: queuedRequest, result });
        console.log('✅ Queued request processed:', queuedRequest.id);
        
      } catch (error) {
        results.push({ success: false, request: queuedRequest, error });
        console.log('❌ Queued request failed:', queuedRequest.id, error);
      }
    }

    // Clear processed requests
    this.requestQueue = [];
    this.saveQueueToStorage();

    // Notify user about processed requests
    const successCount = results.filter(r => r.success).length;
    if (successCount > 0) {
      // You could show a toast notification here
      console.log(`🎉 ${successCount} queued requests processed successfully`);
    }
  }

  // Save queue to persistent storage
  async saveQueueToStorage() {
    try {
      await AsyncStorage.setItem('networkQueue', JSON.stringify(this.requestQueue));
    } catch (error) {
      console.error('Failed to save network queue:', error);
    }
  }

  // Load queue from persistent storage
  async loadQueueFromStorage() {
    try {
      const queueData = await AsyncStorage.getItem('networkQueue');
      if (queueData) {
        this.requestQueue = JSON.parse(queueData);
        console.log(`📂 Loaded ${this.requestQueue.length} requests from storage`);
      }
    } catch (error) {
      console.error('Failed to load network queue:', error);
    }
  }

  // Clear authentication and redirect
  async clearAuthAndRedirect() {
    try {
      // This would typically be handled by your auth service
      await AsyncStorage.removeItem('authToken');
      // Trigger app to redirect to login screen
      // You could emit an event here that App.js listens to
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }
  }

  // Utility function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Show network error alert to user
  showNetworkErrorAlert(error, language = 'en', onRetry = null) {
    const messages = {
      en: {
        title: 'Connection Problem',
        offline: 'No internet connection. Please check your network settings.',
        timeout: 'Request timed out. Please try again.',
        server: 'Server is temporarily unavailable. Please try again later.',
        generic: 'Network error occurred. Please try again.',
        retry: 'Retry',
        cancel: 'Cancel'
      },
      ru: {
        title: 'Проблема с подключением',
        offline: 'Нет интернет-соединения. Проверьте настройки сети.',
        timeout: 'Время запроса истекло. Попробуйте еще раз.',
        server: 'Сервер временно недоступен. Попробуйте позже.',
        generic: 'Произошла сетевая ошибка. Попробуйте еще раз.',
        retry: 'Повторить',
        cancel: 'Отмена'
      },
      ky: {
        title: 'Байланыш көйгөйү',
        offline: 'Интернет байланыш жок. Тармак жөндөөлөрүн текшериңиз.',
        timeout: 'Сурамдын убактысы өттү. Кайра аракет кылыңыз.',
        server: 'Сервер убактылуу жетүүсүз. Кийинчерээк аракет кылыңыз.',
        generic: 'Тармактык ката болду. Кайра аракет кылыңыз.',
        retry: 'Кайталоо',
        cancel: 'Жокко чыгаруу'
      }
    };

    const msg = messages[language] || messages.en;
    let message = msg.generic;

    if (error.errorType === 'OFFLINE') message = msg.offline;
    else if (error.errorType === 'TIMEOUT') message = msg.timeout;
    else if (error.errorType === 'SERVER_ERROR') message = msg.server;

    const buttons = [{ text: msg.cancel, style: 'cancel' }];
    
    if (onRetry && error.retry !== false) {
      buttons.push({ text: msg.retry, onPress: onRetry });
    }

    Alert.alert(msg.title, message, buttons);
  }

  // Get network status
  async getNetworkStatus() {
    try {
      const state = await NetInfo.fetch();
      return {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
        details: state.details
      };
    } catch (error) {
      return { isConnected: false, error: error.message };
    }
  }

  // Initialize the service (call once in App.js)
  async initialize() {
    await this.loadQueueFromStorage();
    console.log('🌐 NetworkErrorHandler initialized');
  }
}

export default new NetworkErrorHandler();