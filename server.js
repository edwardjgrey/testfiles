// server.js - Fixed to listen on all network interfaces
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to YOUR Render PostgreSQL database
const pool = new Pool({
  connectionString: 'postgresql://oxtdatabase_user:b94ENrXiuKd3OogJtP00n2XuWZk8FKTN@dpg-d2cvti95pdvs73e3v290-a.singapore-postgres.render.com/oxtdatabase',
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Connected to Render PostgreSQL database');
    release();
  }
});

// Middleware - Allow all origins for development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

const JWT_SECRET = '235711 ';

// Initialize database tables
async function setupDatabase() {
  try {
    console.log('🔄 Setting up database tables...');
    
    // Create users table with ALL fields for ALL auth methods
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255),
        phone VARCHAR(20),
        country_code VARCHAR(10),
        password_hash VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        profile_picture TEXT,
        monthly_income DECIMAL(12,2),
        currency VARCHAR(10) DEFAULT 'KGS',
        selected_plan VARCHAR(20) DEFAULT 'basic',
        auth_method VARCHAR(20) DEFAULT 'email',
        verification_code VARCHAR(10),
        google_id VARCHAR(255),
        apple_id VARCHAR(255),
        social_token TEXT,
        bio TEXT,
        date_of_birth DATE,
        occupation VARCHAR(100),
        is_verified BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Database tables ready');
  } catch (error) {
    console.error('❌ Database setup error:', error);
  }
}

// Auth middleware
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    
    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// Add these endpoints to your server.js file after the existing auth routes

// ===== FINANCE API ENDPOINTS =====

// Helper function to check subscription limits
async function checkSubscriptionLimit(userId, featureType) {
  try {
    const subscription = await pool.query(`
      SELECT us.*, sp.max_transactions, sp.max_accounts, sp.max_budgets, sp.max_goals, sp.max_categories
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = $1
    `, [userId]);

    if (subscription.rows.length === 0) {
      return { allowed: false, error: 'No subscription found' };
    }

    const sub = subscription.rows[0];
    const maxLimit = sub[`max_${featureType}`];
    const currentUsage = sub[`${featureType}_used`] || 0;

    // -1 means unlimited
    if (maxLimit === -1) {
      return { allowed: true, remaining: Infinity };
    }

    const allowed = currentUsage < maxLimit;
    const remaining = Math.max(0, maxLimit - currentUsage);

    return { 
      allowed, 
      remaining, 
      current: currentUsage, 
      limit: maxLimit,
      plan: sub.plan_id 
    };
  } catch (error) {
    console.error('Check subscription limit error:', error);
    return { allowed: false, error: 'Limit check failed' };
  }
}

// Helper function to increment usage
async function incrementUsage(userId, featureType, count = 1) {
  try {
    await pool.query(`
      UPDATE user_subscriptions 
      SET ${featureType}_used = ${featureType}_used + $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `, [userId, count]);
    return true;
  } catch (error) {
    console.error('Increment usage error:', error);
    return false;
  }
}

// ===== TRANSACTIONS ENDPOINTS =====

