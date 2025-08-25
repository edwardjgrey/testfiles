// src/components/auth/PhoneEntry.js - FIXED TYPE SAFETY VERSION
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../../styles/globalStyles';
import { translations, countryCodes } from '../../utils/translations';
import LanguageSelector from '../common/LanguageSelector';

const PhoneEntry = ({ 
  authData = {}, 
  language = 'en', 
  setLanguage = () => {}, 
  navigateAuth = () => {}, 
  handlePhoneRegistration = null 
}) => {
  // FIXED: Ensure all props have proper default values and types
  const t = translations[language] || translations.en || {};
  
  // FIXED: Ensure authData properties are properly handled
  const [phone, setPhone] = useState(
    (authData && typeof authData.phone === 'string') ? authData.phone : ''
  );
  const [countryCode, setCountryCode] = useState(
    (authData && typeof authData.countryCode === 'string') ? authData.countryCode : '+996'
  );
  const [showCountries, setShowCountries] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // FIXED: Always ensure we have a valid selectedCountry
  const selectedCountry = countryCodes.find(c => c.code === countryCode) || countryCodes[0];

  // FIXED: Enhanced validation function with type safety
  const validatePhone = (phone, countryCode) => {
    try {
      // Type safety checks
      if (!phone || typeof phone !== 'string') return { valid: false, error: 'Phone number is required' };
      if (!countryCode || typeof countryCode !== 'string') return { valid: false, error: 'Country code is required' };
      
      const cleanPhone = phone.replace(/\s/g, '');
      
      const validationRules = {
        '+996': { length: 9, pattern: /^\d{9}$/, name: 'Kyrgyzstan' },
        '+992': { length: 9, pattern: /^\d{9}$/, name: 'Tajikistan' },
        '+7': { length: 10, pattern: /^\d{10}$/, name: 'Russia/Kazakhstan' },
        '+1': { length: 10, pattern: /^\d{10}$/, name: 'US/Canada' },
        '+44': { length: 11, pattern: /^\d{11}$/, name: 'UK' },
      };
      
      const rule = validationRules[countryCode];
      if (!rule) {
        // Default validation for unknown countries
        return {
          valid: cleanPhone.length >= 7 && cleanPhone.length <= 15 && /^\d+$/.test(cleanPhone),
          error: cleanPhone.length < 7 ? 'Phone number too short' : 
                 cleanPhone.length > 15 ? 'Phone number too long' : 
                 'Invalid phone number format'
        };
      }
      
      return {
        valid: cleanPhone.length === rule.length && rule.pattern.test(cleanPhone),
        error: cleanPhone.length !== rule.length ? 
               `Please enter ${rule.length} digits for ${rule.name}` : 
               'Invalid phone number format'
      };
    } catch (error) {
      console.error('Phone validation error:', error);
      return { valid: false, error: 'Invalid phone number' };
    }
  };
  
  // FIXED: Enhanced formatPhone with comprehensive type safety
  const formatPhone = (text, selectedCountry) => {
    try {
      // Type safety checks
      if (!text || typeof text !== 'string') return '';
      if (!selectedCountry || typeof selectedCountry !== 'object') {
        // Generic formatting for unknown countries
        const digits = text.replace(/\D/g, '');
        const generic = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
        if (!generic) return digits;
        return [generic[1], generic[2], generic[3]].filter(Boolean).join(' ');
      }

      const digits = text.replace(/\D/g, '');
      
      // Format based on country
      switch (selectedCountry.code) {
        case '+996': // Kyrgyzstan - 9 digits: XXX XXX XXX
        case '+992': // Tajikistan - 9 digits
          const kg = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,3})$/);
          if (!kg) return digits;
          return [kg[1], kg[2], kg[3]].filter(Boolean).join(' ');
          
        case '+44': // UK - 11 digits: XXXX XXX XXXX
          const uk = digits.match(/^(\d{0,4})(\d{0,3})(\d{0,4})$/);
          if (!uk) return digits;
          return [uk[1], uk[2], uk[3]].filter(Boolean).join(' ');
          
        case '+1': // USA - 10 digits: (XXX) XXX-XXXX
          const us = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
          if (!us) return digits;
          let formatted = '';
          if (us[1]) formatted += `(${us[1]}`;
          if (us[2]) formatted += `) ${us[2]}`;
          if (us[3]) formatted += `-${us[3]}`;
          return formatted;
          
        case '+7': // Russia/Kazakhstan - 10 digits: XXX XXX-XX-XX
          const ru = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
          if (!ru) return digits;
          return [ru[1], ru[2], ru[3], ru[4]].filter(Boolean).join(' ');
          
        default:
          // Generic format for other countries
          const generic = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
          if (!generic) return digits;
          return [generic[1], generic[2], generic[3]].filter(Boolean).join(' ');
      }
    } catch (error) {
      console.error('Phone formatting error:', error);
      return text || '';
    }
  };

  // FIXED: Enhanced phone input handler with type safety
  const handlePhoneInput = (text) => {
    try {
      // Type safety
      if (typeof text !== 'string') text = String(text || '');
      
      const formatted = formatPhone(text, selectedCountry);
      setPhone(formatted);
      
      // Clear error when user starts typing
      if (phoneError && formatted.length > 0) {
        setPhoneError('');
      }
      
      // Validate on the fly if phone is long enough
      if (formatted.replace(/\s/g, '').length > 5) {
        const validation = validatePhone(formatted, countryCode);
        if (!validation.valid) {
          setPhoneError(validation.error);
        } else {
          setPhoneError('');
        }
      }
    } catch (error) {
      console.error('Phone input handler error:', error);
    }
  };

  // FIXED: Enhanced handleNext with comprehensive error handling
  const handleNext = async () => {
    try {
      setLoading(true);
      
      const cleanPhone = phone.replace(/\s/g, '');
      
      if (!cleanPhone) {
        Alert.alert('Error', 'Please enter your phone number');
        return;
      }

      // Validate phone number
      const validation = validatePhone(phone, countryCode);
      if (!validation.valid) {
        Alert.alert('Invalid Phone Number', validation.error);
        return;
      }
      
      if (handlePhoneRegistration && typeof handlePhoneRegistration === 'function') {
        console.log('📱 Using enhanced phone registration with validation');
        await handlePhoneRegistration(cleanPhone, countryCode);
      } else {
        console.log('📱 Using fallback navigation method');
        if (typeof navigateAuth === 'function') {
          navigateAuth('verify', { phone: cleanPhone, countryCode });
        } else {
          throw new Error('Navigation function not available');
        }
      }
    } catch (error) {
      console.error('❌ Phone registration error:', error);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Safe country selection handler
  const handleCountrySelect = (country) => {
    try {
      if (country && typeof country.code === 'string') {
        setCountryCode(country.code);
        setShowCountries(false);
        
        // Clear phone and error when changing country
        setPhone('');
        setPhoneError('');
      }
    } catch (error) {
      console.error('Country selection error:', error);
    }
  };

  // FIXED: Safe navigation handler
  const handleGoBack = () => {
    try {
      if (typeof navigateAuth === 'function') {
        navigateAuth('welcome');
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <SafeAreaView style={globalStyles.authContainer}>
      <StatusBar barStyle="light-content" backgroundColor={globalStyles.authContainer?.backgroundColor || '#05212a'} />
      
      {/* FIXED: Safe language selector */}
      {setLanguage && typeof setLanguage === 'function' && (
        <LanguageSelector language={language} setLanguage={setLanguage} />
      )}
      
      <ScrollView contentContainerStyle={globalStyles.scrollContent || { flexGrow: 1, padding: 20 }}>
        {/* Consistent back button */}
        <TouchableOpacity
          style={globalStyles.backButton || styles.backButton}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        
        <Text style={[globalStyles.authTitleLeft || styles.title, { color: 'white' }]}>
          {t.enterPhone || 'Enter your phone number'}
        </Text>
        <Text style={[globalStyles.authSubtitleLeft || styles.subtitle, { color: '#6b7280' }]}>
          {t.phoneSubtitle || 'We\'ll send you a verification code'}
        </Text>
        
        <View style={globalStyles.authCard || styles.card}>
          <View style={globalStyles.phoneInputContainer || styles.phoneInputContainer}>
            <TouchableOpacity
              style={globalStyles.phoneCountry || styles.phoneCountry}
              onPress={() => setShowCountries(!showCountries)}
            >
              <Text style={globalStyles.flagText || styles.flagText}>
                {selectedCountry?.flag || '🌍'}
              </Text>
              <Text style={globalStyles.countryCodeText || styles.countryCodeText}>
                {countryCode}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#9ca3af" />
            </TouchableOpacity>
            
            <TextInput
              style={[
                globalStyles.phoneInput || styles.phoneInput,
                phoneError ? { borderColor: '#ef4444', borderWidth: 1 } : {}
              ]}
              placeholder={selectedCountry?.format?.replace(/X/g, '0') || "555 123 456"}
              placeholderTextColor="#9ca3af"
              value={phone}
              onChangeText={handlePhoneInput}
              maxLength={selectedCountry?.length + 3 || 16}
              keyboardType="phone-pad"
            />
          </View>

          {/* Show validation error */}
          {phoneError ? (
            <Text style={styles.errorText}>
              {phoneError}
            </Text>
          ) : null}

          {/* Show country-specific hint */}
          <Text style={styles.hintText}>
            Expected format: {selectedCountry?.format || 'XXX XXX XXXX'} ({selectedCountry?.length || '7-15'} digits)
          </Text>
          
          <Modal
            visible={showCountries}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowCountries(false)}
          >
            <TouchableOpacity
              style={globalStyles.modalOverlay || styles.modalOverlay}
              onPress={() => setShowCountries(false)}
            >
              <View style={globalStyles.countryModal || styles.countryModal}>
                <Text style={globalStyles.modalTitle || styles.modalTitle}>Select Country</Text>
                <ScrollView>
                  {countryCodes.map((country, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        globalStyles.countryOption || styles.countryOption,
                        countryCode === country.code && { backgroundColor: 'rgba(152, 221, 166, 0.1)' }
                      ]}
                      onPress={() => handleCountrySelect(country)}
                    >
                      <Text style={globalStyles.countryOptionText || styles.countryOptionText}>
                        {country.flag} {country.code} {country.country}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
          
          <TouchableOpacity
            style={[
              globalStyles.pill || styles.button,
              globalStyles.pillPrimary || styles.primaryButton,
              (loading || phoneError) && (globalStyles.pillDisabled || styles.buttonDisabled)
            ]}
            onPress={handleNext}
            disabled={loading || phoneError}
          >
            <Text style={globalStyles.pillTextPrimary || styles.buttonText}>
              {loading ? 'Checking...' : t.next || 'Next'}
            </Text>
          </TouchableOpacity>

          {/* Help text */}
          <Text style={styles.helpText}>
            {language === 'ru' ? 
              'Мы отправим код подтверждения на этот номер' :
              language === 'ky' ? 
              'Бул номерге ырастоо кодун жөнөтөбүз' :
              'We\'ll send a verification code to this number'
            }
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// FIXED: Fallback styles in case globalStyles are missing
const styles = {
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 80,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  phoneCountry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginRight: 8,
  },
  flagText: {
    fontSize: 18,
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#ffffff',
    marginRight: 8,
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    marginLeft: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginLeft: 4,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#98DDA6',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#98DDA6',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  helpText: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryModal: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    margin: 20,
    maxHeight: '60%',
    width: '90%',
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    textAlign: 'center',
  },
  countryOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  countryOptionText: {
    fontSize: 16,
    color: '#ffffff',
  },
};

export default PhoneEntry;