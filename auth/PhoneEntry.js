// src/components/auth/PhoneEntry.js - COMPLETE FILE
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
  
  const formatPhone = (text) => {
    const digits = text.replace(/\D/g, '');
    const match = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,3})$/);
    if (!match) return digits;
    return [match[1], match[2], match[3]].filter(Boolean).join(' ');
  };

  const handleNext = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      Alert.alert('Error', 'Enter a valid phone number');
      return;
    }
    
    setLoading(true);
    
    try {
      if (handlePhoneRegistration) {
        console.log('📱 Using enhanced phone registration with early check');
        await handlePhoneRegistration(phone, countryCode);
      } else {
        console.log('📱 Using fallback phone registration method');
        await new Promise(resolve => setTimeout(resolve, 1500));
        navigateAuth('verify', { phone, countryCode });
      }
    } catch (error) {
      console.error('❌ Phone registration error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCountry = countryCodes.find(c => c.code === countryCode);

  return (
    <SafeAreaView style={globalStyles.authContainer}>
      <StatusBar barStyle="light-content" backgroundColor={globalStyles.authContainer.backgroundColor} />
      <LanguageSelector language={language} setLanguage={setLanguage} />
      <ScrollView contentContainerStyle={globalStyles.scrollContent}>
        {/* Consistent back button */}
        <TouchableOpacity
          style={globalStyles.backButton}
          onPress={() => navigateAuth('welcome')}
        >
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        
        <Text style={[globalStyles.authTitleLeft, { color: 'white' }]}>
          {t.enterPhone}
        </Text>
        <Text style={[globalStyles.authSubtitleLeft, { color: '#6b7280' }]}>
          {t.phoneSubtitle}
        </Text>
        
        <View style={globalStyles.authCard}>
          <View style={globalStyles.phoneInputContainer}>
            <TouchableOpacity
              style={globalStyles.phoneCountry}
              onPress={() => setShowCountries(!showCountries)}
            >
              <Text style={globalStyles.flagText}>{selectedCountry?.flag}</Text>
              <Text style={globalStyles.countryCodeText}>{countryCode}</Text>
              <Ionicons name="chevron-down" size={14} color="#9ca3af" />
            </TouchableOpacity>
            
            <TextInput
              style={globalStyles.phoneInput}
              placeholder="555 123 456"
              placeholderTextColor="#9ca3af"
              value={phone}
              onChangeText={(text) => setPhone(formatPhone(text))}
              maxLength={11}
              keyboardType="phone-pad"
              autoFocus
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
              <View style={globalStyles.countryModal}>
                <Text style={globalStyles.modalTitle}>Select Country</Text>
                <ScrollView>
                  {countryCodes.map((country, index) => (
                    <TouchableOpacity
                      key={index}
                      style={globalStyles.countryOption}
                      onPress={() => {
                        setCountryCode(country.code);
                        setShowCountries(false);
                      }}
                    >
                      <Text style={globalStyles.countryOptionText}>
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
              {loading ? 'Checking...' : t.next}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PhoneEntry;