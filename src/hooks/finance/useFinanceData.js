// src/hooks/finance/useFinanceData.js
import { useState, useEffect } from 'react';
import ApiService from '../../services/apiService';

export const useFinanceData = () => {
  const [data, setData] = useState({
    accounts: [],
    transactions: [],
    budgets: [],
    goals: [],
    categories: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refresh all finance data
  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        accountsResponse,
        transactionsResponse,
        budgetsResponse,
        goalsResponse,
        categoriesResponse
      ] = await Promise.all([
        ApiService.makeRequest('/finance/accounts'),
        ApiService.makeRequest('/finance/transactions'),
        ApiService.makeRequest('/finance/budgets'),
        ApiService.makeRequest('/finance/goals'),
        ApiService.makeRequest('/finance/categories')
      ]);

      setData({
        accounts: accountsResponse.accounts || [],
        transactions: transactionsResponse.transactions || [],
        budgets: budgetsResponse.budgets || [],
        goals: goalsResponse.goals || [],
        categories: categoriesResponse.categories || []
      });
    } catch (err) {
      setError(err.message);
      console.error('Finance data refresh error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add new transaction
  const addTransaction = async (transactionData) => {
    try {
      const response = await ApiService.makeRequest('/finance/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData)
      });

      if (response.success) {
        // Add to local state
        setData(prev => ({
          ...prev,
          transactions: [response.transaction, ...prev.transactions]
        }));

        // Update account balance
        if (response.updatedAccount) {
          setData(prev => ({
            ...prev,
            accounts: prev.accounts.map(acc => 
              acc.id === response.updatedAccount.id ? response.updatedAccount : acc
            )
          }));
        }

        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Add transaction error:', error);
      return { success: false, error: error.message };
    }
  };

  // Add new account
  const addAccount = async (accountData) => {
    try {
      const response = await ApiService.makeRequest('/finance/accounts', {
        method: 'POST',
        body: JSON.stringify(accountData)
      });

      if (response.success) {
        setData(prev => ({
          ...prev,
          accounts: [...prev.accounts, response.account]
        }));
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Add account error:', error);
      return { success: false, error: error.message };
    }
  };

  // Add new budget
  const addBudget = async (budgetData) => {
    try {
      const response = await ApiService.makeRequest('/finance/budgets', {
        method: 'POST',
        body: JSON.stringify(budgetData)
      });

      if (response.success) {
        setData(prev => ({
          ...prev,
          budgets: [...prev.budgets, response.budget]
        }));
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Add budget error:', error);
      return { success: false, error: error.message };
    }
  };

  // Add new goal
  const addGoal = async (goalData) => {
    try {
      const response = await ApiService.makeRequest('/finance/goals', {
        method: 'POST',
        body: JSON.stringify(goalData)
      });

      if (response.success) {
        setData(prev => ({
          ...prev,
          goals: [...prev.goals, response.goal]
        }));
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Add goal error:', error);
      return { success: false, error: error.message };
    }
  };

  // Get monthly statistics
  const getMonthlyStats = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTransactions = data.transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalBalance = data.accounts.reduce((sum, acc) => sum + acc.balance, 0);

    return {
      income,
      expenses,
      netIncome: income - expenses,
      totalBalance,
      transactionCount: monthlyTransactions.length,
      avgDailySpending: expenses / new Date().getDate()
    };
  };

  // Get category breakdown
  const getCategoryBreakdown = () => {
    const categoryTotals = {};
    
    data.transactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        const category = transaction.category || 'Other';
        categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(transaction.amount);
      }
    });

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  // Get financial health score
  const getFinancialHealth = () => {
    const stats = getMonthlyStats();
    let score = 0;
    const factors = [];

    // Positive cash flow (30 points)
    if (stats.netIncome > 0) {
      score += 30;
      factors.push({ name: 'Positive Cash Flow', points: 30, status: 'good' });
    } else {
      factors.push({ name: 'Negative Cash Flow', points: 0, status: 'poor' });
    }

    // Emergency fund (25 points)
    const emergencyFundTarget = stats.expenses * 3; // 3 months expenses
    if (stats.totalBalance >= emergencyFundTarget) {
      score += 25;
      factors.push({ name: 'Emergency Fund', points: 25, status: 'excellent' });
    } else if (stats.totalBalance >= emergencyFundTarget * 0.5) {
      score += 15;
      factors.push({ name: 'Emergency Fund', points: 15, status: 'fair' });
    } else {
      factors.push({ name: 'Emergency Fund', points: 0, status: 'poor' });
    }

    // Budget adherence (20 points)
    const budgetAdherence = calculateBudgetAdherence();
    score += budgetAdherence;
    factors.push({ 
      name: 'Budget Adherence', 
      points: budgetAdherence, 
      status: budgetAdherence >= 15 ? 'good' : budgetAdherence >= 10 ? 'fair' : 'poor' 
    });

    // Savings rate (25 points)
    const savingsRate = stats.income > 0 ? (stats.netIncome / stats.income) * 100 : 0;
    if (savingsRate >= 20) {
      score += 25;
      factors.push({ name: 'Savings Rate', points: 25, status: 'excellent' });
    } else if (savingsRate >= 10) {
      score += 15;
      factors.push({ name: 'Savings Rate', points: 15, status: 'good' });
    } else if (savingsRate >= 5) {
      score += 10;
      factors.push({ name: 'Savings Rate', points: 10, status: 'fair' });
    } else {
      factors.push({ name: 'Savings Rate', points: 0, status: 'poor' });
    }

    return {
      score: Math.min(100, score),
      factors,
      status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor'
    };
  };

  // Calculate budget adherence
  const calculateBudgetAdherence = () => {
    if (data.budgets.length === 0) return 0;

    let totalAdherence = 0;
    data.budgets.forEach(budget => {
      const spent = budget.spent || 0;
      const adherence = Math.max(0, 100 - Math.max(0, (spent - budget.amount) / budget.amount * 100));
      totalAdherence += adherence;
    });

    const avgAdherence = totalAdherence / data.budgets.length;
    return Math.round(avgAdherence / 100 * 20); // Convert to points out of 20
  };

  return {
    // Data
    accounts: data.accounts,
    transactions: data.transactions,
    budgets: data.budgets,
    goals: data.goals,
    categories: data.categories,
    
    // State
    loading,
    error,
    
    // Actions
    refreshData,
    addTransaction,
    addAccount,
    addBudget,
    addGoal,
    
    // Computed values
    getMonthlyStats,
    getCategoryBreakdown,
    getFinancialHealth
  };
};