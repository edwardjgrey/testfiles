// src/services/validationService.js - FIXED UK PHONE VALIDATION
import { Alert } from 'react-native';

class ValidationService {
  
  // Phone number validation - COMPREHENSIVE VERSION WITH FIXED UK SUPPORT
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
    
    // SPECIAL HANDLING FOR UK NUMBERS - Remove country code if included
    if (countryCode === '+44') {
      // Remove +44 if present at start
      sanitizedPhone = sanitizedPhone.replace(/^(\+44|44)/, '');
      // Remove leading 0 if present (UK mobile numbers start with 07)
      if (sanitizedPhone.startsWith('0')) {
        sanitizedPhone = sanitizedPhone.substring(1);
      }
    } else {
      // For other countries, remove country code if included
      sanitizedPhone = sanitizedPhone.replace(/^\+\d{1,4}/, '');
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

    // Check for suspicious patterns
    if (this.hasSuspiciousPhonePattern(cleanPhone)) {
      return { 
        valid: false, 
        error: language === 'ru' ? 'Введите действительный номер телефона' :
               language === 'ky' ? 'Жарактуу телефон номерин киргизиңиз' :
               'Please enter a valid phone number' 
      };
    }

    // Country-specific validation
    const validation = this.validatePhoneByCountry(cleanPhone, countryCode, language);
    if (!validation.valid) {
      return validation;
    }

    return { valid: true, sanitized: cleanPhone, formatted: validation.formatted };
  }

  // FIXED: Country-specific phone validation with UK support
  static validatePhoneByCountry(phone, countryCode, language = 'en') {
    const validations = {
      '+996': { 
        length: 9, 
        format: 'XXX XXX XXX', 
        example: '555 123 456',
        pattern: /^[2-9]\d{8}$/, // First digit 2-9, then 8 more digits
        name: language === 'ru' ? 'Кыргызстан' : language === 'ky' ? 'Кыргызстан' : 'Kyrgyzstan'
      },
      '+7': { 
        length: 10, 
        format: 'XXX XXX XX XX', 
        example: '555 123 45 67',
        pattern: /^[3-9]\d{9}$/, // Russian mobile patterns
        name: language === 'ru' ? 'Россия/Казахстан' : language === 'ky' ? 'Россия/Казахстан' : 'Russia/Kazakhstan'
      }, 
      '+1': { 
        length: 10, 
        format: 'XXX XXX XXXX', 
        example: '555 123 4567',
        pattern: /^[2-9]\d{2}[2-9]\d{6}$/, // US/Canada format
        name: language === 'ru' ? 'США/Канада' : language === 'ky' ? 'АКШ/Канада' : 'USA/Canada'
      }, 
      '+44': { 
        // FIXED: UK accepts both 10 and 11 digits (without leading 0)
        length: [10, 11], // Allow both lengths
        format: 'XXXX XXX XXX', 
        example: '7700 123 456',
        // FIXED: UK mobile pattern - accepts both 10 and 11 digit formats
        pattern: /^7[0-9]\d{8,9}$/, // UK mobile: 7X followed by 8-9 more digits
        name: language === 'ru' ? 'Великобритания' : language === 'ky' ? 'Улуу Британия' : 'United Kingdom',
        multipleFormats: true
      }, 
      '+992': { 
        length: 9, 
        format: 'XX XXX XXXX', 
        example: '55 123 4567',
        pattern: /^[2-9]\d{8}$/, // Tajikistan format
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
      return { valid: true, formatted: phone };
    }

    // FIXED: Check length - handle both single length and multiple lengths (UK case)
    const expectedLengths = Array.isArray(config.length) ? config.length : [config.length];
    if (!expectedLengths.includes(phone.length)) {
      let lengthError;
      
      if (countryCode === '+44') {
        // Special message for UK
        lengthError = language === 'ru' ? 
          `UK номер должен содержать 10 или 11 цифр (без 0 в начале). Примеры: "7700123456" или "07700123456"` :
          language === 'ky' ?
          `UK номери 10 же 11 сандан турушу керек (башында 0 жок). Мисалдар: "7700123456" же "07700123456"` :
          `UK number must be 10 or 11 digits (without leading 0). Examples: "7700123456" or "07700123456"`;
      } else {
        lengthError = language === 'ru' ? 
          `Номер телефона должен содержать ${config.length} цифр для ${config.name}. Пример: ${config.example}` :
          language === 'ky' ?
          `Телефон номери ${config.name} үчүн ${config.length} сандан турушу керек. Мисал: ${config.example}` :
          `Phone number must be ${config.length} digits for ${config.name}. Example: ${config.example}`;
      }
        
      return { valid: false, error: lengthError };
    }

    // Check pattern if defined
    if (config.pattern && !config.pattern.test(phone)) {
      let formatError;
      
      if (countryCode === '+44') {
        formatError = language === 'ru' ?
          `UK номер должен начинаться с 7. Примеры: "7700123456", "7525224482"` :
          language === 'ky' ?
          `UK номери 7 менен башталышы керек. Мисалдар: "7700123456", "7525224482"` :
          `UK number must start with 7. Examples: "7700123456", "7525224482"`;
      } else {
        formatError = language === 'ru' ?
          `Неверный формат номера телефона для ${config.name}. Пример: ${config.example}` :
          language === 'ky' ?
          `${config.name} үчүн телефон номеринин форматы туура эмес. Мисал: ${config.example}` :
          `Invalid phone number format for ${config.name}. Example: ${config.example}`;
      }
        
      return { valid: false, error: formatError };
    }

    // Format the phone number
    const formatted = this.formatPhoneNumber(phone, countryCode);
    
    return { valid: true, formatted };
  }

  // FIXED: Format phone number with improved UK support
  static formatPhoneNumber(phone, countryCode) {
    switch (countryCode) {
      case '+996':
      case '+992':
        return phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
      case '+7':
        return phone.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
      case '+1':
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
      case '+44':
        // FIXED: UK formatting - handle both 10 and 11 digit numbers
        if (phone.length === 10) {
          return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
        } else if (phone.length === 11) {
          return phone.replace(/(\d{5})(\d{3})(\d{3})/, '$1 $2 $3');
        }
        return phone;
      default:
        return phone;
    }
  }

  // Check for suspicious phone patterns
  static hasSuspiciousPhonePattern(phone) {
    // All same digits
    if (/^(\d)\1+$/.test(phone)) return true;
    
    // Sequential numbers (123456789, 987654321)
    if (this.hasSequentialDigits(phone)) return true;
    
    // Common fake numbers
    const fakeNumbers = [
      '1234567890', '0123456789', '9876543210',
      '1111111111', '2222222222', '3333333333',
      '0000000000', '5555555555'
    ];
    
    return fakeNumbers.includes(phone);
  }

  // Email validation
  static validateEmail(email) {
    if (!email) {
      return { valid: false, error: 'Email is required' };
    }

    const sanitizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(sanitizedEmail)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }

    return { valid: true, sanitized: sanitizedEmail };
  }

