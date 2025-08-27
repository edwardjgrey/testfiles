// server.js - COMPLETE PRODUCTION-READY VERSION WITH PASSWORD RESET
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const crypto = require('crypto');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Debug environment variables
console.log('Environment variables loaded:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set!');
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('DATA')));
}

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_URL'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false
}));

// Enhanced rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 10, // Stricter in production
  message: {
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.originalUrl}`);
    res.status(429).json({
      success: false,
      error: 'Too many attempts. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 200,
  message: {
    error: 'Too many requests. Please slow down.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// Production-grade CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [process.env.FRONTEND_URL, 'http://localhost:19006', 'exp://localhost:19000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Validate DATABASE_URL before creating pool
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  console.error('Please check your .env file contains: DATABASE_URL=postgresql://...');
  process.exit(1);
}

console.log('Creating database pool with URL:', process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@'));

// Enhanced PostgreSQL connection with retry logic
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  maxUses: 7500, // Close connection after this many queries
  allowExitOnIdle: true
});

// Database connection with enhanced error handling
const connectToDatabase = async (retries = 5, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('Connected to PostgreSQL database');
      
      // Test query
      await client.query('SELECT NOW()');
      client.release();
      return true;
    } catch (err) {
      console.error(`Database connection attempt ${i + 1}/${retries} failed:`, err.message);
      
      if (i === retries - 1) {
        console.error('All database connection attempts failed');
        throw err;
      }
      
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Graceful database connection handling
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

pool.on('connect', () => {
  console.log('New database connection established');
});

// Enhanced middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ success: false, error: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Enhanced input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potentially dangerous characters
        obj[key] = obj[key]
          .replace(/[<>]/g, '') // Remove angle brackets
          .replace(/javascript:/gi, '') // Remove javascript: protocols
          .replace(/on\w+=/gi, '') // Remove event handlers
          .replace(/data:/gi, '') // Remove data: URLs
          .trim(); // Remove whitespace
        
        // Limit length to prevent DoS
        if (obj[key].length > 10000) {
          obj[key] = obj[key].substring(0, 10000);
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

// Enhanced JWT secret validation
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

// Enhanced validation functions
const validateEmail = (email) => {
  if (!email) return false;
  if (email.length > 254) return false; // RFC 5321 limit
  return validator.isEmail(email, {
    allow_utf8_local_part: false,
    require_tld: true
  });
};

const validatePhone = (phone, countryCode) => {
  if (!phone || !countryCode) return false;
  
  const cleanPhone = phone.replace(/\s/g, '');
  if (!/^\d+$/.test(cleanPhone)) return false;
  
  const validationRules = {
    '+996': { minLength: 9, maxLength: 9, pattern: /^[2-9]\d{8}$/ },
    '+992': { minLength: 9, maxLength: 9, pattern: /^[2-9]\d{8}$/ },
    '+7': { minLength: 10, maxLength: 10, pattern: /^[3-9]\d{9}$/ },
    '+1': { minLength: 10, maxLength: 10, pattern: /^[2-9]\d{2}[2-9]\d{6}$/ },
    '+44': { minLength: 10, maxLength: 11, pattern: /^7[0-9]\d{8,9}$/ },
  };
  
  const rule = validationRules[countryCode];
  if (rule) {
    return cleanPhone.length >= rule.minLength && 
           cleanPhone.length <= rule.maxLength && 
           rule.pattern.test(cleanPhone);
  }
  
  return cleanPhone.length >= 7 && cleanPhone.length <= 15;
};

// Enhanced password validation
const validatePassword = (password) => {
  if (!password) return { valid: false, error: 'Password is required' };
  if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters long' };
  if (password.length > 128) return { valid: false, error: 'Password too long' };
  
  // Check for at least one letter and one number
  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter and one number' };
  }
  
  // Check for common weak passwords
  const weakPasswords = [
    'password', '12345678', 'qwerty123', 'password123', 'admin123',
    'welcome123', 'password1', 'qwerty12', '123456789'
  ];
  
  if (weakPasswords.includes(password.toLowerCase())) {
    return { valid: false, error: 'This password is too common. Please choose a stronger password.' };
  }
  
  return { valid: true };
};

// Enhanced database setup function with migrations
async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Setting up database tables...');
    
    await client.query('BEGIN');
    
    // Drop existing tables to recreate with correct schema (DEVELOPMENT ONLY)
    // if (process.env.NODE_ENV === 'development') {
    //   await client.query('DROP TABLE IF EXISTS audit_logs CASCADE');
    //   await client.query('DROP TABLE IF EXISTS user_subscriptions CASCADE');
    //   await client.query('DROP TABLE IF EXISTS subscription_plans CASCADE');
    //   await client.query('DROP TABLE IF EXISTS users CASCADE');
    //   console.log('Dropped existing tables for fresh setup');
    // }
    // Create users table with enhanced security fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(254) UNIQUE,
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
        verification_code_expires TIMESTAMP,
        google_id VARCHAR(255),
        apple_id VARCHAR(255),
        social_token TEXT,
        bio TEXT,
        date_of_birth DATE,
        occupation VARCHAR(100),
        is_verified BOOLEAN DEFAULT FALSE,
        is_email_verified BOOLEAN DEFAULT FALSE,
        is_phone_verified BOOLEAN DEFAULT FALSE,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        last_login TIMESTAMP,
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
      )
    `);

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
      CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
      CREATE INDEX IF NOT EXISTS idx_users_apple_id ON users(apple_id);
      CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);
    `);

    // Create subscription plans table
    await client.query(`
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
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert subscription plans with proper conflict handling
    await client.query(`
      INSERT INTO subscription_plans (
        id, name, description, price_kgs, billing_period,
        max_transactions, max_accounts, max_budgets, max_goals, max_categories,
        has_ai_analysis, has_export, has_advanced_charts
      )
      VALUES 
        (
          'basic', 
          '{"en": "Basic", "ru": "Базовый", "ky": "Негизги"}',
          '{"en": "Perfect for getting started", "ru": "Идеально для начинающих", "ky": "Баштагычтар үчүн эң жакшы"}',
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
        price_kgs = EXCLUDED.price_kgs,
        updated_at = CURRENT_TIMESTAMP
    `);

    // Create user subscriptions table
    await client.query(`
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

    // Create audit log table for security
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100),
        ip_address INET,
        user_agent TEXT,
        success BOOLEAN DEFAULT TRUE,
        error_message TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    console.log('Database tables setup complete');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database setup error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Display user and subscription statistics
async function displayUserStats() {
  try {
    // Get total user count
    const totalUsersResult = await pool.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = parseInt(totalUsersResult.rows[0].total);

    // Get users by authentication method
    const authMethodsResult = await pool.query(`
      SELECT auth_method, COUNT(*) as count 
      FROM users 
      GROUP BY auth_method 
      ORDER BY count DESC
    `);

    // Get users by subscription plan
    const subscriptionResult = await pool.query(`
      SELECT sp.id as plan_id, sp.name->>'en' as plan_name, COUNT(us.user_id) as user_count
      FROM subscription_plans sp
      LEFT JOIN user_subscriptions us ON sp.id = us.plan_id AND us.is_active = TRUE
      GROUP BY sp.id, sp.name
      ORDER BY user_count DESC
    `);

    // Get verification statistics
    const verificationResult = await pool.query(`
      SELECT 
        COUNT(CASE WHEN is_verified = TRUE THEN 1 END) as verified,
        COUNT(CASE WHEN is_email_verified = TRUE THEN 1 END) as email_verified,
        COUNT(CASE WHEN is_phone_verified = TRUE THEN 1 END) as phone_verified
      FROM users
    `);

    // Get recent registrations (last 24 hours)
    const recentResult = await pool.query(`
      SELECT COUNT(*) as recent_registrations
      FROM users 
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);

    console.log('\n=== USER STATISTICS ===');
    console.log(`Total Users: ${totalUsers}`);
    
    if (totalUsers > 0) {
      console.log('\nAuthentication Methods:');
      authMethodsResult.rows.forEach(row => {
        const percentage = ((row.count / totalUsers) * 100).toFixed(1);
        console.log(`  ${row.auth_method || 'unknown'}: ${row.count} users (${percentage}%)`);
      });

      console.log('\nSubscription Plans:');
      subscriptionResult.rows.forEach(row => {
        const percentage = totalUsers > 0 ? ((row.user_count / totalUsers) * 100).toFixed(1) : '0.0';
        console.log(`  ${row.plan_name}: ${row.user_count} users (${percentage}%)`);
      });

      console.log('\nVerification Status:');
      const verificationData = verificationResult.rows[0];
      console.log(`  Verified: ${verificationData.verified}/${totalUsers} (${((verificationData.verified / totalUsers) * 100).toFixed(1)}%)`);
      console.log(`  Email Verified: ${verificationData.email_verified}/${totalUsers} (${((verificationData.email_verified / totalUsers) * 100).toFixed(1)}%)`);
      console.log(`  Phone Verified: ${verificationData.phone_verified}/${totalUsers} (${((verificationData.phone_verified / totalUsers) * 100).toFixed(1)}%)`);

      const recentRegistrations = parseInt(recentResult.rows[0].recent_registrations);
      console.log(`\nRecent Activity:`);
      console.log(`  New registrations (24h): ${recentRegistrations}`);
    } else {
      console.log('No users registered yet.');
    }
    
    console.log('========================\n');

  } catch (error) {
    console.error('Error displaying user stats:', error.message);
  }
}

