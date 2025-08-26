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

const PhoneEntry = ({ authData, language, setLanguage, navigateAuth, handlePhoneRegistration }) => {
  const t = translations[language];
  const [phone, setPhone] = useState(authData.phone || '');
  const [countryCode, setCountryCode] = useState(authData.countryCode || '+996');
  const [showCountries, setShowCountries] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Get selected country info
  const selectedCountry = countryCodes.find(c => c.code === countryCode) || countryCodes[0];
  
  // Format phone based on country
  const formatPhone = (text) => {
    const digits = text.replace(/\D/g, '');
    
    switch (countryCode) {
      case '+996': // Kyrgyzstan - XXX XXX XXX (9 digits)
      case '+992': // Tajikistan - XXX XXX XXX (9 digits)
        const kg = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,3})$/);
        if (!kg) return digits;
        return [kg[1], kg[2], kg[3]].filter(Boolean).join(' ');
        
      case '+7': // Russia/Kazakhstan - XXX XXX XX XX (10 digits)
        const ru = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
        if (!ru) return digits;
        return [ru[1], ru[2], ru[3], ru[4]].filter(Boolean).join(' ');
        
      case '+1': // USA/Canada - (XXX) XXX-XXXX (10 digits)
        const us = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
        if (!us) return digits;
        let formatted = '';
        if (us[1]) formatted += us[1];
        if (us[2]) formatted += ` ${us[2]}`;
        if (us[3]) formatted += ` ${us[3]}`;
        return formatted;
        
      case '+44': // UK - XXXX XXX XXXX (11 digits)
        const uk = digits.match(/^(\d{0,4})(\d{0,3})(\d{0,4})$/);
        if (!uk) return digits;
        return [uk[1], uk[2], uk[3]].filter(Boolean).join(' ');
        
      default:
        // Generic format for other countries
        const generic = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
        if (!generic) return digits;
        return [generic[1], generic[2], generic[3]].filter(Boolean).join(' ');
    }
  };
  
  // Get placeholder based on country
  const getPlaceholder = () => {
    const formats = {
      '+996': '555 123 456',
      '+992': '555 123 456', 
      '+7': '555 123 45 67',
      '+1': '555 123 4567',
      '+44': '7700900123',
    };
    return formats[countryCode] || '555 123 456';
  };

  const handleNext = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    const minLength = selectedCountry.length || 9;
    
    if (cleanPhone.length < minLength) {
      Alert.alert('Error', `Enter a valid phone number (${minLength} digits required)`);
      return;
    }
    
    setLoading(true);
    
    try {
      if (handlePhoneRegistration) {
        await handlePhoneRegistration(cleanPhone, countryCode);
      } else {
        // Fallback - simulate SMS sending
        await new Promise(resolve => setTimeout(resolve, 1500));
        navigateAuth('verify', { phone: cleanPhone, countryCode });
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <View style={[globalStyles.phoneInputContainer, {
            backgroundColor: '#374151',
            borderColor: '#4b5563',
          }]}>
            <TouchableOpacity
              style={[globalStyles.phoneCountry, {
                borderRightColor: '#4b5563',
              }]}
              onPress={() => setShowCountries(!showCountries)}
            >
              <Text style={[globalStyles.flagText, { fontSize: 18 }]}>{selectedCountry?.flag}</Text>
              <Text style={[globalStyles.countryCodeText, { color: '#ffffff' }]}>{countryCode}</Text>
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
              onChangeText={(text) => setPhone(formatPhone(text))}
              maxLength={selectedCountry?.length + Math.floor(selectedCountry?.length / 3) || 13}
              keyboardType="phone-pad"
            />
          </View>
          
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
                <Text style={[globalStyles.modalTitle, { color: '#ffffff' }]}>Select Country</Text>
                <ScrollView>
                  {countryCodes.map((country, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[globalStyles.countryOption, {
                        borderBottomColor: '#374151',
                      }]}
                      onPress={() => {
                        setCountryCode(country.code);
                        setPhone(''); // Clear phone when country changes
                        setShowCountries(false);
                      }}
                    >
                      <Text style={[globalStyles.countryOptionText, { color: '#ffffff' }]}>
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
              globalStyles.pill,
              globalStyles.pillPrimary,
              loading && globalStyles.pillDisabled
            ]}
            onPress={handleNext}
            disabled={loading}
          >
            <Text style={globalStyles.pillTextPrimary}>
              {loading ? 'Sending...' : t.next}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PhoneEntry;