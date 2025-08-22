// src/components/finance/TransactionsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TransactionsScreen = ({
  transactions = [],
  accounts = [],
  categories = [],
  currentPlan,
  planLimits,
  usage,
  features,
  language,
  user,
  loading,
  error,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onUpgrade,
  formatters,
  calculations,
  refreshData
}) => {
  // State for filtering and search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [refreshing, setRefreshing] = useState(false);

  // Get texts based on language
  const getText = (key) => {
    const texts = {
      en: {
        transactions: 'Transactions',
        search: 'Search transactions...',
        allCategories: 'All Categories',
        allAccounts: 'All Accounts',
        noTransactions: 'No transactions found',
        addFirst: 'Add your first transaction to get started',
        date: 'Date',
        amount: 'Amount',
        category: 'Category',
        account: 'Account',
        description: 'Description',
        income: 'Income',
        expense: 'Expense',
        edit: 'Edit',
        delete: 'Delete',
        confirmDelete: 'Delete Transaction',
        deleteMessage: 'Are you sure you want to delete this transaction?',
        cancel: 'Cancel',
        sortNewest: 'Newest First',
        sortOldest: 'Oldest First',
        sortHighest: 'Highest Amount',
        sortLowest: 'Lowest Amount',
        limitReached: 'Transaction Limit Reached',
        upgradeMessage: 'Upgrade to Plus for unlimited transactions!',
        filters: 'Filters',
        sort: 'Sort',
        today: 'Today',
        yesterday: 'Yesterday',
        thisWeek: 'This Week',
        thisMonth: 'This Month'
      },
      ky: {
        transactions: 'Транзакциялар',
        search: 'Транзакцияларды издөө...',
        allCategories: 'Бардык категориялар',
        allAccounts: 'Бардык эсептер',
        noTransactions: 'Транзакциялар табылган жок',
        addFirst: 'Биринчи транзакцияңызды кошуңуз',
        date: 'Күнү',
        amount: 'Сумма',
        category: 'Категория',
        account: 'Эсеп',
        description: 'Сүрөттөмө',
        income: 'Киреше',
        expense: 'Чыгаша',
        edit: 'Өзгөртүү',
        delete: 'Өчүрүү',
        confirmDelete: 'Транзакцияны өчүрүү',
        deleteMessage: 'Бул транзакцияны өчүрөсүзбү?',
        cancel: 'Жокко чыгаруу',
        sortNewest: 'Жаңысы алгач',
        sortOldest: 'Эскиси алгач',
        sortHighest: 'Эң чоң сумма',
        sortLowest: 'Эң кичине сумма',
        limitReached: 'Транзакция лимити бүттү',
        upgradeMessage: 'Чексиз транзакциялар үчүн Plus планына өтүңүз!',
        filters: 'Чыпкалар',
        sort: 'Ирээттөө',
        today: 'Бүгүн',
        yesterday: 'Кече',
        thisWeek: 'Бул жума',
        thisMonth: 'Бул ай'
      }
    };
    return texts[language]?.[key] || texts.en[key] || key;
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData?.();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter and sort transactions
  const getFilteredTransactions = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.account?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Account filter
    if (selectedAccount !== 'all') {
      filtered = filtered.filter(t => t.account_id === selectedAccount);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.date) - new Date(a.date);
        case 'date_asc':
          return new Date(a.date) - new Date(b.date);
        case 'amount_desc':
          return Math.abs(b.amount) - Math.abs(a.amount);
        case 'amount_asc':
          return Math.abs(a.amount) - Math.abs(b.amount);
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });

    return filtered;
  };

  // Handle delete transaction
  const handleDeleteTransaction = (transaction) => {
    Alert.alert(
      getText('confirmDelete'),
      getText('deleteMessage'),
      [
        { text: getText('cancel'), style: 'cancel' },
        {
          text: getText('delete'),
          style: 'destructive',
          onPress: () => {
            onDeleteTransaction?.(transaction.id);
          }
        }
      ]
    );
  };

  // Get account name by ID
  const getAccountName = (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.name || 'Unknown Account';
  };

  // Format date relative to today
  const formatDateRelative = (date) => {
    const today = new Date();
    const transactionDate = new Date(date);
    const diffTime = today - transactionDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return getText('today');
    if (diffDays === 1) return getText('yesterday');
    if (diffDays <= 7) return getText('thisWeek');
    if (diffDays <= 30) return getText('thisMonth');
    
    return formatters?.formatDate(date) || new Date(date).toLocaleDateString();
  };

  // Render transaction item
  const renderTransactionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onLongPress={() => handleDeleteTransaction(item)}
      onPress={() => onEditTransaction?.(item)}
    >
      <View style={styles.transactionHeader}>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDetails}>
            {item.category} • {getAccountName(item.account_id)}
          </Text>
          <Text style={styles.transactionDate}>
            {formatDateRelative(item.date)}
          </Text>
        </View>
        
        <View style={styles.transactionAmount}>
          <Text style={[
            styles.amountText,
            { color: item.type === 'income' ? '#10b981' : '#ef4444' }
          ]}>
            {item.type === 'income' ? '+' : '-'}
            {formatters?.formatCurrency(Math.abs(item.amount)) || `${Math.abs(item.amount)} сом`}
          </Text>
          <View style={[
            styles.typeIndicator,
            { backgroundColor: item.type === 'income' ? '#10b981' : '#ef4444' }
          ]}>
            <Ionicons 
              name={item.type === 'income' ? 'arrow-down' : 'arrow-up'} 
              size={12} 
              color="#ffffff" 
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render filter buttons
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filtersTitle}>{getText('filters')}</Text>
      
      {/* Category Filter */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>{getText('category')}:</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            // In a real app, this would open a picker modal
            Alert.alert('Filter', 'Category filter coming soon!');
          }}
        >
          <Text style={styles.filterButtonText}>
            {selectedCategory === 'all' ? getText('allCategories') : selectedCategory}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Account Filter */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>{getText('account')}:</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            Alert.alert('Filter', 'Account filter coming soon!');
          }}
        >
          <Text style={styles.filterButtonText}>
            {selectedAccount === 'all' ? getText('allAccounts') : getAccountName(selectedAccount)}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color="#374151" />
      <Text style={styles.emptyStateTitle}>{getText('noTransactions')}</Text>
      <Text style={styles.emptyStateSubtitle}>{getText('addFirst')}</Text>
      <TouchableOpacity style={styles.addButton} onPress={onAddTransaction}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  const filteredTransactions = getFilteredTransactions();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{getText('transactions')}</Text>
        
        {/* Usage indicator for Basic plan */}
        {currentPlan === 'basic' && (
          <View style={styles.usageIndicator}>
            <Text style={styles.usageText}>
              {usage?.transactions || 0}/{planLimits?.transactions || 150}
            </Text>
            <View style={styles.usageBar}>
              <View 
                style={[
                  styles.usageProgress,
                  { 
                    width: `${Math.min(100, ((usage?.transactions || 0) / (planLimits?.transactions || 150)) * 100)}%`,
                    backgroundColor: usage?.transactions >= planLimits?.transactions * 0.8 ? '#f59e0b' : '#98DDA6'
                  }
                ]} 
              />
            </View>
          </View>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={getText('search')}
          placeholderTextColor="#9ca3af"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Filters */}
      {renderFilters()}

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#98DDA6"
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={filteredTransactions.length === 0 ? styles.emptyContainer : styles.listContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05212a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  usageIndicator: {
    alignItems: 'flex-end',
  },
  usageText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  usageBar: {
    width: 60,
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  usageProgress: {
    height: '100%',
    borderRadius: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 14,
  },
  filtersContainer: {
    backgroundColor: '#1f2937',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    color: '#9ca3af',
    flex: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 2,
  },
  filterButtonText: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionItem: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionInfo: {
    flex: 1,
    marginRight: 16,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  transactionDetails: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  typeIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#98DDA6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#05212a',
  },
});

export default TransactionsScreen;