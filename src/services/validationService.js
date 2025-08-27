// src/services/validationService.js - FIXED VERSION
import { Alert } from 'react-native';

class ValidationService {
  
  // Phone number validation - FIXED UK VALIDATION AND EDGE CASES
  static validatePhone(phone, countryCode = '+996', language = 'en') {
    if (!phone) {
      return { 
        valid: false, 
        error: language === 'ru' ? 'Номер телефона обязателен' :
               language === 'ky' ? 'Телефон номери милдеттүү' :
               'Phone number is required' 
      };
    }

    // Sanitize phone (remove spaces, dashes, parentheses)
    let sanitizedPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    
    // FIXED: Proper UK number handling
    if (countryCode === '+44') {
      // Remove +44 or 44 if present at start
      sanitizedPhone = sanitizedPhone.replace(/^(\+44|44)/, '');
      // For UK, if starts with 0, remove it (standard format)
      if (sanitizedPhone.startsWith('0')) {
        sanitizedPhone = sanitizedPhone.substring(1);
      }
    } else {
      // For other countries, remove country code if included
      const countryCodeDigits = countryCode.replace('+', '');
      const regex = new RegExp(`^(\\+?${countryCodeDigits})`);
      sanitizedPhone = sanitizedPhone.replace(regex, '');
    }
    
    const cleanPhone = sanitizedPhone;
    
    // Only allow digits
    if (!/^\d+$/.test(cleanPhone)) {
      return { 
        valid: false, 
        error: language === 'ru' ? 'Номер телефона должен содержать только цифры' :
               language === 'ky' ? 'Телефон номери сандардан гана турушу керек' :
               'Phone number must contain only digits' 
      };
    }

    // Check for suspicious patterns BEFORE country validation
    const suspiciousCheck = this.checkSuspiciousPhonePattern(cleanPhone);
    if (!suspiciousCheck.valid) {
      return { 
        valid: false, 
        error: suspiciousCheck.error 
      };
    }

    // Country-specific validation
    const validation = this.validatePhoneByCountry(cleanPhone, countryCode, language);
    if (!validation.valid) {
      return validation;
    }

    return { 
      valid: true, 
      sanitized: cleanPhone, 
      formatted: validation.formatted,
      fullNumber: countryCode + cleanPhone
    };
  }

  // FIXED: Improved country-specific phone validation
  static validatePhoneByCountry(phone, countryCode, language = 'en') {
    const validations = {
      '+996': { 
        lengths: [9], 
        format: 'XXX XXX XXX', 
        example: '555 123 456',
        patterns: [
          /^[2-9]\d{8}$/, // Standard format
          /^0[1-9]\d{7}$/ // Alternative format with leading 0
        ],
        name: language === 'ru' ? 'Кыргызстан' : language === 'ky' ? 'Кыргызстан' : 'Kyrgyzstan'
      },
      '+7': { 
        lengths: [10], 
        format: 'XXX XXX XX XX', 
        example: '555 123 45 67',
        patterns: [
          /^[39]\d{9}$/, // Mobile: 3xx, 9xx
          /^[4-8]\d{9}$/ // Additional regional codes
        ],
        name: language === 'ru' ? 'Россия/Казахстан' : language === 'ky' ? 'Россия/Казахстан' : 'Russia/Kazakhstan'
      }, 
      '+1': { 
        lengths: [10], 
        format: '(XXX) XXX-XXXX', 
        example: '(555) 123-4567',
        patterns: [
          /^[2-9]\d{2}[2-9]\d{6}$/ // US/Canada format
        ],
        name: language === 'ru' ? 'США/Канада' : language === 'ky' ? 'АКШ/Канада' : 'USA/Canada'
      }, 
      '+44': { 
        lengths: [10, 11], // FIXED: Allow both lengths
        format: 'XXXX XXX XXX', 
        example: '7700 123 456',
        patterns: [
          // FIXED: Comprehensive UK mobile patterns
          /^7[0-9]\d{8}$/, // Most UK mobiles: 7xxx xxx xxx (10 digits)
          /^7[0-9]\d{9}$/, // Some UK mobiles: 7xxxx xxx xxx (11 digits)
          /^[1-9]\d{8}$/, // UK landlines: 1xxx xxx xxx (10 digits)
          /^[1-9]\d{9}$/, // UK landlines: 1xxxx xxx xxx (11 digits)
          /^2\d{9}$/, // London: 20xx xxx xxxx (10 digits)
          /^800\d{7}$/, // Freephone: 800 xxx xxxx (10 digits)
          /^845\d{7}$/ // Local rate: 845 xxx xxxx (10 digits)
        ],
        name: language === 'ru' ? 'Великобритания' : language === 'ky' ? 'Улуу Британия' : 'United Kingdom'
      }, 
      '+992': { 
        lengths: [9], 
        format: 'XX XXX XXXX', 
        example: '55 123 4567',
        patterns: [
          /^[2-9]\d{8}$/ // Tajikistan format
        ],
        name: language === 'ru' ? 'Таджикистан' : language === 'ky' ? 'Тажикстан' : 'Tajikistan'
      }
    };

    const config = validations[countryCode];
    if (!config) {
      // Generic validation for other countries
      if (phone.length < 7 || phone.length > 15) {
        return { 
          valid: false, 
          error: language === 'ru' ? 'Номер телефона должен содержать 7-15 цифр' :
                 language === 'ky' ? 'Телефон номери 7-15 сандан турушу керек' :
                 'Phone number must be 7-15 digits long' 
        };
      }
      return { valid: true, formatted: this.formatPhoneNumber(phone, countryCode) };
    }

    // FIXED: Check length against all allowed lengths
    if (!config.lengths.includes(phone.length)) {
      const lengthsList = config.lengths.join(' or ');
      const lengthError = language === 'ru' ? 
        `Номер телефона должен содержать ${lengthsList} цифр для ${config.name}. Пример: ${config.example}` :
        language === 'ky' ?
        `Телефон номери ${config.name} үчүн ${lengthsList} сандан турушу керек. Мисал: ${config.example}` :
        `Phone number must be ${lengthsList} digits for ${config.name}. Example: ${config.example}`;
        
      return { valid: false, error: lengthError };
    }

    // FIXED: Check against ALL patterns, not just one
    const matchesPattern = config.patterns.some(pattern => pattern.test(phone));
    if (!matchesPattern) {
      const formatError = language === 'ru' ?
        `Неверный формат номера телефона для ${config.name}. Пример: ${config.example}` :
        language === 'ky' ?
        `${config.name} үчүн телефон номеринин форматы туура эмес. Мисал: ${config.example}` :
        `Invalid phone number format for ${config.name}. Example: ${config.example}`;
        
      return { valid: false, error: formatError };
    }

    // Format the phone number
    const formatted = this.formatPhoneNumber(phone, countryCode);
    
    return { valid: true, formatted };
  }

