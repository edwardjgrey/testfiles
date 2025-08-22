// scripts/setupSubscriptions.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://oxtdatabase_user:b94ENrXiuKd3OogJtP00n2XuWZk8FKTN@dpg-d2cvti95pdvs73e3v290-a.singapore-postgres.render.com/oxtdatabase',
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupCompleteDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Create subscription plans table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id VARCHAR(20) PRIMARY KEY,
        name JSONB NOT NULL,
        description JSONB NOT NULL,
        price_kgs INTEGER NOT NULL DEFAULT 0,
        price_usd INTEGER NOT NULL DEFAULT 0,
        billing_period VARCHAR(20) DEFAULT 'monthly',
        
        -- Transaction limits
        max_transactions INTEGER DEFAULT 100,
        
        -- Account limits
        max_accounts INTEGER DEFAULT 1,
        
        -- Category limits
        max_categories INTEGER DEFAULT 5,
        
        -- Budget & Goal limits
        max_budgets INTEGER DEFAULT 1,
        max_goals INTEGER DEFAULT 1,
        
        -- Feature access
        has_ai_analysis BOOLEAN DEFAULT FALSE,
        has_export BOOLEAN DEFAULT FALSE,
        has_advanced_charts BOOLEAN DEFAULT FALSE,
        has_bill_reminders BOOLEAN DEFAULT FALSE,
        has_investment_tracking BOOLEAN DEFAULT FALSE,
        has_family_sharing BOOLEAN DEFAULT FALSE,
        has_custom_categories BOOLEAN DEFAULT FALSE,
        has_bank_sync BOOLEAN DEFAULT FALSE,
        has_receipt_scanning BOOLEAN DEFAULT FALSE,
        has_priority_support BOOLEAN DEFAULT FALSE,
        
        -- Family sharing
        max_family_members INTEGER DEFAULT 1,
        
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create user subscriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        plan_id VARCHAR(20) REFERENCES subscription_plans(id),
        subscription_status VARCHAR(20) DEFAULT 'active',
        
        -- Trial information
        trial_start TIMESTAMP,
        trial_end TIMESTAMP,
        
        -- Billing information
        current_period_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        current_period_end TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 month',
        
        -- Usage tracking (resets each billing period)
        transactions_used INTEGER DEFAULT 0,
        budgets_used INTEGER DEFAULT 0,
        goals_used INTEGER DEFAULT 0,
        accounts_used INTEGER DEFAULT 0,
        categories_used INTEGER DEFAULT 0,
        
        -- Payment information
        payment_method_id VARCHAR(255),
        last_payment_date TIMESTAMP,
        next_billing_date TIMESTAMP,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(user_id)
      )
    `);

    // 3. Enhanced users table
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS financial_goals TEXT[];
      ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_tolerance VARCHAR(20) DEFAULT 'moderate';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS app_preferences JSONB DEFAULT '{}';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Bishkek';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS language_preference VARCHAR(10) DEFAULT 'en';
    `);

    // 4. Financial accounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS financial_accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(30) NOT NULL,
        currency VARCHAR(10) DEFAULT 'KGS',
        balance DECIMAL(15,2) DEFAULT 0,
        account_number VARCHAR(100),
        bank_name VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        color VARCHAR(7) DEFAULT '#98DDA6',
        icon VARCHAR(50) DEFAULT 'card-outline',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        parent_id INTEGER REFERENCES categories(id),
        color VARCHAR(7) DEFAULT '#6b7280',
        icon VARCHAR(50) DEFAULT 'grid-outline',
        is_default BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        account_id INTEGER REFERENCES financial_accounts(id),
        category_id INTEGER REFERENCES categories(id),
        amount DECIMAL(15,2) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
        description TEXT,
        notes TEXT,
        date DATE NOT NULL,
        location TEXT,
        receipt_url TEXT,
        
        -- Transfer specific
        to_account_id INTEGER REFERENCES financial_accounts(id),
        
        -- Recurring transaction reference
        recurring_transaction_id INTEGER,
        
        -- AI analysis (Pro feature)
        ai_category_confidence DECIMAL(3,2),
        ai_tags TEXT[],
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Budgets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        spent DECIMAL(15,2) DEFAULT 0,
        period_type VARCHAR(20) DEFAULT 'monthly',
        start_date DATE,
        end_date DATE,
        categories INTEGER[] DEFAULT '{}',
        alert_percentage INTEGER DEFAULT 80,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. Goals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS financial_goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        target_amount DECIMAL(15,2) NOT NULL,
        current_amount DECIMAL(15,2) DEFAULT 0,
        target_date DATE,
        goal_type VARCHAR(30) DEFAULT 'savings',
        description TEXT,
        is_achieved BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 9. Recurring transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS recurring_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        account_id INTEGER REFERENCES financial_accounts(id),
        category_id INTEGER REFERENCES categories(id),
        amount DECIMAL(15,2) NOT NULL,
        type VARCHAR(20) NOT NULL,
        description TEXT,
        frequency VARCHAR(20) NOT NULL,
        next_date DATE NOT NULL,
        end_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 10. Insert subscription plans
    await client.query(`
      INSERT INTO subscription_plans (id, name, description, price_kgs, price_usd, max_transactions, max_accounts, max_categories, max_budgets, max_goals, has_ai_analysis, has_export, has_advanced_charts, has_bill_reminders, has_investment_tracking, has_family_sharing, has_custom_categories, has_bank_sync, has_receipt_scanning, has_priority_support, max_family_members) VALUES
      (
        'basic',
        '{"en": "Basic", "ru": "Базовый", "ky": "Негизги"}',
        '{"en": "Perfect for getting started with personal finance tracking", "ru": "Идеально для начала отслеживания личных финансов", "ky": "Жеке каржы көзөмөлүн баштоо үчүн мыкты"}',
        0, 0, 100, 1, 5, 1, 1,
        FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 1
      ),
      (
        'plus',
        '{"en": "Plus", "ru": "Плюс", "ky": "Плюс"}',
        '{"en": "Advanced features for serious money management", "ru": "Расширенные функции для серьезного управления деньгами", "ky": "Олуттуу акча башкаруу үчүн кошумча мүмкүнчүлүктөр"}',
        299, 3, -1, 3, -1, -1, -1,
        TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, 1
      ),
      (
        'pro',
        '{"en": "Pro", "ru": "Про", "ky": "Про"}',
        '{"en": "Everything you need for complete financial control", "ru": "Все что нужно для полного финансового контроля", "ky": "Толук каржылык көзөмөл үчүн керектүү бардык нерсе"}',
        499, 6, -1, 5, -1, -1, -1,
        TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 5
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price_kgs = EXCLUDED.price_kgs,
        price_usd = EXCLUDED.price_usd,
        max_transactions = EXCLUDED.max_transactions,
        max_accounts = EXCLUDED.max_accounts,
        max_categories = EXCLUDED.max_categories,
        max_budgets = EXCLUDED.max_budgets,
        max_goals = EXCLUDED.max_goals,
        has_ai_analysis = EXCLUDED.has_ai_analysis,
        has_export = EXCLUDED.has_export,
        has_advanced_charts = EXCLUDED.has_advanced_charts,
        has_bill_reminders = EXCLUDED.has_bill_reminders,
        has_investment_tracking = EXCLUDED.has_investment_tracking,
        has_family_sharing = EXCLUDED.has_family_sharing,
        has_custom_categories = EXCLUDED.has_custom_categories,
        has_bank_sync = EXCLUDED.has_bank_sync,
        has_receipt_scanning = EXCLUDED.has_receipt_scanning,
        has_priority_support = EXCLUDED.has_priority_support,
        max_family_members = EXCLUDED.max_family_members
    `);

    // 11. Insert default categories
    await client.query(`
      INSERT INTO categories (user_id, name, type, color, icon, is_default) VALUES
      (NULL, 'Food & Dining', 'expense', '#ef4444', 'restaurant-outline', TRUE),
      (NULL, 'Transportation', 'expense', '#3b82f6', 'car-outline', TRUE),
      (NULL, 'Shopping', 'expense', '#8b5cf6', 'bag-outline', TRUE),
      (NULL, 'Entertainment', 'expense', '#f59e0b', 'game-controller-outline', TRUE),
      (NULL, 'Bills & Utilities', 'expense', '#06b6d4', 'receipt-outline', TRUE),
      (NULL, 'Salary', 'income', '#10b981', 'cash-outline', TRUE),
      (NULL, 'Business', 'income', '#6366f1', 'briefcase-outline', TRUE),
      (NULL, 'Investments', 'income', '#84cc16', 'trending-up-outline', TRUE)
      ON CONFLICT DO NOTHING
    `);

    // 12. Create trigger to assign basic plan to new users
    await client.query(`
      CREATE OR REPLACE FUNCTION assign_basic_plan()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO user_subscriptions (user_id, plan_id, subscription_status, current_period_end)
        VALUES (NEW.id, 'basic', 'active', CURRENT_TIMESTAMP + INTERVAL '1 year');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS assign_basic_plan_trigger ON users;
      CREATE TRIGGER assign_basic_plan_trigger
        AFTER INSERT ON users
        FOR EACH ROW
        EXECUTE FUNCTION assign_basic_plan();
    `);

    // 13. Create function to reset usage counts
    await client.query(`
      CREATE OR REPLACE FUNCTION reset_usage_counts()
      RETURNS void AS $$
      BEGIN
        UPDATE user_subscriptions 
        SET 
          transactions_used = 0,
          budgets_used = 0,
          goals_used = 0,
          accounts_used = 0,
          categories_used = 0,
          current_period_start = CURRENT_TIMESTAMP,
          current_period_end = CURRENT_TIMESTAMP + INTERVAL '1 month'
        WHERE current_period_end < CURRENT_TIMESTAMP;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query('COMMIT');
    console.log('✅ Database setup completed successfully!');
    console.log('📊 Subscription Plans Created:');
    console.log('   - Basic (Free): 100 transactions, 1 account, basic features');
    console.log('   - Plus (299 KGS): Unlimited transactions, AI analysis, export');
    console.log('   - Pro (499 KGS): Everything + family sharing, priority support');
    console.log('💾 Database Tables Created:');
    console.log('   - Enhanced users table with personal info');
    console.log('   - Financial accounts, categories, transactions');
    console.log('   - Budgets, goals, recurring transactions');
    console.log('   - Subscription management system');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

setupCompleteDatabase()
  .then(() => {
    console.log('🎉 Setup complete! Your database is ready for 100k+ users.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });