// src/components/finance/Dashboard.js - FIXED VERSION
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatters } from '../../utils/finance/formatters';

const { width } = Dimensions.get('window');

export default function Dashboard({
  accounts = [],
  transactions = [],
  budgets = [],
  goals = [],
  monthlyStats = {},
  categoryBreakdown = [],
  financialHealth = {},
  currentPlan,
  planLimits,
  usage,
  features,
  user,
  language,
  onAddTransaction,
  onAddAccount,
  onAddBudget,
  onUpgrade,
  onSignOut,
  checkFeatureAccess
}) {
  
  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    const greetings = {
      en: hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening',
      ru: hour < 12 ? 'Доброе утро' : hour < 17 ? 'Добрый день' : 'Добрый вечер',
      ky: hour < 12 ? 'Кайырлуу тан' : hour < 17 ? 'Кайырлуу күн' : 'Кайырлуу кеч'
    };
    return greetings[language] || greetings.en;
  };

  // Get plan status color
  const getPlanStatusColor = () => {
    switch (currentPlan) {
      case 'basic': return '#6b7280';
      case 'plus': return '#3b82f6';
      case 'pro': return '#7c3aed';
      default: return '#6b7280';
    }
  };

  // Calculate usage percentage
  const getUsagePercentage = (feature) => {
    const limit = planLimits[feature];
    const used = usage[feature] || 0;
    
    if (limit === -1) return 0; // Unlimited
    return Math.min(100, (used / limit) * 100);
  };

  // Get usage color
  const getUsageColor = (percentage) => {
    if (percentage >= 90) return '#ef4444';
    if (percentage >= 70) return '#f59e0b';
    return '#10b981';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.userSection}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.firstName || 'User'} 👋</Text>
            <View style={styles.planBadge}>
              <Text style={[styles.planText, { color: getPlanStatusColor() }]}>
                {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={onSignOut}>
            <Ionicons name="person-circle-outline" size={32} color="#98DDA6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Balance Overview */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>
          {formatters.currency(monthlyStats.totalBalance || 0, user?.currency)}
        </Text>
        <View style={styles.balanceStats}>
          <View style={styles.balanceStat}>
            <Text style={styles.balanceStatLabel}>This Month</Text>
            <Text style={[styles.balanceStatValue, { 
              color: (monthlyStats.netIncome || 0) >= 0 ? '#10b981' : '#ef4444' 
            }]}>
              {(monthlyStats.netIncome || 0) >= 0 ? '+' : ''}
              {formatters.currency(monthlyStats.netIncome || 0, user?.currency)}
            </Text>
          </View>
          <View style={styles.balanceStat}>
            <Text style={styles.balanceStatLabel}>Transactions</Text>
            <Text style={styles.balanceStatValue}>
              {monthlyStats.transactionCount || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Plan Usage Overview (Basic Plan Only) */}
      {currentPlan === 'basic' && (
        <View style={styles.usageCard}>
          <View style={styles.usageHeader}>
            <Text style={styles.usageTitle}>Plan Usage</Text>
            <TouchableOpacity onPress={onUpgrade}>
              <Text style={styles.upgradeLink}>Upgrade</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.usageItems}>
            {/* Transactions Usage */}
            <View style={styles.usageItem}>
              <View style={styles.usageItemHeader}>
                <Text style={styles.usageItemLabel}>Transactions</Text>
                <Text style={styles.usageItemCount}>
                  {usage.transactions}/{planLimits.transactions}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${getUsagePercentage('transactions')}%`,
                      backgroundColor: getUsageColor(getUsagePercentage('transactions'))
                    }
                  ]} 
                />
              </View>
            </View>

            {/* Accounts Usage */}
            <View style={styles.usageItem}>
              <View style={styles.usageItemHeader}>
                <Text style={styles.usageItemLabel}>Accounts</Text>
                <Text style={styles.usageItemCount}>
                  {usage.accounts}/{planLimits.accounts}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${getUsagePercentage('accounts')}%`,
                      backgroundColor: getUsageColor(getUsagePercentage('accounts'))
                    }
                  ]} 
                />
              </View>
            </View>

            {/* Budgets Usage */}
            <View style={styles.usageItem}>
              <View style={styles.usageItemHeader}>
                <Text style={styles.usageItemLabel}>Budgets</Text>
                <Text style={styles.usageItemCount}>
                  {usage.budgets}/{planLimits.budgets}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${getUsagePercentage('budgets')}%`,
                      backgroundColor: getUsageColor(getUsagePercentage('budgets'))
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={onAddTransaction}>
            <View style={styles.actionIcon}>
              <Ionicons name="add-circle" size={24} color="#98DDA6" />
            </View>
            <Text style={styles.actionLabel}>Add Transaction</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={onAddAccount}>
            <View style={styles.actionIcon}>
              <Ionicons name="card" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.actionLabel}>Add Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={onAddBudget}>
            <View style={styles.actionIcon}>
              <Ionicons name="pie-chart" size={24} color="#f59e0b" />
            </View>
            <Text style={styles.actionLabel}>Create Budget</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => checkFeatureAccess('aiInsights') && console.log('AI Insights')}
          >
            <View style={[styles.actionIcon, !features.aiInsights && styles.lockedIcon]}>
              <Ionicons 
                name={features.aiInsights ? "bulb" : "lock-closed"} 
                size={24} 
                color={features.aiInsights ? "#7c3aed" : "#6b7280"} 
              />
            </View>
            <Text style={[styles.actionLabel, !features.aiInsights && styles.lockedLabel]}>
              AI Insights {!features.aiInsights && '(Plus)'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Financial Health Score */}
      <View style={styles.healthCard}>
        <View style={styles.healthHeader}>
          <Text style={styles.sectionTitle}>Financial Health</Text>
          <View style={[styles.healthScore, { 
            backgroundColor: financialHealth.status === 'excellent' ? '#10b981' :
                           financialHealth.status === 'good' ? '#3b82f6' :
                           financialHealth.status === 'fair' ? '#f59e0b' : '#ef4444'
          }]}>
            <Text style={styles.healthScoreText}>
              {financialHealth.score || 0}
            </Text>
          </View>
        </View>
        <Text style={styles.healthStatus}>
          {financialHealth.status === 'excellent' ? 'Excellent' :
           financialHealth.status === 'good' ? 'Good' :
           financialHealth.status === 'fair' ? 'Fair' : 'Needs Improvement'}
        </Text>
        {financialHealth.factors && financialHealth.factors.length > 0 && (
          <View style={styles.healthFactors}>
            {financialHealth.factors.slice(0, 3).map((factor, index) => (
              <View key={index} style={styles.healthFactor}>
                <Ionicons 
                  name={factor.status === 'good' || factor.status === 'excellent' ? 
                        "checkmark-circle" : "alert-circle"} 
                  size={16} 
                  color={factor.status === 'good' || factor.status === 'excellent' ? 
                         "#10b981" : "#f59e0b"} 
                />
                <Text style={styles.healthFactorText}>{factor.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Recent Transactions */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllLink}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#6b7280" />
            <Text style={styles.emptyStateText}>No transactions yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add your first transaction to get started
            </Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={onAddTransaction}>
              <Text style={styles.emptyStateButtonText}>Add Transaction</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {transactions.slice(0, 5).map((transaction, index) => (
              <View key={index} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <Ionicons 
                    name={transaction.type === 'income' ? "arrow-down-circle" : "arrow-up-circle"} 
                    size={20} 
                    color={transaction.type === 'income' ? "#10b981" : "#ef4444"} 
                  />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description || 'Transaction'}
                  </Text>
                  <Text style={styles.transactionCategory}>
                    {transaction.category || 'Other'}
                  </Text>
                </View>
                <Text style={[styles.transactionAmount, {
                  color: transaction.type === 'income' ? "#10b981" : "#ef4444"
                }]}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatters.currency(Math.abs(transaction.amount), user?.currency)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Top Spending Categories</Text>
          <View style={styles.categoriesList}>
            {categoryBreakdown.slice(0, 4).map((item, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{item.category}</Text>
                  <Text style={styles.categoryAmount}>
                    {formatters.currency(item.amount, user?.currency)}
                  </Text>
                </View>
                <View style={styles.categoryBar}>
                  <View 
                    style={[
                      styles.categoryBarFill,
                      { 
                        width: `${(item.amount / categoryBreakdown[0].amount) * 100}%`,
                        backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'][index] || '#6b7280'
                      }
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Upgrade Prompt for Basic Users */}
      {currentPlan === 'basic' && (
        <View style={styles.upgradePrompt}>
          <View style={styles.upgradeContent}>
            <Ionicons name="star" size={24} color="#f59e0b" />
            <View style={styles.upgradeText}>
              <Text style={styles.upgradeTitle}>Unlock Premium Features</Text>
              <Text style={styles.upgradeSubtitle}>
                Get unlimited transactions, AI insights, and advanced analytics
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Text style={styles.upgradeButtonText}>Upgrade to Plus</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05212a',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  planBadge: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  planText: {
    fontSize: 12,
    fontWeight: '600',
  },
  profileButton: {
    padding: 8,
  },

  // Balance Card
  balanceCard: {
    backgroundColor: '#98DDA6',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.7)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceStat: {
    flex: 1,
  },
  balanceStatLabel: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 4,
  },
  balanceStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },

  // Usage Card (Basic Plan)
  usageCard: {
    backgroundColor: '#1f2937',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  usageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  upgradeLink: {
    fontSize: 14,
    color: '#98DDA6',
    fontWeight: '600',
  },
  usageItems: {
    gap: 16,
  },
  usageItem: {
    gap: 8,
  },
  usageItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageItemLabel: {
    fontSize: 14,
    color: '#d1d5db',
  },
  usageItemCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Quick Actions
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#1f2937',
    width: (width - 56) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(152, 221, 166, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  lockedIcon: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
  },
  actionLabel: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '500',
  },
  lockedLabel: {
    color: '#6b7280',
  },

  // Financial Health
  healthCard: {
    backgroundColor: '#1f2937',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  healthScore: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  healthStatus: {
    fontSize: 16,
    color: '#d1d5db',
    marginBottom: 12,
  },
  healthFactors: {
    gap: 8,
  },
  healthFactor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthFactorText: {
    fontSize: 14,
    color: '#9ca3af',
  },

  // Recent Transactions
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllLink: {
    fontSize: 14,
    color: '#98DDA6',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#98DDA6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  transactionsList: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#9ca3af',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Category Breakdown
  categorySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  categoriesList: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  categoryItem: {
    gap: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  categoryBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Upgrade Prompt
  upgradePrompt: {
    backgroundColor: '#1f2937',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  upgradeText: {
    flex: 1,
    marginLeft: 12,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  upgradeButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },

  bottomPadding: {
    height: 100,
  },
});