  // Password validation
  static validatePassword(password, confirmPassword = null) {
    if (!password) {
      return { valid: false, error: 'Password is required' };
    }

    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long' };
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    let strength = 0;
    const requirements = [];

    if (hasLowerCase) strength++;
    else requirements.push('one lowercase letter');

    if (hasUpperCase) strength++;
    else requirements.push('one uppercase letter');

    if (hasNumbers) strength++;
    else requirements.push('one number');

    if (hasSpecialChar) strength++;

    if (strength < 3) {
      return { 
        valid: false, 
        error: `Password must contain at least: ${requirements.join(', ')}`,
        strength: strength 
      };
    }

    // Common weak passwords
    const weakPasswords = [
      'password', '12345678', 'qwerty123', 'password123', 'admin123'
    ];

    if (weakPasswords.includes(password.toLowerCase())) {
      return { valid: false, error: 'This password is too common. Please choose a stronger password.' };
    }

    // Confirm password check
    if (confirmPassword !== null && password !== confirmPassword) {
      return { valid: false, error: 'Passwords do not match' };
    }

    return { valid: true, strength, sanitized: password };
  }

  // Name validation
  static validateName(name, fieldName = 'Name') {
    if (!name) {
      return { valid: false, error: `${fieldName} is required` };
    }

    const sanitizedName = name.trim();
    
    if (sanitizedName.length < 2) {
      return { valid: false, error: `${fieldName} must be at least 2 characters long` };
    }

    if (sanitizedName.length > 50) {
      return { valid: false, error: `${fieldName} must be less than 50 characters` };
    }

    // Only allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
    if (!nameRegex.test(sanitizedName)) {
      return { valid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
    }

    return { valid: true, sanitized: sanitizedName };
  }

  // Check for sequential digits in any string
  static hasSequentialDigits(str) {
    for (let i = 0; i < str.length - 2; i++) {
      const current = parseInt(str[i]);
      const next1 = parseInt(str[i + 1]);
      const next2 = parseInt(str[i + 2]);
      
      if (next1 === current + 1 && next2 === current + 2) return true;
      if (next1 === current - 1 && next2 === current - 2) return true;
    }
    return false;
  }

  // Validate all registration data at once
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
      const passwordValidation = this.validatePassword(authData.password);
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

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }
}

export default ValidationService;