// Enhanced authentication middleware
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
    const user = await pool.query(
      'SELECT id, email, phone, first_name, last_name, locked_until, is_verified FROM users WHERE id = $1', 
      [decoded.userId]
    );
    
    if (user.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token - user not found' 
      });
    }

    const userRecord = user.rows[0];
    
    // Check if account is locked
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
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    } else {
      console.error('Token verification error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Authentication failed' 
      });
    }
  }
}

// Audit logging function
async function logAuditEvent(userId, action, resource, req, success = true, errorMessage = null, metadata = null) {
  try {
    await pool.query(`
      INSERT INTO audit_logs (user_id, action, resource, ip_address, user_agent, success, error_message, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      userId,
      action,
      resource,
      req.ip,
      req.get('User-Agent'),
      success,
      errorMessage,
      metadata ? JSON.stringify(metadata) : null
    ]);
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

// ==================== AUTHENTICATION ENDPOINTS ====================

// Enhanced user registration
app.post('/api/auth/register', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      email, password, firstName, lastName, phone, countryCode,
      profilePicture, monthlyIncome, currency, selectedPlan, authMethod,
      verificationCode, googleId, appleId, socialToken, bio, dateOfBirth, occupation
    } = req.body;

    console.log('Registration attempt:', { authMethod, email: !!email, phone: !!phone });

    // Enhanced validation
    if (!firstName || !lastName) {
      return res.status(400).json({ 
        success: false,
        error: 'First name and last name are required',
        code: 'MISSING_NAME'
      });
    }

    if (firstName.length > 50 || lastName.length > 50) {
      return res.status(400).json({ 
        success: false,
        error: 'Names must be less than 50 characters',
        code: 'NAME_TOO_LONG'
      });
    }

    // Validate based on auth method
    if (authMethod === 'email') {
      if (!email || !validateEmail(email)) {
        return res.status(400).json({ 
          success: false,
          error: 'Valid email is required',
          code: 'INVALID_EMAIL'
        });
      }
      
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ 
          success: false,
          error: passwordValidation.error,
          code: 'INVALID_PASSWORD'
        });
      }
    }

    if (authMethod === 'phone') {
      if (!phone || !countryCode || !validatePhone(phone, countryCode)) {
        return res.status(400).json({ 
          success: false,
          error: 'Valid phone number and country code are required',
          code: 'INVALID_PHONE'
        });
      }
    }

    await client.query('BEGIN');

    // Check for existing user
    let existingUser = null;
    if (email) {
      const emailCheck = await client.query('SELECT id, email FROM users WHERE email = $1', [email.toLowerCase()]);
      existingUser = emailCheck.rows[0];
    }
    if (!existingUser && phone) {
      const cleanPhone = phone.replace(/\s/g, '');
      const phoneCheck = await client.query('SELECT id, phone FROM users WHERE phone = $1', [cleanPhone]);
      existingUser = phoneCheck.rows[0];
    }
    
    if (existingUser) {
      await logAuditEvent(null, 'REGISTRATION_FAILED', 'users', req, false, 'User already exists');
      
      return res.status(409).json({ 
        success: false,
        error: 'User already exists with this email or phone number',
        code: 'USER_EXISTS',
        shouldSignIn: true
      });
    }

    // Hash password if provided
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, parseInt(process.env.PASSWORD_HASH_ROUNDS) || 12);
    }
    
    // Generate verification code for email users
    const needsVerification = authMethod === 'email';
    const verificationCodeToStore = needsVerification ? 
      Math.random().toString().substring(2, 8).padStart(6, '0') : null;
    const verificationExpires = needsVerification ? 
      new Date(Date.now() + 30 * 60 * 1000) : null; // 30 minutes

    // Insert new user
    const newUser = await client.query(`
      INSERT INTO users (
        email, password_hash, first_name, last_name, phone, country_code, 
        profile_picture, monthly_income, currency, selected_plan, auth_method, 
        verification_code, verification_code_expires, google_id, apple_id, social_token, 
        bio, date_of_birth, occupation, is_verified, is_email_verified, is_phone_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) 
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
      verificationCodeToStore,
      verificationExpires,
      googleId, 
      appleId, 
      socialToken,
      bio || null, 
      dateOfBirth || null,
      occupation || null, 
      authMethod === 'phone', // Phone users are verified immediately after SMS
      authMethod !== 'email', // Email users need verification
      authMethod === 'phone'
    ]);

    const userId = newUser.rows[0].id;

    // Create subscription record
    await client.query(`
      INSERT INTO user_subscriptions (user_id, plan_id)
      VALUES ($1, $2)
    `, [userId, selectedPlan || 'basic']);

    await client.query('COMMIT');
    
    // Log successful registration
    await logAuditEvent(userId, 'USER_REGISTERED', 'users', req, true, null, { 
      authMethod, 
      hasEmail: !!email, 
      hasPhone: !!phone 
    });

    // Generate JWT
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });

    console.log('User registered successfully:', userId);

    // Send verification email if needed (implement separately)
    if (needsVerification && email) {
      // TODO: Send verification email
      console.log('Verification code for', email, ':', verificationCodeToStore);
    }

    res.status(201).json({
      success: true,
      message: `User registered successfully with ${authMethod} authentication`,
      token,
      needsVerification: needsVerification,
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
    console.error('Registration error:', error);
    
    await logAuditEvent(null, 'REGISTRATION_ERROR', 'users', req, false, error.message);
    
    res.status(500).json({ 
      success: false,
      error: 'Registration failed. Please try again.',
      code: 'REGISTRATION_ERROR'
    });
  } finally {
    client.release();
  }
});

