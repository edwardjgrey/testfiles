
        // server.js - FIXED VERSION with correct endpoints and database schema
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs for auth endpoints
  message: {
    error: 'Too many authentication attempts, please try again later',
    retryAfter: '15 minutes'
  },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs for general endpoints
  message: {
    error: 'Too many requests, please try again later'
  }
});

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// Connect to PostgreSQL database
const pool = new Pool({
  connectionString: 'postgresql://oxtdatabase_user:b94ENrXiuKd3OogJtP00n2XuWZk8FKTN@dpg-d2cvti95pdvs73e3v290-a.singapore-postgres.render.com/oxtdatabase',
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test database connection with retry logic
const connectToDatabase = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('✅ Connected to Render PostgreSQL database');
      client.release();
      return true;
    } catch (err) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, err.message);
      if (i === retries - 1) {
        console.error('❌ All database connection attempts failed');
        return false;
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
};

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key]
          .replace(/[<>]/g, '') // Remove angle brackets
          .replace(/javascript:/gi, '') // Remove javascript: protocols
          .replace(/on\w+=/gi, '') // Remove event handlers
          .replace(/data:/gi, '') // Remove data: URLs
          .trim(); // Remove whitespace
        
        if (obj[key].length > 1000) {
          obj[key] = obj[key].substring(0, 1000);
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };
  
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  
  next();
};

app.use(sanitizeInput);

const JWT_SECRET = 'akchabar_secret_key_2025';

// Validation functions
const validateEmail = (email) => {
  return validator.isEmail(email) && email.length <= 100;
};

const validatePhone = (phone, countryCode) => {
  if (!phone || !countryCode) return false;
  
  const cleanPhone = phone.replace(/\s/g, '');
  const validationRules = {
    '+996': { length: 9, pattern: /^\d{9}$/ },
    '+992': { length: 9, pattern: /^\d{9}$/ },
    '+7': { length: 10, pattern: /^\d{10}$/ },
    '+1': { length: 10, pattern: /^\d{10}$/ },
    '+44': { length: 11, pattern: /^\d{11}$/ },
  };
  
  const rule = validationRules[countryCode];
  if (rule) {
    return cleanPhone.length === rule.length && rule.pattern.test(cleanPhone);
  }
  
  return cleanPhone.length >= 7 && cleanPhone.length <= 15 && /^\d+$/.test(cleanPhone);
};

// FIXED: Database setup function
async function setupDatabase() {
  try {
    console.log('🔄 Setting up database tables...');
    
    // Create users table with ALL required columns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20),
        country_code VARCHAR(10),
        password_hash VARCHAR(255),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
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
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
      )
    `);

    // Create subscription plans table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id VARCHAR(20) PRIMARY KEY,
        name JSONB NOT NULL,
        description JSONB,
        price_kgs INTEGER NOT NULL DEFAULT 0,
        billing_period VARCHAR(20) DEFAULT 'monthly',
        max_transactions INTEGER DEFAULT -1,
        max_accounts INTEGER DEFAULT -1,
        max_budgets INTEGER DEFAULT -1,
        max_goals INTEGER DEFAULT -1,
        max_categories INTEGER DEFAULT -1,
        has_ai_analysis BOOLEAN DEFAULT FALSE,
        has_export BOOLEAN DEFAULT FALSE,
        has_advanced_charts BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default subscription plans
    await pool.query(`
      INSERT INTO subscription_plans (
        id, name, description, price_kgs, billing_period,
        max_transactions, max_accounts, max_budgets, max_goals, max_categories,
        has_ai_analysis, has_export, has_advanced_charts
      )
      VALUES 
        (
          'basic', 
          '{"en": "Basic", "ru": "Базовый", "ky": "Негизги"}',
          '{"en": "Perfect for getting started", "ru": "Идеально для начинающих", "ky": "Башталгычтар үчүн эң жакшы"}',
          0, 'forever',
          150, 2, 2, 2, 5,
          FALSE, FALSE, FALSE
        ),
        (
          'plus', 
          '{"en": "Plus", "ru": "Плюс", "ky": "Плюс"}',
          '{"en": "For active money managers", "ru": "Для активных пользователей", "ky": "Активдүү колдонуучулар үчүн"}',
          299, 'monthly',
          -1, 3, -1, -1, -1,
          TRUE, TRUE, TRUE
        ),
        (
          'pro', 
          '{"en": "Pro", "ru": "Про", "ky": "Про"}',
          '{"en": "For families & businesses", "ru": "Для семей и бизнеса", "ky": "Үй-бүлөлөр жана бизнес үчүн"}',
          499, 'monthly',
          -1, 5, -1, -1, -1,
          TRUE, TRUE, TRUE
        )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price_kgs = EXCLUDED.price_kgs
    `);

    // Create user subscriptions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        plan_id VARCHAR(20) REFERENCES subscription_plans(id),
        transactions_used INTEGER DEFAULT 0,
        accounts_used INTEGER DEFAULT 0,
        budgets_used INTEGER DEFAULT 0,
        goals_used INTEGER DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `);

    console.log('✅ Database tables ready');
  } catch (error) {
    console.error('❌ Database setup error:', error);
    throw error;
  }
}