  // FIXED: Improved phone number formatting
  static formatPhoneNumber(phone, countryCode) {
    const formatters = {
      '+996': (num) => num.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3'),
      '+992': (num) => num.replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3'),
      '+7': (num) => num.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4'),
      '+1': (num) => num.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3'),
      '+44': (num) => {
        // FIXED: Better UK formatting based on length and type
        if (num.length === 10) {
          if (num.startsWith('20')) {
            // London number: 20XX XXX XXXX
            return num.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
          } else if (num.startsWith('7')) {
            // Mobile: 7XXX XXX XXX
            return num.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
          } else {
            // Other: XXXX XXX XXX
            return num.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
          }
        } else if (num.length === 11) {
          if (num.startsWith('7')) {
            // Long mobile: 7XXXX XXX XXX
            return num.replace(/(\d{5})(\d{3})(\d{3})/, '$1 $2 $3');
          } else {
            // Long landline: XXXXX XXX XXX
            return num.replace(/(\d{5})(\d{3})(\d{3})/, '$1 $2 $3');
          }
        }
        return num;
      }
    };

    const formatter = formatters[countryCode];
    return formatter ? formatter(phone) : phone;
  }

  // FIXED: More comprehensive suspicious pattern detection
  static checkSuspiciousPhonePattern(phone) {
    // All same digits
    if (/^(\d)\1+$/.test(phone)) {
      return { valid: false, error: 'Phone number cannot be all the same digit' };
    }
    
    // Sequential ascending numbers (123456789)
    if (this.hasSequentialDigits(phone, 'ascending')) {
      return { valid: false, error: 'Phone number cannot be sequential digits' };
    }
    
    // Sequential descending numbers (987654321)
    if (this.hasSequentialDigits(phone, 'descending')) {
      return { valid: false, error: 'Phone number cannot be sequential digits' };
    }
    
    // Common test numbers
    const testNumbers = [
      '1234567890', '0123456789', '9876543210',
      '1111111111', '2222222222', '3333333333',
      '0000000000', '5555555555', '1234567', '7777777',
      '1234', '0000', '9999', '1111' // Short test patterns
    ];
    
    if (testNumbers.includes(phone)) {
      return { valid: false, error: 'Please enter a valid phone number' };
    }

    // Too many repeated digits (more than 3 consecutive)
    if (/(\d)\1{3,}/.test(phone)) {
      return { valid: false, error: 'Phone number has too many repeated digits' };
    }

    return { valid: true };
  }