// Enhanced email sign in with better error handling
app.post('/api/auth/signin/email', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid email is required',
        code: 'INVALID_EMAIL'
      });
    }
    
    console.log('Email sign in attempt for:', email);
    
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (user.rows.length === 0) {
      await logAuditEvent(null, 'SIGNIN_FAILED', 'users', req, false, 'User not found');
      
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const userRecord = user.rows[0];

    // Check if account is locked
    if (userRecord.locked_until && new Date(userRecord.locked_until) > new Date()) {
      const lockTimeRemaining = Math.ceil((new Date(userRecord.locked_until) - new Date()) / 1000 / 60);
      
      await logAuditEvent(userRecord.id, 'SIGNIN_BLOCKED', 'users', req, false, 'Account locked');
      
      return res.status(423).json({ 
        success: false,
        error: `Account is locked. Try again in ${lockTimeRemaining} minutes.`,
        code: 'ACCOUNT_LOCKED',
        retryAfter: lockTimeRemaining * 60
      });
    }

    // Verify password
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

      await logAuditEvent(userRecord.id, 'SIGNIN_FAILED', 'users', req, false, `Invalid password (${failedAttempts} attempts)`);

      return res.status(401).json({ 
        success: false,
        error: lockUntil ? 
          'Too many failed attempts. Account locked for 30 minutes.' : 
          `Invalid email or password. ${5 - failedAttempts} attempts remaining.`,
        code: lockUntil ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS',
        attemptsRemaining: lockUntil ? 0 : (5 - failedAttempts)
      });
    }

    // Success - reset failed attempts and update last login
    await pool.query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = $1',
      [userRecord.id]
    );

    const token = jwt.sign({ userId: userRecord.id }, JWT_SECRET, { expiresIn: '30d' });

    await logAuditEvent(userRecord.id, 'SIGNIN_SUCCESS', 'users', req, true);

    console.log('Email sign in successful for:', email);

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
        profilePicture: userRecord.profile_picture,
        isVerified: userRecord.is_verified,
        isEmailVerified: userRecord.is_email_verified
      }
    });
  } catch (error) {
    console.error('Email sign in error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Sign in failed. Please try again.',
      code: 'SIGNIN_ERROR'
    });
  }
});