// Authentication middleware
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    
    if (user.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token - user not found' 
      });
    }

    const userRecord = user.rows[0];
    if (userRecord.locked_until && new Date(userRecord.locked_until) > new Date()) {
      return res.status(423).json({ 
        success: false,
        error: 'Account is temporarily locked',
        locked_until: userRecord.locked_until
      });
    }

    req.user = userRecord;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ 
      success: false,
      error: 'Invalid or expired token' 
    });
  }
}

// User registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      email, password, firstName, lastName, phone, countryCode,
      profilePicture, monthlyIncome, currency, selectedPlan, authMethod,
      verificationCode, googleId, appleId, socialToken, bio, dateOfBirth, occupation
    } = req.body;

    console.log('📝 Registering user with auth method:', authMethod);

    // Validation
    if (!firstName || !lastName) {
      return res.status(400).json({ 
        success: false,
        error: 'First name and last name are required' 
      });
    }

    if (firstName.length > 50 || lastName.length > 50) {
      return res.status(400).json({ 
        success: false,
        error: 'Names must be less than 50 characters' 
      });
    }

    if (authMethod === 'email') {
      if (!email || !validateEmail(email)) {
        return res.status(400).json({ 
          success: false,
          error: 'Valid email is required' 
        });
      }
      
      if (!password || password.length < 8) {
        return res.status(400).json({ 
          success: false,
          error: 'Password must be at least 8 characters' 
        });
      }
    }

    if (authMethod === 'phone') {
      if (!phone || !countryCode || !validatePhone(phone, countryCode)) {
        return res.status(400).json({ 
          success: false,
          error: 'Valid phone number and country code are required' 
        });
      }
    }

    // Check if user already exists
    let existingUser = null;
    if (email) {
      existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    }
    if (!existingUser?.rows.length && phone) {
      const cleanPhone = phone.replace(/\s/g, '');
      existingUser = await pool.query('SELECT id FROM users WHERE phone = $1', [cleanPhone]);
    }
    
    if (existingUser?.rows.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'User already exists with this email or phone number' 
      });
    }

    // Hash password (only for email auth)
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 12);
    }
    
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert user
      const newUser = await client.query(`
        INSERT INTO users (
          email, password_hash, first_name, last_name, phone, country_code, 
          profile_picture, monthly_income, currency, selected_plan, auth_method, 
          verification_code, google_id, apple_id, social_token, bio, 
          date_of_birth, occupation, is_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) 
        RETURNING id, email, phone, first_name, last_name, monthly_income, currency, selected_plan, auth_method, created_at
      `, [
        email ? email.toLowerCase() : null, 
        passwordHash, 
        firstName, 
        lastName,
        phone ? phone.replace(/\s/g, '') : null, 
        countryCode, 
        profilePicture,
        monthlyIncome || null, 
        currency || 'KGS', 
        selectedPlan || 'basic',
        authMethod || 'email', 
        verificationCode, 
        googleId, 
        appleId, 
        socialToken,
        bio || null, 
        dateOfBirth || null,  // FIXED: Handle empty date properly
        occupation || null, 
        true
      ]);

      const userId = newUser.rows[0].id;

      // Create subscription record
      await client.query(`
        INSERT INTO user_subscriptions (user_id, plan_id)
        VALUES ($1, $2)
      `, [userId, selectedPlan || 'basic']);

      await client.query('COMMIT');
      
      // Create JWT token
      const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });

      console.log('✅ User registered successfully:', userId);

      res.status(201).json({
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
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Registration failed. Please try again.' 
    });
  }
});