  // FIXED: More accurate sequential digit detection
  static hasSequentialDigits(str, direction = 'ascending') {
    if (str.length < 4) return false; // Need at least 4 digits to be suspicious
    
    let consecutiveCount = 0;
    const threshold = 4; // 4 consecutive sequential digits is suspicious
    
    for (let i = 0; i < str.length - 1; i++) {
      const current = parseInt(str[i]);
      const next = parseInt(str[i + 1]);
      
      const isSequential = direction === 'ascending' 
        ? (next === current + 1) 
        : (next === current - 1);
      
      if (isSequential) {
        consecutiveCount++;
        if (consecutiveCount >= threshold - 1) { // -1 because we're counting gaps
          return true;
        }
      } else {
        consecutiveCount = 0; // Reset counter
      }
    }
    
    return false;
  }

  // Enhanced email validation
  static validateEmail(email) {
    if (!email) {
      return { valid: false, error: 'Email is required' };
    }

    const sanitizedEmail = email.toLowerCase().trim();
    
    // Check for obvious issues first
    if (sanitizedEmail.length > 254) {
      return { valid: false, error: 'Email address is too long' };
    }
    
    if (sanitizedEmail.includes('..')) {
      return { valid: false, error: 'Email cannot contain consecutive dots' };
    }
    
    // More comprehensive email regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(sanitizedEmail)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }

    // Check for common typos in domains
    const commonTypos = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'hotmial.com': 'hotmail.com',
      'outlok.com': 'outlook.com'
    };

    const domain = sanitizedEmail.split('@')[1];
    if (commonTypos[domain]) {
      return { 
        valid: false, 
        error: `Did you mean ${sanitizedEmail.replace(domain, commonTypos[domain])}?`,
        suggestion: sanitizedEmail.replace(domain, commonTypos[domain])
      };
    }

