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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { globalStyles } from '../../styles/globalStyles';
import { translations } from '../../utils/translations';
import LanguageSelector from '../common/LanguageSelector';
import KeyboardAwareWrapper from '../common/KeyboardAwareWrapper';



const { width } = Dimensions.get('window');

const ProfileSetup = ({ authData, language, setLanguage, navigateAuth }) => {
  const t = translations[language];
  const [firstName, setFirstName] = useState(authData.firstName || '');
  const [lastName, setLastName] = useState(authData.lastName || '');
  const [email, setEmail] = useState(authData.email || '');
  const [profilePic, setProfilePic] = useState(authData.profilePicture || null);
  const [loading, setLoading] = useState(false);

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

  const handleContinue = async () => {
    if (!firstName || !lastName) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    
    navigateAuth('subscription', { 
      firstName, 
      lastName, 
      email, 
      profilePicture: profilePic 
    });
  };

  return (
    <SafeAreaView style={globalStyles.authContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f8fb" />
      
      <KeyboardAwareWrapper
        contentContainerStyle={[
          globalStyles.scrollContent, 
          { 
            paddingHorizontal: width * 0.05,
            paddingTop: 40
          }
        ]}
        extraScrollHeight={100}
      >
        {/* Consistent back button */}
        <TouchableOpacity
          style={globalStyles.backButton}
          onPress={() => navigateAuth(authData.phone ? 'verify' : 'email')}
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
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
                  <Ionicons name="person" size={32} color="#6b7280" />
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

          <View style={globalStyles.formGroup}>
            <Text style={globalStyles.formLabel}>{t.firstName} *</Text>
            <TextInput
              style={globalStyles.formInput}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="John"
              autoFocus
              returnKeyType="next"
            />
          </View>

          <View style={globalStyles.formGroup}>
            <Text style={globalStyles.formLabel}>{t.lastName} *</Text>
            <TextInput
              style={globalStyles.formInput}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Doe"
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
    </SafeAreaView>
  );
};

export default ProfileSetup;