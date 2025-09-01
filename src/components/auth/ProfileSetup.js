// src/components/auth/ProfileSetup.js - COMPLETE FILE
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Image,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { globalStyles } from '../../styles/globalStyles';
import { translations } from '../../utils/translations';
import LanguageSelector from '../common/LanguageSelector';
import KeyboardAwareWrapper from '../common/KeyboardAwareWrapper';

const { width } = Dimensions.get('window');

// Title options that can be translated
const titleOptions = [
  'mr',
  'mrs',
  'miss',
  'ms',
  'dr',
  'prof',
];

const ProfileSetup = ({ authData, language, setLanguage, navigateAuth }) => {
  const t = translations[language];
  const [title, setTitle] = useState(authData.title || '');
  const [firstName, setFirstName] = useState(authData.firstName || '');
  const [lastName, setLastName] = useState(authData.lastName || '');
  const [email, setEmail] = useState(authData.email || '');
  const [profilePic, setProfilePic] = useState(authData.profilePicture || null);
  const [loading, setLoading] = useState(false);
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);

  // Validate name input - only letters (no spaces, numbers, or special characters)
  const validateNameInput = (text) => {
    return text.replace(/[^a-zA-Z]/g, '');
  };

  const pickImage = async () => {
    Alert.alert(
      'Select Profile Photo',
      'Choose how you would like to select your profile photo',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: openCamera },
        { text: 'Photo Library', onPress: openImageLibrary },
      ]
    );
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  const openImageLibrary = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission needed', 'Photo library permission is required to select photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  const handleTitleSelect = (selectedTitle) => {
    setTitle(selectedTitle);
    setShowTitleDropdown(false);
  };

  const handleContinue = async () => {
    if (!title) {
      Alert.alert('Error', 'Please select a title');
      return;
    }
    
    if (!firstName || !lastName) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    
    // Additional validation for name fields
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      Alert.alert('Error', 'Names must be at least 2 characters long');
      return;
    }
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    
    navigateAuth('subscription', { 
      title,
      firstName, 
      lastName, 
      email, 
      profilePicture: profilePic 
    });
  };

  const renderTitleItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => handleTitleSelect(item)}
    >
      <Text style={styles.dropdownItemText}>
        {t.titles?.[item] || item.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={globalStyles.authContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f8fb" />
      
      <KeyboardAwareWrapper
        contentContainerStyle={[
          globalStyles.scrollContent, 
          { 
            paddingHorizontal: width * 0.05,
            paddingTop: 100
          }
        ]}
        extraScrollHeight={100}
      >
        {/* Consistent back button */}
        <TouchableOpacity
          style={globalStyles.backButton}
          onPress={() => navigateAuth(authData.phone ? 'verify' : 'email')}
        >
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        
        {/* Consistent title sizing */}
        <Text style={globalStyles.authTitleLeft}>
          {t.completeProfile}
        </Text>
        <Text style={globalStyles.authSubtitleLeft}>
          {t.profileSubtitle}
        </Text>
        
        <View style={[globalStyles.authCard, { maxWidth: width * 0.9, alignSelf: 'center' }]}>
          {/* Profile Picture Section */}
          <View style={globalStyles.profilePicSection}>
            <View style={globalStyles.profilePicContainer}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={globalStyles.profilePicPreview} />
              ) : (
                <View style={globalStyles.profilePicPlaceholder}>
                  <Ionicons name="person" size={32} color="white" />
                </View>
              )}
              <TouchableOpacity 
                style={globalStyles.profilePicUpload}
                onPress={pickImage}
              >
                <Ionicons name="camera" size={16} color="white" />
              </TouchableOpacity>
            </View>
            <Text style={{ textAlign: 'center', color: '#6b7280', fontSize: 12, marginTop: 8 }}>
              {t.tapToAddPhoto}
            </Text>
          </View>

          {/* Title Dropdown */}
          <View style={globalStyles.formGroup}>
            <Text style={globalStyles.formLabel}>{t.title || 'Title'} *</Text>
            <TouchableOpacity
              style={[globalStyles.formInput, styles.dropdownTrigger]}
              onPress={() => setShowTitleDropdown(true)}
            >
              <Text style={[
                styles.dropdownTriggerText,
                !title && styles.placeholderText
              ]}>
                {title ? (t.titles?.[title] || title.toUpperCase()) : (t.selectTitle || 'Select Title')}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={globalStyles.formGroup}>
            <Text style={globalStyles.formLabel}>{t.firstName} *</Text>
            <TextInput
              style={globalStyles.formInput}
              value={firstName}
              onChangeText={(text) => setFirstName(validateNameInput(text))}
              placeholder="John"
              placeholderTextColor="#69696988"
              returnKeyType="next"
            />
          </View>

          <View style={globalStyles.formGroup}>
            <Text style={globalStyles.formLabel}>{t.lastName} *</Text>
            <TextInput
              style={globalStyles.formInput}
              value={lastName}
              onChangeText={(text) => setLastName(validateNameInput(text))}
              placeholder="Doe"
              placeholderTextColor="#69696988"
              returnKeyType="next"
            />
          </View>

          <View style={globalStyles.formGroup}>
            <Text style={globalStyles.formLabel}>{t.email}</Text>
            <TextInput
              style={globalStyles.formInput}
              value={email}
              onChangeText={setEmail}
              placeholder="john@example.com"
              placeholderTextColor="#69696988"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
          </View>
          
          <TouchableOpacity
            style={[
              globalStyles.pill,
              globalStyles.pillPrimary,
              loading && globalStyles.pillDisabled
            ]}
            onPress={handleContinue}
            disabled={loading}
          >
            <Text style={globalStyles.pillTextPrimary}>
              {loading ? 'Saving...' : t.continue}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareWrapper>

      {/* Title Selection Modal */}
      <Modal
        visible={showTitleDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTitleDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTitleDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownHeaderText}>{t.selectTitle || 'Select Title'}</Text>
              <TouchableOpacity
                onPress={() => setShowTitleDropdown(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={titleOptions}
              keyExtractor={(item) => item}
              renderItem={renderTitleItem}
              style={styles.dropdownList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// Additional styles for the dropdown
const styles = {
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 12,
  },
  dropdownTriggerText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  placeholderText: {
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: width * 0.8,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dropdownHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: 'white',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
};

export default ProfileSetup;