// Enhanced phone sign-in request
app.post('/api/auth/signin/phone/request', async (req, res) => {
  try {
    const { phone, countryCode } = req.body;
    
    if (!phone || !countryCode || !validatePhone(phone, countryCode)) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid phone number and country code are required',
        code: 'INVALID_PHONE'
      });
    }

    const cleanPhone = phone.replace(/\s/g, '');
    
    // Check if user exists
    const user = await pool.query('SELECT * FROM users WHERE phone = $1', [cleanPhone]);
    if (user.rows.length === 0) {
      await logAuditEvent(null, 'PHONE_SIGNIN_FAILED', 'users', req, false, 'User not found');
      
      return res.status(404).json({ 
        success: false,
        error: 'No account found with this phone number',
        code: 'USER_NOT_FOUND'
      });
    }

    const userRecord = user.rows[0];

    // Check if account is locked
    if (userRecord.locked_until && new Date(userRecord.locked_until) > new Date()) {
      return res.status(423).json({ 
        success: false,
        error: 'Account is temporarily locked. Please try again later.',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Generate and store verification code
    const verificationCode = Math.random().toString().substring(2, 8).padStart(6, '0');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await pool.query(
      'UPDATE users SET verification_code = $1, verification_code_expires = $2 WHERE id = $3',
      [verificationCode, expiresAt, userRecord.id]
    );

    // TODO: Send SMS with Twilio
    console.log(`SMS verification code for ${cleanPhone}: ${verificationCode}`);
    
    await logAuditEvent(userRecord.id, 'PHONE_VERIFICATION_SENT', 'users', req, true);
    
    res.json({
      success: true,
      message: 'Verification code sent successfully',
      expiresIn: '10 minutes',
      // Remove in production:
      debug_code: process.env.NODE_ENV === 'development' ? verificationCode : undefined
    });

  } catch (error) {
    console.error('Phone sign in request error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send verification code',
      code: 'SMS_SEND_ERROR'
    });
  }
});

