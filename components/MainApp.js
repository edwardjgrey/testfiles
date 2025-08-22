// src/components/MainApp.js - Fixed and complete
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Alert, TouchableOpacity, Text } from 'react-native';

// Finance Components - Match your existing file names
import Dashboard from './finance/Dashboard';
import Transactions from './finance/Transactions';
import BudgetsGoals from './finance/BudgetsGoals';
import Analytics from './finance/Analytics';

// Navigation - Match your existing structure
import BottomNavigation from './navigation/BottomNavigation';

// Modals - Use your existing modal structure
import AddTransactionModal from './finance/modals/AddTransactionModal';

// Services
import { useFinanceData } from '../hooks/finance/useFinanceData';
import { useSubscription } from '../hooks/finance/useSubscription';
import ApiService from '../services/apiService';

// Utils
import { formatters } from '../utils/finance/formatters';
import { calculations } from '../utils/finance/calculations';

export default function MainApp({ authData, language, onSignOut }) {
  // Navigation State
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeModal, setActiveModal] = useState(null);
  
  // Finance Data Hook
  const {
    accounts,
    transactions,
    budgets,
    goals,
    categories,
    loading,
    error,
    refreshData,
    addTransaction,
    addAccount,
    addBudget,
    addGoal,
    getMonthlyStats,
    getCategoryBreakdown,
    getFinancialHealth
  } = useFinanceData();

  // Subscription Hook
  const {
    currentPlan,
    planLimits,
    usage,
    features,
    canPerformAction,
    trackUsage,
    showUpgradePrompt
  } = useSubscription();

  // Load initial data
  useEffect(() => {
    refreshData();
  }, []);

  // Handle navigation
  const handleNavigation = (view) => {
    setCurrentView(view);
  };

  // Handle modal actions
  const openModal = (modalType) => {
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  // Handle adding transactions with limits
  const handleAddTransaction = async (transactionData) => {
    try {
      // Check if user can add more transactions
      const canAdd = await canPerformAction('transactions');
      
      if (!canAdd.allowed) {
        Alert.alert(
          'Transaction Limit Reached',
          `You've reached your ${planLimits.transactions} transaction limit for this month. Upgrade to Plus for unlimited transactions!`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => Alert.alert('Upgrade', 'Upgrade modal coming soon!') }
          ]
        );
        return;
      }

      // Add transaction
      const result = await addTransaction(transactionData);
      
      if (result.success) {
        // Track usage
        await trackUsage('transactions', 1);
        closeModal();
        
        // Show upgrade hint if approaching limit
        if (currentPlan === 'basic' && usage.transactions >= planLimits.transactions * 0.8) {
          setTimeout(() => {
            Alert.alert(
              'Approaching Limit',
              `You've used ${usage.transactions}/${planLimits.transactions} transactions this month. Consider upgrading to Plus for unlimited transactions.`,
              [
                { text: 'Not Now', style: 'cancel' },
                { text: 'Learn More', onPress: () => Alert.alert('Upgrade', 'Upgrade modal coming soon!') }
              ]
            );
          }, 1000);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add transaction. Please try again.');
    }
  };

  // Handle adding accounts with limits
  const handleAddAccount = async (accountData) => {
    try {
      const canAdd = await canPerformAction('accounts');
      
      if (!canAdd.allowed) {
        Alert.alert(
          'Account Limit Reached',
          `You can only have ${planLimits.accounts} account${planLimits.accounts > 1 ? 's' : ''} on the Basic plan. Upgrade to Plus for unlimited accounts!`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => Alert.alert('Upgrade', 'Upgrade modal coming soon!') }
          ]
        );
        return;
      }

      const result = await addAccount(accountData);
      
      if (result.success) {
        await trackUsage('accounts', 1);
        closeModal();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add account. Please try again.');
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await ApiService.signOut();
            onSignOut();
          }
        }
      ]
    );
  };

  // Render current view
  const renderCurrentView = () => {
    const viewProps = {
      // Data
      accounts,
      transactions,
      budgets,
      goals,
      categories,
      
      // Stats
      monthlyStats: getMonthlyStats(),
      categoryBreakdown: getCategoryBreakdown(),
      financialHealth: getFinancialHealth(),
      
      // Subscription
      currentPlan,
      planLimits,
      usage,
      features,
      
      // Settings
      language,
      user: authData,
      
      // Actions
      onAddTransaction: () => openModal('addTransaction'),
      onAddAccount: () => Alert.alert('Coming Soon', 'Account management coming soon!'),
      onAddBudget: () => Alert.alert('Coming Soon', 'Budget management coming soon!'),
      onAddGoal: () => Alert.alert('Coming Soon', 'Goal management coming soon!'),
      onUpgrade: () => Alert.alert('Coming Soon', 'Upgrade modal coming soon!'),
      onSignOut: handleSignOut,
      
      // Navigation
      onNavigate: handleNavigation,
      
      // Transaction actions
      onEditTransaction: (transaction) => {
        Alert.alert('Edit', 'Edit transaction coming soon!');
      },
      onDeleteTransaction: async (transactionId) => {
        try {
          Alert.alert('Success', 'Transaction deleted!');
          await refreshData();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete transaction');
        }
      },
      
      // Utils
      formatters,
      calculations,
      refreshData,
      
      // Loading states
      loading,
      error
    };

    switch (currentView) {
      case 'dashboard':
        return <Dashboard {...viewProps} />;
      case 'transactions':
        return <Transactions {...viewProps} />;
      case 'budgets':
        return <BudgetsGoals {...viewProps} />;
      case 'analytics':
        return <Analytics {...viewProps} />;
      case 'accounts':
        // Since you don't have AccountsScreen yet, show coming soon
        return <Dashboard {...viewProps} onNavigate={() => Alert.alert('Coming Soon', 'Accounts screen coming soon!')} />;
      default:
        return <Dashboard {...viewProps} />;
    }
  };

  const styles = getStyles();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#05212a" />

      {/* Main Content */}
      {renderCurrentView()}

      {/* Bottom Navigation */}
      <BottomNavigation
        currentView={currentView}
        onNavigate={handleNavigation}
        language={language}
        planLimits={planLimits}
        usage={usage}
      />

      {/* Simple Add Transaction Button */}
      <View style={styles.fabContainer}>
        <View style={styles.fab}>
          <TouchableOpacity
            onPress={() => openModal('addTransaction')}
            disabled={!canPerformAction('transactions').allowed}
            style={[
              styles.fabButton,
              { 
                backgroundColor: !canPerformAction('transactions').allowed ? '#6b7280' : '#98DDA6',
                opacity: !canPerformAction('transactions').allowed ? 0.6 : 1
              }
            ]}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        visible={activeModal === 'addTransaction'}
        onClose={closeModal}
        onSubmit={handleAddTransaction}
        categories={categories}
        accounts={accounts}
        language={language}
        currentPlan={currentPlan}
      />
    </View>
  );
}

const getStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05212a',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
  },
  fab: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#05212a',
  },
});