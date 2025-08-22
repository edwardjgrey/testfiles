// src/utils/finance/formatters.js
export const formatters = {
  // Format currency based on user's preference
  currency: (amount, currency = 'KGS') => {
    const formatters = {
      KGS: (amt) => {
        const formatted = Math.abs(amt).toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        });
        return `${formatted} сом`;
      },
      USD: (amt) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2
        }).format(Math.abs(amt));
      },
      EUR: (amt) => {
        return new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2
        }).format(Math.abs(amt));
      },
      RUB: (amt) => {
        const formatted = Math.abs(amt).toLocaleString('ru-RU', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        });
        return `${formatted} ₽`;
      },
      GBP: (amt) => {
        return new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: 'GBP',
          minimumFractionDigits: 2
        }).format(Math.abs(amt));
      }
    };
    
    return formatters[currency] ? formatters[currency](amount) : `${amount} ${currency}`;
  },

  // Format percentage
  percentage: (value, decimals = 1) => {
    return `${value.toFixed(decimals)}%`;
  },

  // Format large numbers (K, M, B)
  compactNumber: (num) => {
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
    return `${(num / 1000000000).toFixed(1)}B`;
  },

  // Format date
  date: (date, format = 'short') => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - d);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (format === 'relative') {
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    }

    if (format === 'short') {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }

    if (format === 'long') {
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    return d.toLocaleDateString();
  },

  // Format time
  time: (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Format account number (mask for security)
  accountNumber: (number, showLast = 4) => {
    if (!number) return '••••';
    const str = number.toString();
    if (str.length <= showLast) return str;
    const masked = '•'.repeat(str.length - showLast);
    return `${masked}${str.slice(-showLast)}`;
  },

  // Format transaction type
  transactionType: (type, language = 'en') => {
    const types = {
      income: {
        en: 'Income',
        ru: 'Доход',
        ky: 'Киреше'
      },
      expense: {
        en: 'Expense',
        ru: 'Расход',
        ky: 'Чыгым'
      },
      transfer: {
        en: 'Transfer',
        ru: 'Перевод',
        ky: 'Которуу'
      }
    };

    return types[type]?.[language] || types[type]?.en || type;
  },

  // Format plan name
  planName: (plan, language = 'en') => {
    const plans = {
      basic: {
        en: 'Basic',
        ru: 'Базовый',
        ky: 'Негизги'
      },
      plus: {
        en: 'Plus',
        ru: 'Плюс',
        ky: 'Плюс'
      },
      pro: {
        en: 'Pro',
        ru: 'Про',
        ky: 'Про'
      }
    };

    return plans[plan]?.[language] || plans[plan]?.en || plan;
  },

  // Format category name
  categoryName: (category, language = 'en') => {
    const categories = {
      'Food & Dining': {
        en: 'Food & Dining',
        ru: 'Еда и рестораны',
        ky: 'Тамак жана ресторандар'
      },
      'Transportation': {
        en: 'Transportation',
        ru: 'Транспорт',
        ky: 'Транспорт'
      },
      'Shopping': {
        en: 'Shopping',
        ru: 'Покупки',
        ky: 'Соода'
      },
      'Entertainment': {
        en: 'Entertainment',
        ru: 'Развлечения',
        ky: 'Эрмек'
      },
      'Bills & Utilities': {
        en: 'Bills & Utilities',
        ru: 'Счета и коммунальные услуги',
        ky: 'Эсептер жана коммуналдык кызматтар'
      },
      'Healthcare': {
        en: 'Healthcare',
        ru: 'Здравоохранение',
        ky: 'Медицина'
      },
      'Education': {
        en: 'Education',
        ru: 'Образование',
        ky: 'Билим берүү'
      },
      'Travel': {
        en: 'Travel',
        ru: 'Путешествия',
        ky: 'Саякат'
      },
      'Salary': {
        en: 'Salary',
        ru: 'Зарплата',
        ky: 'Айлык'
      },
      'Business': {
        en: 'Business',
        ru: 'Бизнес',
        ky: 'Бизнес'
      },
      'Investments': {
        en: 'Investments',
        ru: 'Инвестиции',
        ky: 'Инвестициялар'
      },
      'Other': {
        en: 'Other',
        ru: 'Другое',
        ky: 'Башка'
      }
    };

    return categories[category]?.[language] || categories[category]?.en || category;
  },

  // Format financial health status
  healthStatus: (status, language = 'en') => {
    const statuses = {
      excellent: {
        en: 'Excellent',
        ru: 'Отлично',
        ky: 'Абдан жакшы'
      },
      good: {
        en: 'Good',
        ru: 'Хорошо',
        ky: 'Жакшы'
      },
      fair: {
        en: 'Fair',
        ru: 'Удовлетворительно',
        ky: 'Канааттандырарлык'
      },
      poor: {
        en: 'Needs Improvement',
        ru: 'Требует улучшения',
        ky: 'Жакшыртууну талап кылат'
      }
    };

    return statuses[status]?.[language] || statuses[status]?.en || status;
  },

  // Format duration
  duration: (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  },

  // Format file size
  fileSize: (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  },

  // Format subscription renewal date
  renewalDate: (date, language = 'en') => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = d - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const labels = {
      en: {
        today: 'Today',
        tomorrow: 'Tomorrow',
        days: 'days',
        expired: 'Expired'
      },
      ru: {
        today: 'Сегодня',
        tomorrow: 'Завтра',
        days: 'дней',
        expired: 'Истек'
      },
      ky: {
        today: 'Бүгүн',
        tomorrow: 'Эртеӊ',
        days: 'күн',
        expired: 'Мөөнөтү бүттү'
      }
    };

    const l = labels[language] || labels.en;

    if (diffDays < 0) return l.expired;
    if (diffDays === 0) return l.today;
    if (diffDays === 1) return l.tomorrow;
    return `${diffDays} ${l.days}`;
  },

  // Format usage limit
  usageLimit: (used, limit, language = 'en') => {
    if (limit === -1) {
      const labels = {
        en: 'Unlimited',
        ru: 'Безлимитно',
        ky: 'Чексиз'
      };
      return labels[language] || labels.en;
    }
    return `${used}/${limit}`;
  },

  // Format upgrade price
  upgradePrice: (priceKGS, priceGBP, currency = 'KGS') => {
    if (currency === 'GBP') {
      return `£${priceGBP}/month`;
    }
    return `${priceKGS} сом/month`;
  },

  // Format budget progress
  budgetProgress: (spent, budget) => {
    const percentage = (spent / budget) * 100;
    if (percentage <= 50) return 'On Track';
    if (percentage <= 80) return 'Close to Limit';
    if (percentage <= 100) return 'Almost Over';
    return 'Over Budget';
  },

  // Format goal progress
  goalProgress: (current, target) => {
    const percentage = (current / target) * 100;
    if (percentage >= 100) return 'Completed';
    if (percentage >= 75) return 'Almost There';
    if (percentage >= 50) return 'Halfway';
    if (percentage >= 25) return 'Getting Started';
    return 'Just Started';
  },

  // Format validation error
  validationError: (field, language = 'en') => {
    const errors = {
      required: {
        en: 'This field is required',
        ru: 'Это поле обязательно',
        ky: 'Бул талаа милдеттүү'
      },
      invalidEmail: {
        en: 'Please enter a valid email',
        ru: 'Введите корректный email',
        ky: 'Туура email киргизиңиз'
      },
      invalidAmount: {
        en: 'Please enter a valid amount',
        ru: 'Введите корректную сумму',
        ky: 'Туура суммасын киргизиңиз'
      },
      minAmount: {
        en: 'Amount must be greater than 0',
        ru: 'Сумма должна быть больше 0',
        ky: 'Суммасы 0дөн чоң болушу керек'
      }
    };

    return errors[field]?.[language] || errors[field]?.en || 'Invalid input';
  }
};