// Enhanced phone sign-in verification
app.post('/api/auth/signin/phone/verify', async (req, res) => {
  try {
    const { phone, countryCode, code } = req.body;
    
    if (!phone || !countryCode || !code) {
      return res.status(400).json({ 
        success: false,
        error: 'Phone number, country code, and verification code are required',
        code: 'MISSING_FIELDS'
      });
    }

    const cleanPhone = phone.replace(/\s/g, '');
    const cleanCode = code.replace(/\s/g, '');
    
    // Find user by phone
    const user = await pool.query('SELECT * FROM users WHERE phone = $1', [cleanPhone]);
    
    if (user.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'No account found with this phone number',
        code: 'USER_NOT_FOUND'
      });
    }

    const userRecord = user.rows[0];

    // Check if verification code has expired
    if (userRecord.verification_code_expires && new Date() > new Date(userRecord.verification_code_expires)) {
      await logAuditEvent(userRecord.id, 'PHONE_VERIFICATION_EXPIRED', 'users', req, false);
      
      return res.status(410).json({ 
        success: false,
        error: 'Verification code has expired. Please request a new one.',
        code: 'CODE_EXPIRED'
      });
    }

    // Verify code (allow development bypass)
    const isValidCode = process.env.NODE_ENV === 'development' ? 
      (cleanCode === '123456' || cleanCode === userRecord.verification_code) :
      (cleanCode === userRecord.verification_code);

    if (!isValidCode) {
      await logAuditEvent(userRecord.id, 'PHONE_VERIFICATION_FAILED', 'users', req, false, 'Invalid code');
      
      return res.status(401).json({ 
        success: false,
        error: 'Invalid verification code',
        code: 'INVALID_CODE'
      });
    }

    // Success - clear verification code and update user
    await pool.query(`
      UPDATE users SET 
        verification_code = NULL, 
        verification_code_expires = NULL, 
        failed_login_attempts = 0, 
        locked_until = NULL, 
        last_login = NOW(),
        is_phone_verified = TRUE,
        is_verified = TRUE
      WHERE id = $1
    `, [userRecord.id]);

    const token = jwt.sign({ userId: userRecord.id }, JWT_SECRET, { expiresIn: '30d' });

    await logAuditEvent(userRecord.id, 'PHONE_SIGNIN_SUCCESS', 'users', req, true);

    console.log('Phone sign in successful for:', cleanPhone);

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
        profilePicture: userRecord.profile_picture,
        isVerified: true,
        isPhoneVerified: true
      }
    });
  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Verification failed. Please try again.',
      code: 'VERIFICATION_ERROR'
    });
  }
});

