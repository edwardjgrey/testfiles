// src/components/auth/PhoneEntry.js - PERFORMANCE OPTIMIZED VERSION
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import ValidationService from '../../services/validationService';

// FIXED: Memoized country item component to prevent re-renders
const CountryOption = React.memo(({ country, isSelected, onSelect }) => (
  <TouchableOpacity
    style={[
      globalStyles.countryOption,
      {
        borderBottomColor: '#374151',
        backgroundColor: isSelected ? 'rgba(152, 221, 166, 0.1)' : 'transparent'
      }
    ]}
    onPress={() => onSelect(country)}
  >
    <Text style={[globalStyles.countryOptionText, { 
      color: isSelected ? '#98DDA6' : '#ffffff' 
    }]}>
      {country.flag} {country.code} {country.country}
    </Text>
  </TouchableOpacity>
));

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
  
  // FIXED: Debounced validation states
  const [phoneError, setPhoneError] = useState('');
  const [isValidPhone, setIsValidPhone] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  // FIXED: Refs for cleanup and debouncing
  const validationTimeoutRef = useRef(null);
  const formatTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  // FIXED: Memoized selected country to prevent recalculation
  const selectedCountry = useMemo(() => {
    const found = countryCodes.find(c => c.code === countryCode);
    if (!found) {
      console.warn('Country not found for code:', countryCode, 'using fallback');
      return countryCodes[0] || { 
        code: '+996', 
        country: 'Kyrgyzstan', 
        flag: '🇰🇬', 
        length: 9 
      };
    }
    return found;
  }, [countryCode]);

  // FIXED: Memoized placeholder to prevent recalculation
  const placeholder = useMemo(() => {
    const formats = {
      '+996': '555 123 456',
      '+992': '555 123 456', 
      '+7': '555 123 45 67',
      '+1': '555 123 4567',
      '+44': '7700 900 123',
    };
    return formats[selectedCountry?.code] || '555 123 456';
  }, [selectedCountry?.code]);

  // FIXED: Debounced validation function
  const validatePhoneNumber = useCallback((cleanPhone) => {
    // Clear existing timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Clear error immediately for empty input
    if (!cleanPhone) {
      setPhoneError('');
      setIsValidPhone(false);
      setIsValidating(false);
      return;
    }

    setIsValidating(true);

    // Debounce validation by 500ms
    validationTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return;

      try {
        const validation = ValidationService.validatePhone(cleanPhone, countryCode, language);
        
        if (validation.valid) {
          setPhoneError('');
          setIsValidPhone(true);
          console.log('Phone validation passed:', validation.formatted);
        } else {
          setIsValidPhone(false);
          setPhoneError(validation.error);
          console.log('Phone validation failed:', validation.error);
        }
      } catch (error) {
        console.error('Validation error:', error);
        setIsValidPhone(false);
        setPhoneError('Validation error');
      } finally {
        if (mountedRef.current) {
          setIsValidating(false);
        }
      }
    }, 500); // 500ms debounce
  }, [countryCode, language]);

  // FIXED: Debounced phone formatting
  const formatPhone = useCallback((text) => {
    // Clear existing timeout
    if (formatTimeoutRef.current) {
      clearTimeout(formatTimeoutRef.current);
    }

    const digits = text.replace(/\D/g, '');
    
    // Immediate formatting for better UX, but debounced for validation
    if (!selectedCountry?.code) {
      return digits;
    }

    // Limit input length based on country
    const maxLength = selectedCountry.length || 15;
    const limitedDigits = digits.substring(0, maxLength);
    
    let formatted;
    switch (selectedCountry.code) {
      case '+996':
      case '+992':
        const kg = limitedDigits.match(/^(\d{0,3})(\d{0,3})(\d{0,3})$/);
        if (!kg) return limitedDigits;
        formatted = [kg[1], kg[2], kg[3]].filter(Boolean).join(' ');
        break;
        
      case '+7':
        const ru = limitedDigits.match(/^(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
        if (!ru) return limitedDigits;
        formatted = [ru[1], ru[2], ru[3], ru[4]].filter(Boolean).join(' ');
        break;
        
      case '+1':
        const us = limitedDigits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
        if (!us) return limitedDigits;
        let result = '';
        if (us[1]) result += us[1];
        if (us[2]) result += ` ${us[2]}`;
        if (us[3]) result += ` ${us[3]}`;
        formatted = result;
        break;
        
      case '+44':
        const uk = limitedDigits.match(/^(\d{0,4})(\d{0,3})(\d{0,4})$/);
        if (!uk) return limitedDigits;
        formatted = [uk[1], uk[2], uk[3]].filter(Boolean).join(' ');
        break;
        
      default:
        const generic = limitedDigits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
        if (!generic) return limitedDigits;
        formatted = [generic[1], generic[2], generic[3]].filter(Boolean).join(' ');
    }

    // Debounce validation call
    formatTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        validatePhoneNumber(limitedDigits);
      }
    }, 100); // Quick debounce for formatting

    return formatted;
  }, [selectedCountry, validatePhoneNumber]);

  // FIXED: Optimized phone change handler
  const handlePhoneChange = useCallback((text) => {
    const formattedPhone = formatPhone(text);
    setPhone(formattedPhone);
  }, [formatPhone]);

  // Re-validate when country changes
  useEffect(() => {
    if (!countryCode || countryCode === 'undefined' || !countryCodes.find(c => c.code === countryCode)) {
      console.log('Fixing invalid country code:', countryCode);
      setCountryCode('+996');
    }
    
    // Re-validate phone when country changes
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      validatePhoneNumber(cleanPhone);
    }
  }, [countryCode, phone, validatePhoneNumber]);

  // FIXED: Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      if (formatTimeoutRef.current) {
        clearTimeout(formatTimeoutRef.current);
      }
    };
  }, []);

  // FIXED: Memoized country selection handler
  const handleCountrySelect = useCallback((country) => {
    console.log('Country selected:', country.code, country.country);
    setCountryCode(country.code);
    
    // Clear phone and validation when country changes
    setPhone('');
    setPhoneError('');
    setIsValidPhone(false);
    setShowCountries(false);
  }, []);

  // FIXED: Optimized submit handler
  const handleNext = useCallback(async () => {
    console.log('Starting phone validation...');
    
    // Get clean phone number
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Final validation before submission
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

    // Ensure country code is never undefined
    const safeCountryCode = countryCode && countryCode !== 'undefined' ? countryCode : '+996';
    
    console.log('Phone validation passed:', {
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
  }, [phone, countryCode, language, handlePhoneRegistration, navigateAuth]);

  // FIXED: Memoized navigation handler
  const handleGoBack = useCallback(() => {
    navigateAuth('welcome');
  }, [navigateAuth]);

  // FIXED: Memoized country modal toggle
  const toggleCountriesModal = useCallback(() => {
    setShowCountries(prev => !prev);
  }, []);

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
          onPress={handleGoBack}
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
              onPress={toggleCountriesModal}
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
              placeholder={placeholder}
              placeholderTextColor="#69696988"
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              autoCorrect={false}
              autoCapitalize="none"
              maxLength={selectedCountry?.length ? selectedCountry.length + 3 : 20} // +3 for spaces
            />
            
            {/* Validation indicator */}
            {phone.length > 0 && (
              <View style={{ paddingRight: 12, paddingLeft: 8 }}>
                {isValidating ? (
                  <Ionicons name="ellipsis-horizontal" size={20} color="#9ca3af" />
                ) : (
                  <Ionicons 
                    name={isValidPhone ? "checkmark-circle" : "close-circle"} 
                    size={20} 
                    color={isValidPhone ? "#98DDA6" : "#ef4444"} 
                  />
                )}
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
                    <CountryOption
                      key={`${country.code}-${index}`}
                      country={country}
                      isSelected={countryCode === country.code}
                      onSelect={handleCountrySelect}
                    />
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

export default React.memo(PhoneEntry);