// Get user transactions
app.get('/api/finance/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 50, category, type, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE t.user_id = $1';
    let queryParams = [userId];
    let paramCount = 1;

    // Add filters
    if (category) {
      paramCount++;
      whereClause += ` AND t.category = $${paramCount}`;
      queryParams.push(category);
    }

    if (type) {
      paramCount++;
      whereClause += ` AND t.type = $${paramCount}`;
      queryParams.push(type);
    }

    if (startDate) {
      paramCount++;
      whereClause += ` AND t.date >= $${paramCount}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereClause += ` AND t.date <= $${paramCount}`;
      queryParams.push(endDate);
    }

    const transactions = await pool.query(`
      SELECT 
        t.*,
        fa.name as account_name,
        fa.type as account_type
      FROM transactions t
      LEFT JOIN financial_accounts fa ON t.account_id = fa.id
      ${whereClause}
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...queryParams, limit, offset]);

    // Get total count for pagination
    const totalCount = await pool.query(`
      SELECT COUNT(*) FROM transactions t ${whereClause}
    `, queryParams);

    res.json({
      success: true,
      transactions: transactions.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalCount.rows[0].count),
        totalPages: Math.ceil(totalCount.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create new transaction
app.post('/api/finance/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, type, description, category, account_id, date, notes } = req.body;

    // Validate required fields
    if (!amount || !type || !description || !account_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check transaction limit
    const limitCheck = await checkSubscriptionLimit(userId, 'transactions');
    if (!limitCheck.allowed) {
      return res.status(403).json({ 
        error: 'Transaction limit reached',
        plan: limitCheck.plan,
        limit: limitCheck.limit,
        current: limitCheck.current
      });
    }

    // Verify account belongs to user
    const accountCheck = await pool.query(
      'SELECT * FROM financial_accounts WHERE id = $1 AND user_id = $2',
      [account_id, userId]
    );

    if (accountCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Create transaction
    const transaction = await pool.query(`
      INSERT INTO transactions (user_id, account_id, amount, type, description, category, date, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [userId, account_id, amount, type, description, category, date || new Date().toISOString().split('T')[0], notes]);

    // Update account balance
    const balanceChange = type === 'income' ? amount : -Math.abs(amount);
    const updatedAccount = await pool.query(`
      UPDATE financial_accounts 
      SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `, [balanceChange, account_id, userId]);

    // Increment transaction usage
    await incrementUsage(userId, 'transactions', 1);

    res.json({
      success: true,
      transaction: transaction.rows[0],
      updatedAccount: updatedAccount.rows[0]
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update transaction
app.put('/api/finance/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const transactionId = req.params.id;
    const { amount, type, description, category, account_id, date, notes } = req.body;

    // Get original transaction
    const originalTransaction = await pool.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [transactionId, userId]
    );

    if (originalTransaction.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const original = originalTransaction.rows[0];

    // Update transaction
    const updatedTransaction = await pool.query(`
      UPDATE transactions 
      SET amount = $1, type = $2, description = $3, category = $4, 
          account_id = $5, date = $6, notes = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 AND user_id = $9
      RETURNING *
    `, [amount, type, description, category, account_id, date, notes, transactionId, userId]);

    // Reverse original balance change
    const originalBalanceChange = original.type === 'income' ? -original.amount : Math.abs(original.amount);
    await pool.query(`
      UPDATE financial_accounts 
      SET balance = balance + $1
      WHERE id = $2
    `, [originalBalanceChange, original.account_id]);

    // Apply new balance change
    const newBalanceChange = type === 'income' ? amount : -Math.abs(amount);
    const updatedAccount = await pool.query(`
      UPDATE financial_accounts 
      SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [newBalanceChange, account_id]);

    res.json({
      success: true,
      transaction: updatedTransaction.rows[0],
      updatedAccount: updatedAccount.rows[0]
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete transaction
app.delete('/api/finance/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const transactionId = req.params.id;

    // Get transaction to reverse balance change
    const transaction = await pool.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [transactionId, userId]
    );

    if (transaction.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const trans = transaction.rows[0];

    // Reverse balance change
    const balanceChange = trans.type === 'income' ? -trans.amount : Math.abs(trans.amount);
    await pool.query(`
      UPDATE financial_accounts 
      SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [balanceChange, trans.account_id]);

    // Delete transaction
    await pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [transactionId, userId]);

    // Decrement usage (but don't go below 0)
    await pool.query(`
      UPDATE user_subscriptions 
      SET transactions_used = GREATEST(0, transactions_used - 1)
      WHERE user_id = $1
    `, [userId]);

    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// ===== ACCOUNTS ENDPOINTS =====

// Get user accounts
app.get('/api/finance/accounts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const accounts = await pool.query(`
      SELECT * FROM financial_accounts 
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at ASC
    `, [userId]);

    res.json({
      success: true,
      accounts: accounts.rows
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Create new account
app.post('/api/finance/accounts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, type, currency = 'KGS', balance = 0, account_number, bank_name, color = '#98DDA6', icon = 'card-outline' } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    // Check account limit
    const limitCheck = await checkSubscriptionLimit(userId, 'accounts');
    if (!limitCheck.allowed) {
      return res.status(403).json({ 
        error: 'Account limit reached',
        plan: limitCheck.plan,
        limit: limitCheck.limit,
        current: limitCheck.current
      });
    }

    // Create account
    const account = await pool.query(`
      INSERT INTO financial_accounts (user_id, name, type, currency, balance, account_number, bank_name, color, icon)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [userId, name, type, currency, balance, account_number, bank_name, color, icon]);

    // Increment account usage
    await incrementUsage(userId, 'accounts', 1);

    res.json({
      success: true,
      account: account.rows[0]
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Update account
app.put('/api/finance/accounts/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const accountId = req.params.id;
    const { name, type, currency, balance, account_number, bank_name, color, icon } = req.body;

    const updatedAccount = await pool.query(`
      UPDATE financial_accounts 
      SET name = $1, type = $2, currency = $3, balance = $4, 
          account_number = $5, bank_name = $6, color = $7, icon = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 AND user_id = $10
      RETURNING *
    `, [name, type, currency, balance, account_number, bank_name, color, icon, accountId, userId]);

    if (updatedAccount.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({
      success: true,
      account: updatedAccount.rows[0]
    });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// Delete account
app.delete('/api/finance/accounts/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const accountId = req.params.id;

    // Check if account has transactions
    const transactionCheck = await pool.query(
      'SELECT COUNT(*) FROM transactions WHERE account_id = $1',
      [accountId]
    );

    if (parseInt(transactionCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete account with existing transactions. Please delete transactions first.' 
      });
    }

    // Soft delete account
    const deletedAccount = await pool.query(`
      UPDATE financial_accounts 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [accountId, userId]);

    if (deletedAccount.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Decrement usage
    await pool.query(`
      UPDATE user_subscriptions 
      SET accounts_used = GREATEST(0, accounts_used - 1)
      WHERE user_id = $1
    `, [userId]);

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ===== BUDGETS ENDPOINTS =====

// Get user budgets
app.get('/api/finance/budgets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const budgets = await pool.query(`
      SELECT * FROM budgets 
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at DESC
    `, [userId]);

    res.json({
      success: true,
      budgets: budgets.rows
    });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// Create budget
app.post('/api/finance/budgets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, amount, period_type = 'monthly', start_date, end_date, categories = [], alert_percentage = 80 } = req.body;

    // Validate required fields
    if (!name || !amount) {
      return res.status(400).json({ error: 'Name and amount are required' });
    }

    // Check budget limit
    const limitCheck = await checkSubscriptionLimit(userId, 'budgets');
    if (!limitCheck.allowed) {
      return res.status(403).json({ 
        error: 'Budget limit reached',
        plan: limitCheck.plan,
        limit: limitCheck.limit,
        current: limitCheck.current
      });
    }

    // Create budget
    const budget = await pool.query(`
      INSERT INTO budgets (user_id, name, amount, period_type, start_date, end_date, categories, alert_percentage)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [userId, name, amount, period_type, start_date, end_date, categories, alert_percentage]);

    // Increment budget usage
    await incrementUsage(userId, 'budgets', 1);

    res.json({
      success: true,
      budget: budget.rows[0]
    });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

// Update budget
app.put('/api/finance/budgets/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const budgetId = req.params.id;
    const { name, amount, period_type, start_date, end_date, categories, alert_percentage } = req.body;

    const updatedBudget = await pool.query(`
      UPDATE budgets 
      SET name = $1, amount = $2, period_type = $3, start_date = $4, 
          end_date = $5, categories = $6, alert_percentage = $7,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 AND user_id = $9
      RETURNING *
    `, [name, amount, period_type, start_date, end_date, categories, alert_percentage, budgetId, userId]);

    if (updatedBudget.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json({
      success: true,
      budget: updatedBudget.rows[0]
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

// Delete budget
app.delete('/api/finance/budgets/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const budgetId = req.params.id;

    const deletedBudget = await pool.query(`
      UPDATE budgets 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [budgetId, userId]);

    if (deletedBudget.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    // Decrement usage
    await pool.query(`
      UPDATE user_subscriptions 
      SET budgets_used = GREATEST(0, budgets_used - 1)
      WHERE user_id = $1
    `, [userId]);

    res.json({ success: true, message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

// ===== GOALS ENDPOINTS =====

// Get user goals
app.get('/api/finance/goals', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const goals = await pool.query(`
      SELECT * FROM financial_goals 
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at DESC
    `, [userId]);

    res.json({
      success: true,
      goals: goals.rows
    });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Create goal
app.post('/api/finance/goals', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, target_amount, current_amount = 0, target_date, goal_type = 'savings', description } = req.body;

    // Validate required fields
    if (!name || !target_amount) {
      return res.status(400).json({ error: 'Name and target amount are required' });
    }

    // Check goal limit
    const limitCheck = await checkSubscriptionLimit(userId, 'goals');
    if (!limitCheck.allowed) {
      return res.status(403).json({ 
        error: 'Goal limit reached',
        plan: limitCheck.plan,
        limit: limitCheck.limit,
        current: limitCheck.current
      });
    }

    // Create goal
    const goal = await pool.query(`
      INSERT INTO financial_goals (user_id, name, target_amount, current_amount, target_date, goal_type, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [userId, name, target_amount, current_amount, target_date, goal_type, description]);

    // Increment goal usage
    await incrementUsage(userId, 'goals', 1);

    res.json({
      success: true,
      goal: goal.rows[0]
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Update goal
app.put('/api/finance/goals/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = req.params.id;
    const { name, target_amount, current_amount, target_date, goal_type, description, is_achieved } = req.body;

    const updatedGoal = await pool.query(`
      UPDATE financial_goals 
      SET name = $1, target_amount = $2, current_amount = $3, target_date = $4, 
          goal_type = $5, description = $6, is_achieved = $7,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 AND user_id = $9
      RETURNING *
    `, [name, target_amount, current_amount, target_date, goal_type, description, is_achieved, goalId, userId]);

    if (updatedGoal.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({
      success: true,
      goal: updatedGoal.rows[0]
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// Delete goal
app.delete('/api/finance/goals/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = req.params.id;

    const deletedGoal = await pool.query(`
      UPDATE financial_goals 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [goalId, userId]);

    if (deletedGoal.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Decrement usage
    await pool.query(`
      UPDATE user_subscriptions 
      SET goals_used = GREATEST(0, goals_used - 1)
      WHERE user_id = $1
    `, [userId]);

    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// ===== CATEGORIES ENDPOINT =====

// Get available categories based on subscription plan
app.get('/api/finance/categories', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's subscription plan
    const subscription = await pool.query(`
      SELECT sp.id as plan_id
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = $1
    `, [userId]);

    const planId = subscription.rows[0]?.plan_id || 'basic';

    // Default categories for Basic plan (limited to 3)
    const basicCategories = [
      { id: 'food', name: 'Food & Dining', icon: 'restaurant-outline', color: '#ef4444' },
      { id: 'transport', name: 'Transportation', icon: 'car-outline', color: '#3b82f6' },
      { id: 'other', name: 'Other', icon: 'grid-outline', color: '#6b7280' }
    ];

    // All categories for Plus/Pro plans
    const allCategories = [
      ...basicCategories,
      { id: 'shopping', name: 'Shopping', icon: 'bag-outline', color: '#8b5cf6' },
      { id: 'entertainment', name: 'Entertainment', icon: 'game-controller-outline', color: '#f59e0b' },
      { id: 'bills', name: 'Bills & Utilities', icon: 'receipt-outline', color: '#06b6d4' },
      { id: 'healthcare', name: 'Healthcare', icon: 'medical-outline', color: '#ec4899' },
      { id: 'education', name: 'Education', icon: 'school-outline', color: '#10b981' },
      { id: 'travel', name: 'Travel', icon: 'airplane-outline', color: '#f97316' },
      { id: 'salary', name: 'Salary', icon: 'cash-outline', color: '#10b981' },
      { id: 'business', name: 'Business', icon: 'briefcase-outline', color: '#6366f1' },
      { id: 'investments', name: 'Investments', icon: 'trending-up-outline', color: '#84cc16' }
    ];

    const categories = planId === 'basic' ? basicCategories : allCategories;

    res.json({
      success: true,
      categories,
      plan: planId,
      categoryLimit: planId === 'basic' ? 3 : -1
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ===== SUBSCRIPTION MANAGEMENT ENDPOINTS =====

// Check subscription limit
app.post('/api/subscriptions/check-limit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { feature } = req.body;

    if (!feature) {
      return res.status(400).json({ error: 'Feature type is required' });
    }

    const result = await checkSubscriptionLimit(userId, feature);
    res.json(result);
  } catch (error) {
    console.error('Check limit error:', error);
    res.status(500).json({ error: 'Failed to check limit' });
  }
});

// Increment usage counter
app.post('/api/subscriptions/increment-usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { feature, count = 1 } = req.body;

    if (!feature) {
      return res.status(400).json({ error: 'Feature type is required' });
    }

    const success = await incrementUsage(userId, feature, count);
    
    if (success) {
      res.json({ success: true, message: 'Usage updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update usage' });
    }
  } catch (error) {
    console.error('Increment usage error:', error);
    res.status(500).json({ error: 'Failed to increment usage' });
  }
});

// Get current subscription and usage
app.get('/api/subscriptions/current', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const subscription = await pool.query(`
      SELECT 
        us.*,
        sp.name->>'en' as plan_name,
        sp.max_transactions,
        sp.max_accounts,
        sp.max_budgets,
        sp.max_goals,
        sp.has_ai_analysis,
        sp.has_export,
        sp.has_advanced_charts,
        sp.price_kgs
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = $1
    `, [userId]);

    if (subscription.rows.length === 0) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    res.json({
      success: true,
      subscription: subscription.rows[0]
    });
  } catch (error) {
    console.error('Get current subscription error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({ 
    status: 'Server running and healthy', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Register user with ALL data (universal for all auth methods)
app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      countryCode,
      profilePicture,
      monthlyIncome,
      currency,
      selectedPlan,
      authMethod,
      verificationCode,
      googleId,
      appleId,
      socialToken,
      bio,
      dateOfBirth,
      occupation
    } = req.body;

    console.log('📝 Registering user with auth method:', authMethod);
    console.log('📊 User data received:', {
      firstName,
      lastName,
      email,
      phone,
      authMethod,
      selectedPlan,
      currency
    });

    // Validate required fields
    if (!firstName || !lastName) {
      console.log('❌ Missing required fields: firstName or lastName');
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    // For email auth, password is required
    if (authMethod === 'email' && !password) {
      console.log('❌ Missing password for email registration');
      return res.status(400).json({ error: 'Password is required for email registration' });
    }

    // Check if user already exists (by email or phone)
    let existingUser = null;
    if (email) {
      existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    }
    if (!existingUser?.rows.length && phone) {
      existingUser = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    }
    
    if (existingUser?.rows.length > 0) {
      console.log('❌ User already exists');
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password (only for email auth)
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 12);
    }
    
    // Save ALL user data to database
    const newUser = await pool.query(`
      INSERT INTO users (
        email, 
        password_hash, 
        first_name, 
        last_name, 
        phone, 
        country_code, 
        profile_picture, 
        monthly_income, 
        currency, 
        selected_plan, 
        auth_method, 
        verification_code,
        google_id,
        apple_id,
        social_token,
        bio,
        date_of_birth,
        occupation,
        is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) 
      RETURNING id, email, phone, first_name, last_name, monthly_income, currency, selected_plan, auth_method, created_at
    `, [
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      countryCode,
      profilePicture,
      monthlyIncome,
      currency,
      selectedPlan,
      authMethod,
      verificationCode,
      googleId,
      appleId,
      socialToken,
      bio,
      dateOfBirth,
      occupation,
      true
    ]);

    // Create JWT token
    const token = jwt.sign({ userId: newUser.rows[0].id }, JWT_SECRET, { expiresIn: '30d' });

    console.log('✅ User saved to Render database successfully!');
    console.log('👤 New user:', newUser.rows[0]);

    res.json({
      success: true,
      message: `User registered successfully with ${authMethod} authentication`,
      token,
      user: {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
        phone: newUser.rows[0].phone,
        firstName: newUser.rows[0].first_name,
        lastName: newUser.rows[0].last_name,
        name: `${newUser.rows[0].first_name} ${newUser.rows[0].last_name}`,
        monthlyIncome: newUser.rows[0].monthly_income,
        currency: newUser.rows[0].currency,
        selectedPlan: newUser.rows[0].selected_plan,
        authMethod: newUser.rows[0].auth_method,
        createdAt: newUser.rows[0].created_at
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Failed to save user data to database' });
  }
});

// Sign in
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Sign in attempt for:', email);
    
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      console.log('❌ User not found');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) {
      console.log('❌ Invalid password');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.rows[0].id }, JWT_SECRET, { expiresIn: '30d' });

    console.log('✅ Sign in successful for:', email);

    res.json({
      success: true,
      token,
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        phone: user.rows[0].phone,
        firstName: user.rows[0].first_name,
        lastName: user.rows[0].last_name,
        name: `${user.rows[0].first_name} ${user.rows[0].last_name}`,
        monthlyIncome: user.rows[0].monthly_income,
        currency: user.rows[0].currency,
        selectedPlan: user.rows[0].selected_plan,
        profilePicture: user.rows[0].profile_picture
      }
    });
  } catch (error) {
    console.error('❌ Sign in error:', error);
    res.status(500).json({ error: 'Sign in failed' });
  }
});

// Validate token
app.post('/api/auth/validate', authenticateToken, async (req, res) => {
  console.log('🔍 Token validation for user:', req.user.id);
  res.json({ 
    success: true, 
    user: {
      id: req.user.id,
      email: req.user.email,
      phone: req.user.phone,
      firstName: req.user.first_name,
      lastName: req.user.last_name,
      name: `${req.user.first_name} ${req.user.last_name}`,
      monthlyIncome: req.user.monthly_income,
      currency: req.user.currency,
      selectedPlan: req.user.selected_plan,
      profilePicture: req.user.profile_picture
    }
  });
});

// Start server - IMPORTANT: Listen on all interfaces (0.0.0.0)
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on ALL interfaces`);
  console.log(`📡 Local API: http://localhost:${PORT}/api`);
  console.log(`🌐 Network API: http://192.168.0.245:${PORT}/api`);
  console.log(`📱 Mobile can access: http://192.168.0.245:${PORT}/api`);
  await setupDatabase();
});

module.exports = app;