// Enhanced user existence check
app.get('/api/auth/check-exists', async (req, res) => {
  try {
    const { email, phone, countryCode } = req.query;
    
    let exists = false;
    let user = null;
    
    if (email) {
      if (!validateEmail(email)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid email format',
          code: 'INVALID_EMAIL'
        });
      }
      
      const result = await pool.query(
        'SELECT id, email, phone, auth_method, is_verified FROM users WHERE email = $1', 
        [email.toLowerCase()]
      );
      
      if (result.rows.length > 0) {
        exists = true;
        user = result.rows[0];
      }
    } else if (phone) {
      if (!validatePhone(phone, countryCode)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid phone number format',
          code: 'INVALID_PHONE'
        });
      }
      
      const cleanPhone = phone.replace(/\s/g, '');
      const result = await pool.query(
        'SELECT id, email, phone, auth_method, is_verified FROM users WHERE phone = $1', 
        [cleanPhone]
      );
      
      if (result.rows.length > 0) {
        exists = true;
        user = result.rows[0];
      }
    } else {
      return res.status(400).json({ 
        success: false,
        error: 'Email or phone number is required',
        code: 'MISSING_IDENTIFIER'
      });
    }
    
    res.json({ 
      success: true,
      exists,
      user: user ? {
        email: user.email,
        phone: user.phone,
        authMethod: user.auth_method,
        isVerified: user.is_verified
      } : null
    });
  } catch (error) {
    console.error('Check user exists error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check user existence',
      code: 'CHECK_EXISTS_ERROR'
    });
  }
});

// Enhanced token validation
app.get('/api/auth/validate', authenticateToken, async (req, res) => {
  try {
    console.log('Token validation for user:', req.user.id);
    
    // Get fresh user data
    const user = await pool.query(`
      SELECT id, email, phone, first_name, last_name, monthly_income, 
             currency, selected_plan, profile_picture, is_verified, 
             is_email_verified, is_phone_verified, last_login
      FROM users WHERE id = $1
    `, [req.user.id]);

    if (user.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        error: 'User no longer exists',
        code: 'USER_NOT_FOUND'
      });
    }

    const userData = user.rows[0];

    res.json({ 
      success: true, 
      user: {
        id: userData.id,
        email: userData.email,
        phone: userData.phone,
        firstName: userData.first_name,
        lastName: userData.last_name,
        name: `${userData.first_name} ${userData.last_name}`,
        monthlyIncome: userData.monthly_income,
        currency: userData.currency,
        selectedPlan: userData.selected_plan,
        profilePicture: userData.profile_picture,
        isVerified: userData.is_verified,
        isEmailVerified: userData.is_email_verified,
        isPhoneVerified: userData.is_phone_verified,
        lastLogin: userData.last_login
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Token validation failed',
      code: 'VALIDATION_ERROR'
    });
  }
});

// ==================== PASSWORD RESET ENDPOINTS ====================

