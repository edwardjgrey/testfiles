// FinancialAPI.js - Complete API Communication Service
class FinancialAPI {
  constructor() {
    this.baseURL = 'http://localhost:3000/api/financial';
    this.timeout = 30000; // 30 seconds
  }

  // Generic API call method with error handling
  async apiCall(endpoint, method = 'GET', data = null, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      };

      if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      
      throw error;
    }
  }

  // File Upload Methods
  async uploadFiles(files, userId, onProgress = null) {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('statements', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      });
    });

    formData.append('userId', userId.toString());

    try {
      const response = await fetch(`${this.baseURL}/upload-statements`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  async getUploadStatus(uploadId) {
    return this.apiCall(`/upload-status/${uploadId}`);
  }

  // Processing Methods
  async startProcessing(uploadId, processingOptions = {}) {
    return this.apiCall('/start-processing', 'POST', {
      uploadId,
      options: {
        ocrLanguages: ['eng', 'rus', 'kir'],
        confidenceThreshold: 0.7,
        enableLearning: true,
        ...processingOptions,
      },
    });
  }

  async getProcessingStatus(processingId) {
    return this.apiCall(`/processing-status/${processingId}`);
  }

  async getProcessingProgress(processingId) {
    return this.apiCall(`/processing-progress/${processingId}`);
  }

  // Transaction Methods
  async getTransactions(userId, filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.minAmount) queryParams.append('minAmount', filters.minAmount);
    if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount);
    if (filters.searchQuery) queryParams.append('search', filters.searchQuery);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);

    const endpoint = `/transactions/${userId}${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.apiCall(endpoint);
  }

  async updateTransaction(transactionId, updates) {
    return this.apiCall(`/transaction/${transactionId}`, 'PUT', updates);
  }

  async deleteTransaction(transactionId) {
    return this.apiCall(`/transaction/${transactionId}`, 'DELETE');
  }

  async mergeTransactions(primaryId, secondaryIds) {
    return this.apiCall('/merge-transactions', 'POST', {
      primaryId,
      secondaryIds,
    });
  }

  async splitTransaction(transactionId, splits) {
    return this.apiCall('/split-transaction', 'POST', {
      transactionId,
      splits,
    });
  }

  async bulkUpdateTransactions(transactionIds, updates) {
    return this.apiCall('/bulk-update-transactions', 'PUT', {
      transactionIds,
      updates,
    });
  }

  // Categorization Methods
  async getCategories() {
    return this.apiCall('/categories');
  }

  async createCustomCategory(categoryData) {
    return this.apiCall('/categories', 'POST', categoryData);
  }

  async updateCategory(categoryId, updates) {
    return this.apiCall(`/categories/${categoryId}`, 'PUT', updates);
  }

  async categorizeTransactions(transactionIds, categoryId, subcategoryId = null) {
    return this.apiCall('/categorize-transactions', 'POST', {
      transactionIds,
      categoryId,
      subcategoryId,
    });
  }

  async autoCategorizeBatch(transactions) {
    return this.apiCall('/auto-categorize-batch', 'POST', { transactions });
  }

  async trainCategorization(userId, corrections) {
    return this.apiCall('/train-categorization', 'POST', {
      userId,
      corrections,
    });
  }

  async getCategoryInsights(userId, timeframe = 'month') {
    return this.apiCall(`/category-insights/${userId}?timeframe=${timeframe}`);
  }

  // Budget Methods
  async generateBudget(userId, budgetOptions = {}) {
    return this.apiCall('/generate-budget', 'POST', {
      userId,
      options: {
        method: 'ai', // 'ai', 'historical', 'percentage'
        timeframe: 3, // months of data to analyze
        includeGoals: true,
        applyRegionalAdjustments: true,
        ...budgetOptions,
      },
    });
  }

  async saveBudget(userId, budgetData) {
    return this.apiCall('/budget', 'POST', {
      userId,
      ...budgetData,
    });
  }

  async getBudget(userId) {
    return this.apiCall(`/budget/${userId}`);
  }

  async updateBudget(budgetId, updates) {
    return this.apiCall(`/budget/${budgetId}`, 'PUT', updates);
  }

  async getBudgetProgress(userId, month = null) {
    const endpoint = month 
      ? `/budget-progress/${userId}?month=${month}`
      : `/budget-progress/${userId}`;
    return this.apiCall(endpoint);
  }

  async getBudgetAlerts(userId) {
    return this.apiCall(`/budget-alerts/${userId}`);
  }

  // Goal Methods
  async getGoalRecommendations(userId) {
    return this.apiCall(`/goal-recommendations/${userId}`);
  }

  async createGoal(userId, goalData) {
    return this.apiCall('/goals', 'POST', {
      userId,
      ...goalData,
    });
  }

  async getGoals(userId) {
    return this.apiCall(`/goals/${userId}`);
  }

  async updateGoal(goalId, updates) {
    return this.apiCall(`/goals/${goalId}`, 'PUT', updates);
  }

  async deleteGoal(goalId) {
    return this.apiCall(`/goals/${goalId}`, 'DELETE');
  }

  async getGoalProgress(goalId) {
    return this.apiCall(`/goal-progress/${goalId}`);
  }

  async updateGoalProgress(goalId, amount) {
    return this.apiCall(`/goal-progress/${goalId}`, 'POST', { amount });
  }

  // Analytics Methods
  async getSpendingAnalysis(userId, timeframe = 'month') {
    return this.apiCall(`/spending-analysis/${userId}?timeframe=${timeframe}`);
  }

  async getIncomeAnalysis(userId, timeframe = 'month') {
    return this.apiCall(`/income-analysis/${userId}?timeframe=${timeframe}`);
  }

  async getFinancialHealth(userId) {
    return this.apiCall(`/financial-health/${userId}`);
  }

  async getSpendingTrends(userId, categories = [], months = 12) {
    return this.apiCall(`/spending-trends/${userId}`, 'POST', {
      categories,
      months,
    });
  }

  async getMonthlyReport(userId, month, year) {
    return this.apiCall(`/monthly-report/${userId}?month=${month}&year=${year}`);
  }

  async getYearlyReport(userId, year) {
    return this.apiCall(`/yearly-report/${userId}?year=${year}`);
  }

  // Account Methods
  async getAccounts(userId) {
    return this.apiCall(`/accounts/${userId}`);
  }

  async createAccount(userId, accountData) {
    return this.apiCall('/accounts', 'POST', {
      userId,
      ...accountData,
    });
  }

  async updateAccount(accountId, updates) {
    return this.apiCall(`/accounts/${accountId}`, 'PUT', updates);
  }

  async deleteAccount(accountId) {
    return this.apiCall(`/accounts/${accountId}`, 'DELETE');
  }

  async reconcileAccount(accountId, balance) {
    return this.apiCall(`/reconcile-account/${accountId}`, 'POST', { balance });
  }

  // Onboarding Progress Methods
  async saveOnboardingProgress(userId, step, stepData = {}) {
    return this.apiCall('/onboarding-progress', 'POST', {
      userId,
      step,
      stepData,
      timestamp: new Date().toISOString(),
    });
  }

  async getOnboardingProgress(userId) {
    return this.apiCall(`/onboarding-progress/${userId}`);
  }

  async completeOnboarding(userId, finalData) {
    return this.apiCall('/complete-onboarding', 'POST', {
      userId,
      ...finalData,
      completedAt: new Date().toISOString(),
    });
  }

  // Machine Learning Methods
  async submitFeedback(userId, feedbackType, feedbackData) {
    return this.apiCall('/submit-feedback', 'POST', {
      userId,
      feedbackType,
      feedbackData,
      timestamp: new Date().toISOString(),
    });
  }

  async getPersonalizedInsights(userId) {
    return this.apiCall(`/personalized-insights/${userId}`);
  }

  async updateUserPreferences(userId, preferences) {
    return this.apiCall(`/user-preferences/${userId}`, 'PUT', preferences);
  }

  // Utility Methods
  async validateBankFormat(fileContent, fileName) {
    return this.apiCall('/validate-bank-format', 'POST', {
      fileContent: fileContent.substring(0, 1000), // First 1000 chars for format detection
      fileName,
    });
  }

  async getMerchantInfo(merchantName) {
    return this.apiCall(`/merchant-info?name=${encodeURIComponent(merchantName)}`);
  }

  async searchMerchants(query) {
    return this.apiCall(`/search-merchants?q=${encodeURIComponent(query)}`);
  }

  async getExchangeRates(baseCurrency = 'KGS') {
    return this.apiCall(`/exchange-rates?base=${baseCurrency}`);
  }

  // Export/Import Methods
  async exportData(userId, format = 'json', options = {}) {
    return this.apiCall('/export-data', 'POST', {
      userId,
      format,
      options,
    });
  }

  async importData(userId, data, format = 'json') {
    return this.apiCall('/import-data', 'POST', {
      userId,
      data,
      format,
    });
  }

  // Subscription/Usage Methods
  async getUsageLimits(userId) {
    return this.apiCall(`/usage-limits/${userId}`);
  }

  async checkUsageLimit(userId, feature) {
    return this.apiCall(`/check-usage-limit/${userId}/${feature}`);
  }

  async recordUsage(userId, feature, amount = 1) {
    return this.apiCall('/record-usage', 'POST', {
      userId,
      feature,
      amount,
      timestamp: new Date().toISOString(),
    });
  }

  // Notification Methods
  async getNotifications(userId) {
    return this.apiCall(`/notifications/${userId}`);
  }

  async markNotificationRead(notificationId) {
    return this.apiCall(`/notifications/${notificationId}/read`, 'PUT');
  }

  async updateNotificationSettings(userId, settings) {
    return this.apiCall(`/notification-settings/${userId}`, 'PUT', settings);
  }

  // Security Methods
  async auditLog(userId, action, details = {}) {
    return this.apiCall('/audit-log', 'POST', {
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  }

  async getAuditLog(userId, limit = 50) {
    return this.apiCall(`/audit-log/${userId}?limit=${limit}`);
  }

  // Real-time Methods (WebSocket-like functionality)
  async subscribeToUpdates(userId, callback) {
    // Polling implementation for real-time updates
    const pollInterval = setInterval(async () => {
      try {
        const updates = await this.apiCall(`/updates/${userId}`);
        if (updates && updates.length > 0) {
          callback(updates);
        }
      } catch (error) {
        console.warn('Failed to fetch updates:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }

  // Bulk Operations
  async bulkOperations(operations) {
    return this.apiCall('/bulk-operations', 'POST', { operations });
  }

  // Testing/Development Methods
  async healthCheck() {
    return this.apiCall('/health-check');
  }

  async getSystemStatus() {
    return this.apiCall('/system-status');
  }

  async clearCache(userId) {
    return this.apiCall(`/clear-cache/${userId}`, 'DELETE');
  }

  // Error Recovery Methods
  async retryFailedOperation(operationId) {
    return this.apiCall(`/retry-operation/${operationId}`, 'POST');
  }

  async getFailedOperations(userId) {
    return this.apiCall(`/failed-operations/${userId}`);
  }

  // Batch Processing Methods
  async createBatchJob(userId, jobType, jobData) {
    return this.apiCall('/batch-jobs', 'POST', {
      userId,
      jobType,
      jobData,
    });
  }

  async getBatchJobStatus(jobId) {
    return this.apiCall(`/batch-jobs/${jobId}/status`);
  }

  async getBatchJobResults(jobId) {
    return this.apiCall(`/batch-jobs/${jobId}/results`);
  }

  // Performance Monitoring
  async recordPerformanceMetric(metric, value, metadata = {}) {
    return this.apiCall('/performance-metrics', 'POST', {
      metric,
      value,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  // Helper Methods
  formatCurrency(amount, currency = 'KGS') {
    const formatter = new Intl.NumberFormat('ky-KG', {
      style: 'currency',
      currency: currency,
    });
    return formatter.format(amount);
  }

  formatDate(date, locale = 'ky-KG') {
    return new Intl.DateTimeFormat(locale).format(new Date(date));
  }

  calculateConfidenceLevel(score) {
    if (score >= 0.9) return 'Very High';
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    if (score >= 0.4) return 'Low';
    return 'Very Low';
  }

  validateAmount(amount) {
    const num = parseFloat(amount);
    return !isNaN(num) && num >= 0;
  }

  validateDate(date) {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }

  // Rate Limiting Helper
  async withRateLimit(fn, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (error.message.includes('rate limit') && i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
          continue;
        }
        throw error;
      }
    }
  }

  // Offline Support
  async syncWhenOnline(userId) {
    if (!navigator.onLine) {
      return { success: false, message: 'Device is offline' };
    }

    try {
      // Implement offline data sync logic here
      const offlineData = await this.getOfflineData(userId);
      if (offlineData.length > 0) {
        await this.uploadOfflineData(userId, offlineData);
        await this.clearOfflineData(userId);
      }
      return { success: true, message: 'Sync completed' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getOfflineData(userId) {
    // Implementation for retrieving offline stored data
    // This would typically use AsyncStorage or similar
    return [];
  }

  async uploadOfflineData(userId, data) {
    return this.apiCall('/sync-offline-data', 'POST', {
      userId,
      data,
    });
  }

  async clearOfflineData(userId) {
    // Implementation for clearing offline stored data
    return true;
  }
}

// Create and export singleton instance
const financialAPI = new FinancialAPI();
export default financialAPI;