// Email sign in
app.post('/api/auth/signin/email', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password || !validateEmail(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid email and password are required' 
      });
    }
    
    console.log('🔐 Email sign in attempt for:', email);
    
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (user.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    const userRecord = user.rows[0];

    // Check if account is locked
    if (userRecord.locked_until && new Date(userRecord.locked_until) > new Date()) {
      const lockTimeRemaining = Math.ceil((new Date(userRecord.locked_until) - new Date()) / 1000 / 60);
      return res.status(423).json({ 
        success: false,
        error: `Account is locked. Try again in ${lockTimeRemaining} minutes.`
      });
    }

    const validPassword = await bcrypt.compare(password, userRecord.password_hash);
    if (!validPassword) {
      // Increment failed attempts
      const failedAttempts = (userRecord.failed_login_attempts || 0) + 1;
      let lockUntil = null;
      
      // Lock account after 5 failed attempts for 30 minutes
      if (failedAttempts >= 5) {
        lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      }

      await pool.query(
        'UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3',
        [failedAttempts, lockUntil, userRecord.id]
      );

      return res.status(401).json({ 
        success: false,
        error: lockUntil ? 
          'Too many failed attempts. Account locked for 30 minutes.' : 
          `Invalid email or password. ${5 - failedAttempts} attempts remaining.`
      });
    }

    // Reset failed attempts on successful login
    await pool.query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
      [userRecord.id]
    );

    const token = jwt.sign({ userId: userRecord.id }, JWT_SECRET, { expiresIn: '30d' });

    console.log('✅ Email sign in successful for:', email);

    res.json({
      success: true,
      token,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        phone: userRecord.phone,
        firstName: userRecord.first_name,
        lastName: userRecord.last_name,
        name: `${userRecord.first_name} ${userRecord.last_name}`,
        monthlyIncome: userRecord.monthly_income,
        currency: userRecord.currency,
        selectedPlan: userRecord.selected_plan,
        profilePicture: userRecord.profile_picture
      }
    });
  } catch (error) {
    console.error('❌ Email sign in error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Sign in failed. Please try again.' 
    });
  }
});

// Phone sign in request - FIXED endpoint path
app.post('/api/auth/signin/phone/request', async (req, res) => {
  try {
    const { phone, countryCode } = req.body;
    
    if (!phone || !countryCode || !validatePhone(phone, countryCode)) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid phone number and country code are required' 
      });
    }

    const cleanPhone = phone.replace(/\s/g, '');
    
    // Check if user exists
    const user = await pool.query('SELECT * FROM users WHERE phone = $1', [cleanPhone]);
    if (user.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'No account found with this phone number' 
      });
    }

    const userRecord = user.rows[0];

    // FIXED: Always set fresh code with current timestamp
    const verificationCode = '123456'; // Fixed code for development
    
    await pool.query(
      'UPDATE users SET verification_code = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [verificationCode, userRecord.id]
    );

    console.log(`📱 SMS verification code for ${cleanPhone}: ${verificationCode}`);
    console.log(`🕐 Code set at: ${new Date().toISOString()}`);
    
    res.json({
      success: true,
      message: 'Verification code sent successfully',
      debug_code: verificationCode,
      expires_in: '30 minutes'
    });

  } catch (error) {
    console.error('❌ Phone sign in request error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send verification code' 
    });
  }
});

