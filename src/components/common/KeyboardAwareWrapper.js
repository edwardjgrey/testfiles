// src/components/common/KeyboardAwareWrapper.js - COMPLETE FIXED VERSION
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Device type detection
const deviceTypes = {
  isSmallPhone: width < 375,
  isTablet: width >= 600,
  isFoldable: width >= 700 && width < 900,
};

// Spacing system
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const KeyboardAwareWrapper = ({ 
  children, 
  style, 
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  enableOnAndroid = true,
  extraScrollHeight = 20,
  ...props 
}) => {
  // Get keyboard behavior based on platform and device
  const getKeyboardBehavior = () => {
    if (Platform.OS === 'ios') return 'padding';
    if (deviceTypes.isFoldable) return 'height';
    return enableOnAndroid ? 'height' : undefined;
  };

  // Get keyboard offset
  const getKeyboardOffset = () => {
    if (Platform.OS === 'ios') return deviceTypes.isTablet ? 20 : 0;
    if (deviceTypes.isFoldable) return -100;
    return 0;
  };

  // Get extra height for different device types
  const getExtraHeight = () => {
    if (deviceTypes.isSmallPhone) return 40;
    if (deviceTypes.isFoldable) return 200;
    if (deviceTypes.isTablet) return 60;
    return extraScrollHeight;
  };

  // Dismiss keyboard when tapping outside
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={getKeyboardBehavior()}
      keyboardVerticalOffset={getKeyboardOffset()}
      {...props}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <ScrollView
          contentContainerStyle={[
            {
              flexGrow: 1,
              paddingBottom: getExtraHeight(),
              paddingHorizontal: spacing.md,
              minHeight: deviceTypes.isTablet ? height * 0.9 : height * 0.8,
              // Special handling for foldable devices
              ...(deviceTypes.isFoldable && {
                paddingBottom: 200,
                minHeight: height * 1.2,
              })
            },
            contentContainerStyle
          ]}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          bounces={false}
          overScrollMode="never"
          // iOS specific props
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="automatic"
          // Enhanced scrolling for all devices
          scrollEnabled={true}
          nestedScrollEnabled={true}
        >
          {children}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default KeyboardAwareWrapper;