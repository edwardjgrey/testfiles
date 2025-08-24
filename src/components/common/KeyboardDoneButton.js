import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Keyboard, Platform } from 'react-native';
import { responsive } from '../../styles/globalStyles';

const KeyboardDoneButton = ({ style }) => {
  if (Platform.OS !== 'ios') return null;
  
  return (
    <TouchableOpacity 
      style={[styles.doneButton, style]} 
      onPress={() => Keyboard.dismiss()}
    >
      <Text style={styles.doneText}>Done</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  doneButton: {
    position: 'absolute',
    right: responsive.spacing.md,
    top: responsive.spacing.sm,
    backgroundColor: 'rgba(152, 221, 166, 0.9)',
    paddingHorizontal: responsive.spacing.md,
    paddingVertical: responsive.spacing.xs,
    borderRadius: 8,
    zIndex: 1000,
  },
  doneText: {
    fontSize: responsive.typography.body,
    fontWeight: '600',
    color: '#000',
  },
});

export default KeyboardDoneButton;