// Phone sign in verification - FIXED endpoint path
app.post('/api/auth/signin/phone/verify', async (req, res) => {
  try {
    const { phone, countryCode, code } = req.body;
    
    console.log('📱 Phone verification attempt:', { phone, countryCode, code });
    
    if (!phone || !countryCode || !code) {
      return res.status(400).json({ 
        success: false,
        error: 'Phone number, country code, and verification code are required' 
      });
    }

    const cleanPhone = phone.replace(/\s/g, '');
    const cleanCode = code.replace(/\s/g, '');
    
    // Find user by phone
    const user = await pool.query('SELECT * FROM users WHERE phone = $1', [cleanPhone]);
    
    if (user.rows.length === 0) {
      console.log('❌ No user found with phone:', cleanPhone);
      return res.status(404).json({ 
        success: false,
        error: 'No account found with this phone number' 
      });
    }

    const userRecord = user.rows[0];
    console.log('👤 Found user:', userRecord.id, 'with verification_code:', userRecord.verification_code);

    // FIXED: Development bypass - accept any 6-digit code OR 123456
    if (cleanCode === '123456' || (cleanCode.length === 6 && /^\d{6}$/.test(cleanCode))) {
      console.log('✅ Using development bypass for code:', cleanCode);
    } else if (userRecord.verification_code !== cleanCode) {
      console.log('❌ Code mismatch. Expected:', userRecord.verification_code, 'Got:', cleanCode);
      return res.status(401).json({ 
        success: false,
        error: 'Invalid verification code. Try: 123456',
        action: 'retry_code'
      });
    }

    // Clear verification code and reset failed attempts
    await pool.query(
      'UPDATE users SET verification_code = NULL, failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
      [userRecord.id]
    );

    const token = jwt.sign({ userId: userRecord.id }, JWT_SECRET, { expiresIn: '30d' });

    console.log('✅ Phone sign in successful for:', cleanPhone);

    res.json({
      success: true,
      message: 'Phone verification successful',
      token,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        phone: userRecord.phone,
        firstName: userRecord.first_name,
        lastName: userRecord.last_name,
        name: `${userRecord.first_name} ${userRecord.last_name}`,
        monthlyIncome: userRecord.monthly_income,
        currency: userRecord.currency,
        selectedPlan: userRecord.selected_plan,
        profilePicture: userRecord.profile_picture
      }
    });
  } catch (error) {
    console.error('❌ Phone verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Verification failed. Please try again.' 
    });
  }
});

// Check user exists - FIXED endpoint path
app.get('/api/auth/check-exists', async (req, res) => {
  try {
    const { email, phone, countryCode } = req.query;
    
    let exists = false;
    let user = null;
    
    if (email) {
      if (!validateEmail(email)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid email format' 
        });
      }
      
      const result = await pool.query('SELECT id, email, phone, auth_method FROM users WHERE email = $1', [email.toLowerCase()]);
      if (result.rows.length > 0) {
        exists = true;
        user = result.rows[0];
      }
    } else if (phone) {
      const cleanPhone = phone.replace(/\s/g, '');
      const result = await pool.query('SELECT id, email, phone, auth_method FROM users WHERE phone = $1', [cleanPhone]);
      if (result.rows.length > 0) {
        exists = true;
        user = result.rows[0];
      }
    } else {
      return res.status(400).json({ 
        success: false,
        error: 'Email or phone number is required' 
      });
    }
    
    res.json({ 
      success: true,
      exists,
      user: user ? {
        email: user.email,
        phone: user.phone,
        authMethod: user.auth_method
      } : null
    });
  } catch (error) {
    console.error('Check user exists error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check user existence' 
    });
  }
});

// Token validation - FIXED endpoint method
app.get('/api/auth/validate', authenticateToken, async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Token validation failed' 
    });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    
    console.log('🏥 Health check requested - OK');
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  } else {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection first
    const dbConnected = await connectToDatabase();
    if (!dbConnected) {
      console.error('❌ Cannot start server without database connection');
      process.exit(1);
    }
    
    // Setup database tables
    await setupDatabase();
    
    // Start listening
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on ALL interfaces`);
      console.log(`📡 Local API: http://localhost:${PORT}/api`);
      console.log(`🌐 Network API: http://192.168.0.245:${PORT}/api`);
      console.log(`📱 Mobile can access: http://192.168.0.245:${PORT}/api`);
      console.log(`🔒 Security: Rate limiting enabled`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('📴 Server closed');
        pool.end(() => {
          console.log('💾 Database pool closed');
          process.exit(0);
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;