// src/components/navigation/FloatingActionButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FloatingActionButton = ({
  onPress,
  visible = true,
  disabled = false,
  currentPlan = 'basic'
}) => {
  if (!visible) return null;

  const buttonColor = disabled ? '#6b7280' : '#98DDA6';
  const textColor = disabled ? '#9ca3af' : '#05212a';

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        { 
          backgroundColor: buttonColor,
          opacity: disabled ? 0.6 : 1
        }
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Ionicons 
        name="add" 
        size={28} 
        color={textColor} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100, // Above bottom navigation
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default FloatingActionButton;