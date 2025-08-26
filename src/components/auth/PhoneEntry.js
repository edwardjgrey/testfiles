// src/components/auth/PhoneEntry.js - FIXED with proper validation
import React, { useState, useEffect } from 'react';
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
import ValidationService from '../../services/validationService'; // ADD THIS

const PhoneEntry = ({ authData, language, setLanguage, navigateAuth, handlePhoneRegistration }) => {
  const t = translations[language];
  const [phone, setPhone] = useState(authData?.phone || '');
  const [countryCode, setCountryCode] = useState(() => {
    const initial = authData?.countryCode || '+996';
    const exists = countryCodes.find(c => c.code === initial);
    return exists ? initial : '+996';
  });
  const [showCountries, setShowCountries] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // ADD VALIDATION STATES
  const [phoneError, setPhoneError] = useState('');
  const [isValidPhone, setIsValidPhone] = useState(false);
  const [validationTimer, setValidationTimer] = useState(null);
  
  // Safe country selection with guaranteed fallback
  const selectedCountry = React.useMemo(() => {
    const found = countryCodes.find(c => c.code === countryCode);
    if (!found) {
      console.warn('⚠️ Country not found for code:', countryCode, 'using fallback');
      return countryCodes[0] || { 
        code: '+996', 
        country: 'Kyrgyzstan', 
        flag: '🇰🇬', 
        length: 9 
      };
    }
    return found;
  }, [countryCode]);

  // Validate and format phone number when it changes
  const handlePhoneChange = (text) => {
    // First, format the phone number for display
    const formattedPhone = formatPhone(text);
    setPhone(formattedPhone);
    
    // Then validate the cleaned phone number
    const cleanedPhone = text.replace(/\D/g, '');
    validatePhoneNumber(cleanedPhone);
  };

  // Real-time phone validation with delayed error display
  const validatePhoneNumber = (cleanPhone) => {
    // Clear any existing timer
    if (validationTimer) {
      clearTimeout(validationTimer);
    }

    if (!cleanPhone) {
      setPhoneError('');
      setIsValidPhone(false);
      return;
    }

    // Use ValidationService for comprehensive validation
    const validation = ValidationService.validatePhone(cleanPhone, countryCode, language);
    
    if (validation.valid) {
      setPhoneError('');
      setIsValidPhone(true);
      console.log('✅ Phone validation passed:', validation.formatted);
    } else {
      setIsValidPhone(false);
      
      // Check if it's a repeated number pattern - show error after 2-5 seconds
      if (/^(\d)\1+$/.test(cleanPhone) && cleanPhone.length >= 6) {
        const timer = setTimeout(() => {
          setPhoneError(validation.error);
          console.log('❌ Repeated pattern detected after delay:', validation.error);
        }, Math.random() * (5000 - 2000) + 2000); // Random between 2-5 seconds
        setValidationTimer(timer);
      } else {
        // For other errors, wait 2 seconds before showing
        const timer = setTimeout(() => {
          setPhoneError(validation.error);
          console.log('❌ Phone validation failed after delay:', validation.error);
        }, 2000);
        setValidationTimer(timer);
      }
    }
  };

  // Validate country code on mount and changes
  useEffect(() => {
    if (!countryCode || countryCode === 'undefined' || !countryCodes.find(c => c.code === countryCode)) {
      console.log('🔧 Fixing invalid country code:', countryCode);
      setCountryCode('+996');
    }
    
    // Re-validate phone when country changes
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      validatePhoneNumber(cleanPhone);
    }
  }, [countryCode]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (validationTimer) {
        clearTimeout(validationTimer);
      }
    };
  }, [validationTimer]);

  // Enhanced format phone with validation
  const formatPhone = (text) => {
    const digits = text.replace(/\D/g, '');
    
    // Ensure we have a valid country
    if (!selectedCountry?.code) {
      return digits;
    }

    // Limit input length based on country
    const maxLength = selectedCountry.length || 15;
    const limitedDigits = digits.substring(0, maxLength);
    
    switch (selectedCountry.code) {
      case '+996':
      case '+992':
        const kg = limitedDigits.match(/^(\d{0,3})(\d{0,3})(\d{0,3})$/);
        if (!kg) return limitedDigits;
        return [kg[1], kg[2], kg[3]].filter(Boolean).join(' ');
        
      case '+7':
        const ru = limitedDigits.match(/^(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
        if (!ru) return limitedDigits;
        return [ru[1], ru[2], ru[3], ru[4]].filter(Boolean).join(' ');
        
      case '+1':
        const us = limitedDigits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
        if (!us) return limitedDigits;
        let formatted = '';
        if (us[1]) formatted += us[1];
        if (us[2]) formatted += ` ${us[2]}`;
        if (us[3]) formatted += ` ${us[3]}`;
        return formatted;
        
      case '+44':
        const uk = limitedDigits.match(/^(\d{0,4})(\d{0,3})(\d{0,4})$/);
        if (!uk) return limitedDigits;
        return [uk[1], uk[2], uk[3]].filter(Boolean).join(' ');
        
      default:
        const generic = limitedDigits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
        if (!generic) return limitedDigits;
        return [generic[1], generic[2], generic[3]].filter(Boolean).join(' ');
    }
  };

  const getPlaceholder = () => {
    const formats = {
      '+996': '555 123 456',
      '+992': '555 123 456', 
      '+7': '555 123 45 67',
      '+1': '555 123 4567',
      '+44': '7700 900 123',
    };
    return formats[selectedCountry?.code] || '555 123 456';
  };

  // Enhanced handleNext with comprehensive validation
  const handleNext = async () => {
    console.log('📱 Starting phone validation...');
    
    // Get clean phone number
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Comprehensive validation
    const phoneValidation = ValidationService.validatePhone(cleanPhone, countryCode, language);
    
    if (!phoneValidation.valid) {
      Alert.alert(
        language === 'ru' ? 'Неверный номер телефона' : 
        language === 'ky' ? 'Туура эмес телефон номери' : 
        'Invalid Phone Number',
        phoneValidation.error
      );
      return;
    }
    
    // Additional business logic validation
    if (cleanPhone.length < 7) {
      Alert.alert(
        language === 'ru' ? 'Неверный номер телефона' : 
        language === 'ky' ? 'Туура эмес телефон номери' : 
        'Invalid Phone Number', 
        language === 'ru' ? 'Номер телефона слишком короткий. Введите полный номер телефона.' :
        language === 'ky' ? 'Телефон номери өтө кыска. Толук телефон номерин киргизиңиз.' :
        'Phone number is too short. Please enter a complete phone number.'
      );
      return;
    }

    // Check for suspicious patterns (all same digits, etc.)
    if (/^(\d)\1+$/.test(cleanPhone)) {
      Alert.alert(
        language === 'ru' ? 'Неверный номер телефона' : 
        language === 'ky' ? 'Туура эмес телефон номери' : 
        'Invalid Phone Number', 
        language === 'ru' ? 'Введите действительный номер телефона. Все цифры не могут быть одинаковыми.' :
        language === 'ky' ? 'Жарактуу телефон номерин киргизиңиз. Бардык сандар бирдей боло албайт.' :
        'Please enter a valid phone number. All digits cannot be the same.'
      );
      return;
    }

    // Ensure country code is never undefined
    const safeCountryCode = countryCode && countryCode !== 'undefined' ? countryCode : '+996';
    
    console.log('✅ Phone validation passed:', {
      original: phone,
      clean: cleanPhone,
      formatted: phoneValidation.formatted,
      countryCode: safeCountryCode
    });
    
    setLoading(true);
    
    try {
      if (handlePhoneRegistration) {
        await handlePhoneRegistration(cleanPhone, safeCountryCode);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
        navigateAuth('verify', { 
          phone: cleanPhone, 
          countryCode: safeCountryCode,
          formattedPhone: phoneValidation.formatted 
        });
      }
    } catch (error) {
      Alert.alert(
        language === 'ru' ? 'Ошибка' :
        language === 'ky' ? 'Ката' :
        'Error', 
        error.message || (
          language === 'ru' ? 'Что-то пошло не так. Попробуйте еще раз.' :
          language === 'ky' ? 'Бир нерсе туура эмес болду. Кайра аракет кылыңыз.' :
          'Something went wrong. Please try again.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Safe country selection handler
  const handleCountrySelect = (country) => {
    console.log('🏳️ Country selected:', country.code, country.country);
    setCountryCode(country.code);
    
    // Clear phone and validation when country changes
    setPhone('');
    setPhoneError('');
    setIsValidPhone(false);
    setShowCountries(false);
  };

  return (
    <SafeAreaView style={[globalStyles.authContainer, { 
      backgroundColor: '#05212A',            
      paddingTop: 10
    }]}>
      <StatusBar barStyle="light-content" backgroundColor="#05212A" />
      <LanguageSelector language={language} setLanguage={setLanguage} />
      
      <ScrollView contentContainerStyle={[globalStyles.scrollContent, { paddingTop: 60 }]}>
        <TouchableOpacity
          style={[globalStyles.backButton, {
            position: 'absolute',
            top: 30,
            left: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            padding: 12
          }]}
          onPress={() => navigateAuth('welcome')}
        >
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        
        <Text style={[globalStyles.authTitleLeft, { color: '#ffffff', marginTop: 40 }]}>
          {t.enterPhone}
        </Text>
        <Text style={[globalStyles.authSubtitleLeft, { color: '#9ca3af' }]}>
          {t.phoneSubtitle}
        </Text>
        
        <View style={[globalStyles.authCard, {
          backgroundColor: '#1f2937',
          borderWidth: 1,
          borderColor: '#374151',
        }]}>
          {/* Phone Input Container with validation styling */}
          <View style={[globalStyles.phoneInputContainer, {
            backgroundColor: '#374151',
            borderColor: phoneError ? '#ef4444' : (isValidPhone ? '#98DDA6' : '#4b5563'),
            borderWidth: phoneError ? 2 : 1,
          }]}>
            <TouchableOpacity
              style={[globalStyles.phoneCountry, {
                borderRightColor: '#4b5563',
              }]}
              onPress={() => setShowCountries(!showCountries)}
            >
              <Text style={[globalStyles.flagText, { fontSize: 18 }]}>
                {selectedCountry?.flag || '🇰🇬'}
              </Text>
              <Text style={[globalStyles.countryCodeText, { color: '#ffffff' }]}>
                {selectedCountry?.code || '+996'}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#9ca3af" />
            </TouchableOpacity>
            
            <TextInput
              style={[globalStyles.phoneInput, {
                color: '#ffffff',
                fontSize: 17,
              }]}
              placeholder={getPlaceholder()}
              placeholderTextColor="#69696988"
              value={phone}
              onChangeText={handlePhoneChange} // Use enhanced handler
              keyboardType="phone-pad"
              autoCorrect={false}
              autoCapitalize="none"
            />
            
            {/* Validation indicator */}
            {phone.length > 0 && (
              <View style={{ paddingRight: 12, paddingLeft: 8 }}>
                <Ionicons 
                  name={isValidPhone ? "checkmark-circle" : "close-circle"} 
                  size={20} 
                  color={isValidPhone ? "#98DDA6" : "#ef4444"} 
                />
              </View>
            )}
          </View>
          
          {/* Error Message Display */}
          {phoneError ? (
            <View style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 8,
              padding: 12,
              marginTop: 8,
              borderLeftWidth: 4,
              borderLeftColor: '#ef4444',
            }}>
              <Text style={{ color: '#ef4444', fontSize: 14 }}>
                {phoneError}
              </Text>
            </View>
          ) : null}
          
          {/* Country Selection Modal */}
          <Modal
            visible={showCountries}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowCountries(false)}
          >
            <TouchableOpacity
              style={globalStyles.modalOverlay}
              onPress={() => setShowCountries(false)}
            >
              <View style={[globalStyles.countryModal, {
                backgroundColor: '#1f2937',
                borderColor: '#374151',
              }]}>
                <Text style={[globalStyles.modalTitle, { color: '#ffffff' }]}>
                  {language === 'ru' ? 'Выберите страну' : 
                   language === 'ky' ? 'Өлкөнү тандаңыз' : 
                   'Select Country'}
                </Text>
                <ScrollView>
                  {countryCodes.map((country, index) => (
                    <TouchableOpacity
                      key={`${country.code}-${index}`}
                      style={[globalStyles.countryOption, {
                        borderBottomColor: '#374151',
                        backgroundColor: countryCode === country.code ? 'rgba(152, 221, 166, 0.1)' : 'transparent'
                      }]}
                      onPress={() => handleCountrySelect(country)}
                    >
                      <Text style={[globalStyles.countryOptionText, { 
                        color: countryCode === country.code ? '#98DDA6' : '#ffffff' 
                      }]}>
                        {country.flag} {country.code} {country.country}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
          
          {/* Continue Button - Only enabled when valid */}
          <TouchableOpacity
            style={[
              globalStyles.pill,
              isValidPhone ? globalStyles.pillPrimary : globalStyles.pillDisabled,
              loading && globalStyles.pillDisabled
            ]}
            onPress={handleNext}
            disabled={loading || !isValidPhone}
          >
            <Text style={[
              globalStyles.pillTextPrimary,
              !isValidPhone && { color: '#9ca3af' }
            ]}>
              {loading ? 
                (language === 'ru' ? 'Отправка...' :
                 language === 'ky' ? 'Жөнөтүлүүдө...' :
                 'Sending...') : 
                t.next}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PhoneEntry;