// src/utils/finance/calculations.js
export const calculations = {
  // Calculate monthly spending average
  monthlyAverage: (transactions, months = 12) => {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    
    const recentTransactions = transactions.filter(t => 
      new Date(t.date) >= cutoffDate && t.type === 'expense'
    );
    
    const totalSpent = recentTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return totalSpent / months;
  },

  // Calculate spending trend
  spendingTrend: (transactions) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthSpending = transactions
      .filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear && 
               t.type === 'expense';
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const lastMonthSpending = transactions
      .filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === lastMonth && 
               date.getFullYear() === lastMonthYear && 
               t.type === 'expense';
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    if (lastMonthSpending === 0) return { trend: 'neutral', percentage: 0 };

    const change = ((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100;
    
    return {
      trend: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'neutral',
      percentage: Math.abs(change),
      change: currentMonthSpending - lastMonthSpending
    };
  },

  // Calculate savings rate
  savingsRate: (income, expenses) => {
    if (income <= 0) return 0;
    return ((income - expenses) / income) * 100;
  },

  // Calculate emergency fund score
  emergencyFundScore: (balance, monthlyExpenses) => {
    if (monthlyExpenses <= 0) return 100;
    const months = balance / monthlyExpenses;
    
    if (months >= 6) return 100;
    if (months >= 3) return 75;
    if (months >= 1) return 50;
    return 25;
  },

  // Calculate debt-to-income ratio
  debtToIncomeRatio: (monthlyDebtPayments, monthlyIncome) => {
    if (monthlyIncome <= 0) return 0;
    return (monthlyDebtPayments / monthlyIncome) * 100;
  },

  // Calculate budget variance
  budgetVariance: (budgets, transactions) => {
    return budgets.map(budget => {
      const spent = transactions
        .filter(t => 
          t.type === 'expense' && 
          budget.categories.includes(t.category_id)
        )
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const variance = spent - budget.amount;
      const percentage = budget.amount > 0 ? (variance / budget.amount) * 100 : 0;

      return {
        ...budget,
        spent,
        variance,
        percentage,
        status: percentage > 10 ? 'over' : percentage > -10 ? 'ontrack' : 'under'
      };
    });
  },

  // Calculate goal projection
  goalProjection: (goal, monthlyContribution) => {
    const remaining = goal.target_amount - goal.current_amount;
    if (monthlyContribution <= 0) return { months: Infinity, date: null };
    
    const monthsToGoal = Math.ceil(remaining / monthlyContribution);
    const completionDate = new Date();
    completionDate.setMonth(completionDate.getMonth() + monthsToGoal);
    
    return {
      months: monthsToGoal,
      date: completionDate,
      onTrack: goal.target_date ? completionDate <= new Date(goal.target_date) : true
    };
  },

  // Calculate net worth
  netWorth: (accounts, debts = []) => {
    const assets = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const liabilities = debts.reduce((sum, debt) => sum + debt.balance, 0);
    return assets - liabilities;
  },

  // Calculate expense categories percentage
  expenseBreakdown: (transactions) => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const total = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    if (total === 0) return [];

    const categoryTotals = {};
    expenses.forEach(t => {
      const category = t.category || 'Other';
      categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(t.amount);
    });

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / total) * 100
      }))
      .sort((a, b) => b.amount - a.amount);
  },

  // Calculate cash flow forecast
  cashFlowForecast: (accounts, recurringTransactions, months = 6) => {
    const currentBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const monthlyIncome = recurringTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpenses = recurringTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const monthlyCashFlow = monthlyIncome - monthlyExpenses;
    const forecast = [];
    
    for (let i = 1; i <= months; i++) {
      const projectedBalance = currentBalance + (monthlyCashFlow * i);
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      
      forecast.push({
        month: i,
        date,
        balance: projectedBalance,
        cashFlow: monthlyCashFlow
      });
    }
    
    return forecast;
  }
};