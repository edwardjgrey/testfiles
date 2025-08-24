import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';

const { height, width } = Dimensions.get('window');

// Detect if it's a foldable/large screen device
const isLargeScreen = width > 600 || height > 800;
const isFoldableDevice = width > 700; // Samsung Fold Z6 is ~884px when unfolded

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
  // For foldable devices, use much larger extra height
  const adjustedExtraHeight = isFoldableDevice ? 150 : extraScrollHeight;
  
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : enableOnAndroid ? 'height' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : isFoldableDevice ? -100 : 0}
      {...props}
    >
      <ScrollView
        contentContainerStyle={[
          {
            flexGrow: 1,
            paddingBottom: Platform.OS === 'android' ? adjustedExtraHeight : 0,
            // Add extra padding for foldable devices
            ...(isFoldableDevice && {
              paddingBottom: 200,
              minHeight: height * 1.2, // Make scrollable area larger
            })
          },
          contentContainerStyle
        ]}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        bounces={false}
        overScrollMode="never"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="automatic"
        enableAutomaticScroll={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default KeyboardAwareWrapper;