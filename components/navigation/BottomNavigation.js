// src/components/navigation/BottomNavigation.js
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BottomNavigation = ({
  currentView,
  onNavigate,
  language,
  planLimits,
  usage
}) => {
  // Get texts based on language
  const getText = (key) => {
    const texts = {
      en: {
        dashboard: 'Dashboard',
        transactions: 'Transactions',
        accounts: 'Accounts',
        budgets: 'Budgets',
        analytics: 'Analytics'
      },
      ky: {
        dashboard: 'Башкы бет',
        transactions: 'Транзакциялар',
        accounts: 'Эсептер',
        budgets: 'Бюджеттер',
        analytics: 'Аналитика'
      }
    };
    return texts[language]?.[key] || texts.en[key] || key;
  };

  // Navigation items
  const navItems = [
    {
      id: 'dashboard',
      label: getText('dashboard'),
      icon: 'home',
      iconFocused: 'home'
    },
    {
      id: 'transactions',
      label: getText('transactions'),
      icon: 'receipt-outline',
      iconFocused: 'receipt',
      showBadge: true
    },
    {
      id: 'accounts',
      label: getText('accounts'),
      icon: 'wallet-outline',
      iconFocused: 'wallet'
    },
    {
      id: 'budgets',
      label: getText('budgets'),
      icon: 'pie-chart-outline',
      iconFocused: 'pie-chart'
    },
    {
      id: 'analytics',
      label: getText('analytics'),
      icon: 'analytics-outline',
      iconFocused: 'analytics'
    }
  ];

  // Render navigation item
  const renderNavItem = (item) => {
    const isActive = currentView === item.id;
    const iconName = isActive ? item.iconFocused : item.icon;
    
    // Show usage badge for transactions
    const showUsageBadge = item.showBadge && usage?.transactions > 0;
    const isApproachingLimit = usage?.transactions >= (planLimits?.transactions || 150) * 0.8;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.navItem, isActive && styles.navItemActive]}
        onPress={() => onNavigate(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={iconName}
            size={24}
            color={isActive ? '#98DDA6' : '#9ca3af'}
          />
          
          {/* Usage badge for transactions */}
          {showUsageBadge && (
            <View style={[
              styles.badge,
              { backgroundColor: isApproachingLimit ? '#f59e0b' : '#98DDA6' }
            ]}>
              <Text style={styles.badgeText}>
                {usage.transactions > 99 ? '99+' : usage.transactions}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={[
          styles.navLabel,
          { color: isActive ? '#98DDA6' : '#9ca3af' }
        ]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {navItems.map(renderNavItem)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#05212a',
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    paddingTop: 12,
    paddingBottom: 32, // Extra padding for safe area
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navItemActive: {
    // Active state styling handled by color changes
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#05212a',
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default BottomNavigation;