import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../../styles/globalStyles';

const LanguageSelector = ({ language, setLanguage }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ky', name: 'Кыргызча', flag: '🇰🇬' }
  ];

  return (
    <View style={globalStyles.languageContainer}>
      <TouchableOpacity
        style={globalStyles.languageButton}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Ionicons name="globe-outline" size={16} color="#ffffffff" />
        <Text style={globalStyles.languageText}>
          {languages.find(l => l.code === language)?.flag}
        </Text>
        <Ionicons name="chevron-down" size={14} color="#ffffffff" />
      </TouchableOpacity>
      
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={globalStyles.modalOverlay}
          onPress={() => setIsOpen(false)}
        >
          <View style={globalStyles.languageModal}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  globalStyles.languageOption,
                  language === lang.code && globalStyles.selectedLanguage
                ]}
                onPress={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
              >
                <Text style={globalStyles.languageOptionText}>
                  {lang.flag} {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default LanguageSelector;