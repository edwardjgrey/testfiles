// src/services/networkErrorHandler.js - FIXED VERSION
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NetworkErrorHandler {
  constructor() {
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.isOnline = true;
    this.requestQueue = [];
    
    // FIXED: Proper timer management to prevent memory leaks
    this.activeTimers = new Set();
    this.networkListener = null;
    this.isInitialized = false;
    
    // FIXED: Bound methods to prevent context issues
    this.handleNetworkChange = this.handleNetworkChange.bind(this);
  }

  // FIXED: Enhanced network listener setup with cleanup
  setupNetworkListener() {
    if (this.networkListener) {
      console.warn('Network listener already set up');
      return;
    }

    try {
      this.networkListener = NetInfo.addEventListener(this.handleNetworkChange);
      console.log('Network listener established');
    } catch (error) {
      console.error('Failed to set up network listener:', error);
    }
  }

  // FIXED: Extracted network change handler
  handleNetworkChange(state) {
    const wasOffline = !this.isOnline;
    this.isOnline = state.isConnected;
    
    console.log('Network status changed:', {
      isConnected: state.isConnected,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
      wasOffline,
      queueLength: this.requestQueue.length
    });

    if (wasOffline && this.isOnline && this.requestQueue.length > 0) {
      console.log('Back online - processing queued requests');
      // FIXED: Add small delay to ensure connection is stable
      const timerId = setTimeout(() => {
        this.processQueuedRequests();
        this.activeTimers.delete(timerId);
      }, 1000);
      this.activeTimers.add(timerId);
    }
  }

  // Enhanced network request with better timeout and retry logic
  async makeNetworkRequest(url, options = {}, retryConfig = {}) {
    const config = {
      maxRetries: retryConfig.maxRetries || this.maxRetries,
      retryDelay: retryConfig.retryDelay || this.retryDelay,
      exponentialBackoff: retryConfig.exponentialBackoff !== false,
      retryOn: retryConfig.retryOn || [408, 429, 500, 502, 503, 504],
      timeout: retryConfig.timeout || 30000,
      ...retryConfig
    };

    // FIXED: Proper AbortController management
    const controller = new AbortController();
    let timeoutId = null;

    const requestOptions = {
      ...options,
      signal: controller.signal
    };

    let lastError = null;
    
    try {
      for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
          // Check if we're online before making request
          if (!this.isOnline) {
            throw new Error('No internet connection');
          }

          console.log(`Network request attempt ${attempt + 1}/${config.maxRetries + 1}:`, url);

          // FIXED: Set up timeout with proper cleanup
          timeoutId = setTimeout(() => {
            controller.abort();
          }, config.timeout);
          this.activeTimers.add(timeoutId);

          const response = await fetch(url, requestOptions);
          
          // FIXED: Clean up timeout immediately on success
          if (timeoutId) {
            clearTimeout(timeoutId);
            this.activeTimers.delete(timeoutId);
            timeoutId = null;
          }

          // Check if we should retry based on status code
          if (!response.ok && config.retryOn.includes(response.status)) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          // Success - reset retry attempts for future requests
          this.retryAttempts = 0;
          return response;

        } catch (error) {
          // FIXED: Clean up timeout on error
          if (timeoutId) {
            clearTimeout(timeoutId);
            this.activeTimers.delete(timeoutId);
            timeoutId = null;
          }

          lastError = error;
          
          console.log(`Network request failed (attempt ${attempt + 1}):`, error.message);

          // Don't retry on certain errors
          if (this.shouldNotRetry(error) || attempt >= config.maxRetries) {
            break;
          }

          // Calculate delay with exponential backoff
          const delay = config.exponentialBackoff 
            ? config.retryDelay * Math.pow(2, attempt)
            : config.retryDelay;

          console.log(`Retrying in ${delay}ms...`);
          await this.delay(delay);
        }
      }
    } finally {
      // FIXED: Ensure cleanup happens even if exceptions occur
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.activeTimers.delete(timeoutId);
      }
    }

    // All retries failed
    return this.handleNetworkError(lastError, url, requestOptions);
  }

  // Determine if we should not retry this error
  shouldNotRetry(error) {
    const noRetryPatterns = [
      /abort/i,          // AbortError
      /cancel/i,         // Request cancelled
      /401/,             // Unauthorized
      /403/,             // Forbidden
      /404/,             // Not found
      /422/,             // Validation error
      /400/,             // Bad request
    ];

    return noRetryPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  // Handle network errors with user-friendly messages
  handleNetworkError(error, url, options) {
    const errorType = this.classifyError(error);
    
    console.error('Network error classified as:', errorType, error);

    const handlers = {
      OFFLINE: () => this.handleOfflineError(url, options),
      TIMEOUT: () => this.handleTimeoutError(),
      SERVER_ERROR: () => this.handleServerError(error),
      AUTH_ERROR: () => this.handleAuthError(),
      VALIDATION_ERROR: () => this.handleValidationError(error),
      UNKNOWN: () => this.handleGenericError(error)
    };

    const handler = handlers[errorType] || handlers.UNKNOWN;
    return handler();
  }

  // Classify error types
  classifyError(error) {
    const errorMessage = (error.message || '').toLowerCase();
    
    if (!this.isOnline || errorMessage.includes('network request failed')) {
      return 'OFFLINE';
    }
    
    if (error.name === 'AbortError' || errorMessage.includes('timeout')) {
      return 'TIMEOUT';
    }
    
    if (/50[0-9]/.test(errorMessage)) {
      return 'SERVER_ERROR';
    }
    
    if (/40[13]/.test(errorMessage)) {
      return 'AUTH_ERROR';
    }
    
    if (/40[024]/.test(errorMessage) || /422/.test(errorMessage)) {
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

  handleTimeoutError() {
    return {
      success: false,
      error: 'Request timed out. Please check your internet connection and try again.',
      errorType: 'TIMEOUT',
      retry: true
    };
  }

  handleServerError(error) {
    return {
      success: false,
      error: 'Server is temporarily unavailable. Please try again in a few minutes.',
      errorType: 'SERVER_ERROR',
      retry: true
    };
  }

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

  handleValidationError(error) {
    return {
      success: false,
      error: error.message || 'Invalid data provided. Please check your input and try again.',
      errorType: 'VALIDATION_ERROR',
      retry: false
    };
  }

  handleGenericError(error) {
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      errorType: 'UNKNOWN',
      retry: true,
      details: error.message
    };
  }

  // FIXED: Enhanced queue management with size limits
  queueRequest(url, options) {
    // Prevent queue from growing too large
    const MAX_QUEUE_SIZE = 50;
    
    if (this.requestQueue.length >= MAX_QUEUE_SIZE) {
      console.warn('Request queue is full, removing oldest request');
      this.requestQueue.shift();
    }

    const queuedRequest = {
      url,
      options: { ...options }, // Clone options to prevent mutation
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9),
      retries: 0
    };
    
    this.requestQueue.push(queuedRequest);
    console.log('Request queued:', queuedRequest.id, url);
    
    // Persist queue to storage
    this.saveQueueToStorage();
  }

  // FIXED: Enhanced queue processing with better error handling
  async processQueuedRequests() {
    if (this.requestQueue.length === 0) return;

    console.log(`Processing ${this.requestQueue.length} queued requests...`);
    
    const results = [];
    const failedRequests = [];
    
    // Process requests in batches to avoid overwhelming the server
    const BATCH_SIZE = 5;
    const batches = [];
    
    for (let i = 0; i < this.requestQueue.length; i += BATCH_SIZE) {
      batches.push(this.requestQueue.slice(i, i + BATCH_SIZE));
    }
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (queuedRequest) => {
        try {
          // Skip very old requests (older than 1 hour)
          if (Date.now() - queuedRequest.timestamp > 3600000) {
            console.log('Skipping old queued request:', queuedRequest.id);
            return { success: false, request: queuedRequest, reason: 'expired' };
          }

          const result = await this.makeNetworkRequest(
            queuedRequest.url, 
            queuedRequest.options,
            { maxRetries: 1 } // Reduce retries for queued requests
          );
          
          return { success: true, request: queuedRequest, result };
          
        } catch (error) {
          queuedRequest.retries = (queuedRequest.retries || 0) + 1;
          
          // Allow up to 2 retries for queued requests
          if (queuedRequest.retries < 3) {
            failedRequests.push(queuedRequest);
          }
          
          return { success: false, request: queuedRequest, error, retries: queuedRequest.retries };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(r => r.value).filter(Boolean));
      
      // Small delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.delay(500);
      }
    }

    // Update queue with only failed requests that can be retried
    this.requestQueue = failedRequests;
    this.saveQueueToStorage();

    // Report results
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    
    console.log(`Queue processing complete: ${successCount} succeeded, ${failedCount} failed`);
    
    if (successCount > 0) {
      console.log(`${successCount} queued requests processed successfully`);
    }
  }

  // Save queue to persistent storage
  async saveQueueToStorage() {
    try {
      // Only save recent requests (last 24 hours)
      const oneDayAgo = Date.now() - 86400000;
      const recentRequests = this.requestQueue.filter(req => req.timestamp > oneDayAgo);
      
      await AsyncStorage.setItem('networkQueue', JSON.stringify(recentRequests));
    } catch (error) {
      console.error('Failed to save network queue:', error);
    }
  }

  // Load queue from persistent storage
  async loadQueueFromStorage() {
    try {
      const queueData = await AsyncStorage.getItem('networkQueue');
      if (queueData) {
        const parsedQueue = JSON.parse(queueData);
        
        // Filter out old requests
        const oneDayAgo = Date.now() - 86400000;
        this.requestQueue = parsedQueue.filter(req => req.timestamp > oneDayAgo);
        
        console.log(`Loaded ${this.requestQueue.length} requests from storage`);
      }