    return { valid: true, sanitized: sanitizedEmail };
  }

  // Enhanced password validation with better strength calculation
  static validatePassword(password, confirmPassword = null) {
    if (!password) {
      return { valid: false, error: 'Password is required' };
    }

    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long' };
    }

    if (password.length > 128) {
      return { valid: false, error: 'Password is too long (max 128 characters)' };
    }

    const checks = {
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasNoSpaces: !/\s/.test(password)
    };

    if (!checks.hasNoSpaces) {
      return { valid: false, error: 'Password cannot contain spaces' };
    }

    let strength = 0;
    const missing = [];

    if (checks.hasLowerCase) strength++; else missing.push('lowercase letter');
    if (checks.hasUpperCase) strength++; else missing.push('uppercase letter');  
    if (checks.hasNumbers) strength++; else missing.push('number');
    if (checks.hasSpecialChar) strength++;

    // Require at least 3 of the 4 criteria
    if (strength < 3) {
      return { 
        valid: false, 
        error: `Password must contain at least: ${missing.slice(0, -strength + 3).join(', ')}`,
        strength: strength 
      };
    }

    // Check for common weak patterns
    const weakPatterns = [
      /(.)\1{2,}/, // 3 or more repeated characters
      /123456|654321|qwerty|password/i, // Common sequences
      /^[a-z]+\d+$/i, // Just letters followed by numbers
      /^\d+[a-z]+$/i // Just numbers followed by letters
    ];

    for (const pattern of weakPatterns) {
      if (pattern.test(password)) {
        return { valid: false, error: 'Password is too predictable. Please choose a stronger password.' };
      }
    }

    // Enhanced common password check
    const commonPasswords = [
      'password', 'password123', '123456789', 'qwerty123', 'admin123',
      'welcome123', 'password1', 'qwerty12', 'letmein123', 'monkey123',
      'dragon123', 'master123', 'shadow123', 'sunshine123'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      return { valid: false, error: 'This password is too common. Please choose a unique password.' };
    }

    // Confirm password check
    if (confirmPassword !== null && password !== confirmPassword) {
      return { valid: false, error: 'Passwords do not match' };
    }

    // Calculate actual strength score (1-5)
    let actualStrength = strength;
    if (password.length >= 12) actualStrength += 0.5;
    if (password.length >= 16) actualStrength += 0.5;
    
    return { 
      valid: true, 
      strength: Math.min(5, Math.round(actualStrength)),
      sanitized: password 
    };
  }

  // Enhanced name validation with international support
  static validateName(name, fieldName = 'Name') {
    if (!name) {
      return { valid: false, error: `${fieldName} is required` };
    }

    const sanitizedName = name.trim();
    
    if (sanitizedName.length < 1) {
      return { valid: false, error: `${fieldName} cannot be empty` };
    }
    
    if (sanitizedName.length > 50) {
      return { valid: false, error: `${fieldName} must be less than 50 characters` };
    }

    // Allow international characters, letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[\p{L}\p{M}\s\-'\.]+$/u;
    if (!nameRegex.test(sanitizedName)) {
      return { 
        valid: false, 
        error: `${fieldName} can only contain letters, spaces, hyphens, apostrophes, and periods` 
      };
    }

    // Check for suspicious patterns
    if (/^\s+$/.test(name)) {
      return { valid: false, error: `${fieldName} cannot be only spaces` };
    }

    if (/^[-'\.]+$/.test(sanitizedName)) {
      return { valid: false, error: `${fieldName} must contain at least one letter` };
    }

    // Check for repeated special characters
    if (/[-'\.]{3,}/.test(sanitizedName)) {
      return { valid: false, error: `${fieldName} has too many consecutive special characters` };
    }

    return { valid: true, sanitized: sanitizedName };
  }

  // Comprehensive registration data validation
  static validateRegistrationData(authData) {
    const errors = {};

    if (authData.email) {
      const emailValidation = this.validateEmail(authData.email);
      if (!emailValidation.valid) {
        errors.email = emailValidation.error;
      }
    }

    if (authData.phone) {
      const phoneValidation = this.validatePhone(authData.phone, authData.countryCode);
      if (!phoneValidation.valid) {
        errors.phone = phoneValidation.error;
      }
    }

    if (authData.password) {
      const passwordValidation = this.validatePassword(authData.password, authData.confirmPassword);
      if (!passwordValidation.valid) {
        errors.password = passwordValidation.error;
      }
    }

    if (authData.firstName) {
      const firstNameValidation = this.validateName(authData.firstName, 'First name');
      if (!firstNameValidation.valid) {
        errors.firstName = firstNameValidation.error;
      }
    }

    if (authData.lastName) {
      const lastNameValidation = this.validateName(authData.lastName, 'Last name');
      if (!lastNameValidation.valid) {
        errors.lastName = lastNameValidation.error;
      }
    }

    // Cross-field validation
    if (authData.email && authData.phone) {
      // Both provided - ensure consistency
      const emailDomain = authData.email.split('@')[1];
      const phoneCountry = authData.countryCode;
      
      // Basic sanity check - warn if email/phone countries don't align
      const countryMismatches = {
        '+7': ['ru', 'kz', 'russia', 'kazakhstan'],
        '+996': ['kg', 'kyrgyzstan'],
        '+44': ['uk', 'britain', 'england'],
        '+1': ['us', 'usa', 'canada', 'com']
      };
      
      const phoneCountries = countryMismatches[phoneCountry] || [];
      const emailLooksLocal = phoneCountries.some(country => 
        emailDomain.includes(country)
      );
      
      // This is just a warning, not an error
      if (phoneCountry && !emailLooksLocal && phoneCountry !== '+1') {
        console.warn('Email domain and phone country might not match');
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      warnings: [] // Could add non-blocking warnings here
    };
  }

  // NEW: Validation for financial data
  static validateFinancialAmount(amount, currency = 'KGS', fieldName = 'Amount') {
    if (amount === null || amount === undefined || amount === '') {
      return { valid: false, error: `${fieldName} is required` };
    }

    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount)) {
      return { valid: false, error: `${fieldName} must be a valid number` };
    }

    if (numAmount < 0) {
      return { valid: false, error: `${fieldName} cannot be negative` };
    }

    // Currency-specific max amounts (reasonable limits)
    const maxAmounts = {
      'KGS': 10000000, // 10M som
      'USD': 100000,   // 100K USD
      'EUR': 100000,   // 100K EUR
      'RUB': 10000000  // 10M rubles
    };

    const maxAmount = maxAmounts[currency] || 1000000;
    
    if (numAmount > maxAmount) {
      return { 
        valid: false, 
        error: `${fieldName} cannot exceed ${maxAmount.toLocaleString()} ${currency}` 
      };
    }

    // Check for suspicious amounts (all same digits, obvious fake amounts)
    const amountStr = numAmount.toString();
    if (/^(\d)\1+$/.test(amountStr.replace('.', ''))) {
      return { valid: false, error: 'Please enter a realistic amount' };
    }

    return { 
      valid: true, 
      sanitized: numAmount,
      formatted: numAmount.toLocaleString()
    };
  }
}

export default ValidationService;