// Password reset request endpoint
app.post('/api/auth/password-reset/request', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid email is required',
        code: 'INVALID_EMAIL'
      });
    }

    console.log('Password reset request for:', email);
    
    // Check if user exists
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    
    // Always return success to prevent email enumeration attacks
    if (user.rows.length === 0) {
      console.log('Password reset requested for non-existent email:', email);
      return res.json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset link.'
      });
    }

    const userRecord = user.rows[0];

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store reset token in database
    await pool.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, userRecord.id]
    );

    // TODO: Send email with reset link
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset link: ${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`);

    await logAuditEvent(userRecord.id, 'PASSWORD_RESET_REQUESTED', 'users', req, true);

    res.json({
      success: true,
      message: 'If an account with this email exists, you will receive a password reset link.',
      // Remove in production:
      debug_token: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process password reset request',
      code: 'RESET_REQUEST_ERROR'
    });
  }
});

// Password reset verification and update endpoint
app.post('/api/auth/password-reset/verify', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    
    if (!email || !token || !newPassword) {
      return res.status(400).json({ 
        success: false,
        error: 'Email, token, and new password are required',
        code: 'MISSING_FIELDS'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid email is required',
        code: 'INVALID_EMAIL'
      });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        success: false,
        error: passwordValidation.error,
        code: 'INVALID_PASSWORD'
      });
    }

    console.log('Password reset verification for:', email);

    // Find user with valid reset token
    const user = await pool.query(`
      SELECT * FROM users 
      WHERE email = $1 
      AND password_reset_token = $2 
      AND password_reset_expires > NOW()
    `, [email.toLowerCase(), token]);

    if (user.rows.length === 0) {
      await logAuditEvent(null, 'PASSWORD_RESET_FAILED', 'users', req, false, 'Invalid or expired token');
      
      return res.status(400).json({ 
        success: false,
        error: 'Invalid or expired password reset token',
        code: 'INVALID_TOKEN'
      });
    }

    const userRecord = user.rows[0];

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, parseInt(process.env.PASSWORD_HASH_ROUNDS) || 12);

    // Update password and clear reset token
    await pool.query(`
      UPDATE users SET 
        password_hash = $1, 
        password_reset_token = NULL, 
        password_reset_expires = NULL,
        failed_login_attempts = 0,
        locked_until = NULL
      WHERE id = $2
    `, [newPasswordHash, userRecord.id]);

    await logAuditEvent(userRecord.id, 'PASSWORD_RESET_SUCCESS', 'users', req, true);

    console.log('Password reset successful for:', email);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.'
    });

  } catch (error) {
    console.error('Password reset verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to reset password',
      code: 'RESET_VERIFICATION_ERROR'
    });
  }
});

// Change password endpoint (for authenticated users)
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        error: 'Current password and new password are required',
        code: 'MISSING_PASSWORDS'
      });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        success: false,
        error: passwordValidation.error,
        code: 'INVALID_NEW_PASSWORD'
      });
    }

    // Get current user data
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const userRecord = user.rows[0];

    // Verify current password
    const validCurrentPassword = await bcrypt.compare(currentPassword, userRecord.password_hash);
    if (!validCurrentPassword) {
      await logAuditEvent(req.user.id, 'PASSWORD_CHANGE_FAILED', 'users', req, false, 'Invalid current password');
      
      return res.status(401).json({ 
        success: false,
        error: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Check if new password is different
    const samePassword = await bcrypt.compare(newPassword, userRecord.password_hash);
    if (samePassword) {
      return res.status(400).json({ 
        success: false,
        error: 'New password must be different from current password',
        code: 'SAME_PASSWORD'
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, parseInt(process.env.PASSWORD_HASH_ROUNDS) || 12);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    await logAuditEvent(req.user.id, 'PASSWORD_CHANGED', 'users', req, true);

    console.log('Password changed successfully for user:', req.user.id);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to change password',
      code: 'CHANGE_PASSWORD_ERROR'
    });
  }
});

// Health check with database connectivity test
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const dbResult = await pool.query('SELECT NOW() as current_time');
    
    console.log('Health check requested - OK');
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbTime: dbResult.rows[0].current_time,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed',
      version: '1.0.0'
    });
  }
});

// Enhanced error handling middleware
const handleError = (error, req, res, next) => {
  console.error('Unhandled error:', {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Database connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return res.status(503).json({
      success: false,
      error: 'Database connection failed',
      code: 'DB_CONNECTION_ERROR'
    });
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: error.message,
      code: 'VALIDATION_ERROR'
    });
  }

  // Generic error response
  res.status(error.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    code: error.code || 'INTERNAL_ERROR'
  });
};

// Apply error handling middleware
app.use(handleError);

// 404 handler
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server with enhanced error handling
const startServer = async () => {
  try {
    console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode...`);
    
    // Test database connection
    await connectToDatabase();
    
    // Setup database tables
    await setupDatabase();
    
    // Display user and subscription statistics
    await displayUserStats();
    
    // Start listening
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Local: http://localhost:${PORT}/api`);
      console.log(`Network: http://0.0.0.0:${PORT}/api`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`CORS origins: ${allowedOrigins.join(', ')}`);
    });
    
    // Graceful shutdown handlers
    const gracefulShutdown = (signal) => {
      console.log(`\nReceived ${signal}, starting graceful shutdown...`);
      
      server.close((err) => {
        if (err) {
          console.error('Error during server shutdown:', err);
          process.exit(1);
        }
        
        console.log('HTTP server closed');
        
        pool.end((poolErr) => {
          if (poolErr) {
            console.error('Error closing database pool:', poolErr);
            process.exit(1);
          }
          
          console.log('Database pool closed');
          console.log('Graceful shutdown completed');
          process.exit(0);
        });
      });
      
      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Export app for testing
module.exports = app;

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}