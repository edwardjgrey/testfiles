import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const AkchabarLogo = ({ 
  size = 'medium', 
  variant = 'default',
  style = {} 
}) => {
  const getLogoSource = () => {
    switch (variant) {
      case 'white':
        return require('../../../assets/logos/logo-white.png');
      case 'small':
        return require('../../../assets/logos/logo-small.png');
      default:
        return require('../../../assets/logos/logo.png');
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { width: 40, height: 40 };
      case 'medium':
        return { width: 80, height: 80 };
      case 'large':
        return { width: 120, height: 120 };
      case 'xlarge':
        return { width: 160, height: 160 };
      default:
        return { width: 80, height: 80 };
    }
  };

  return (
    <View style={[styles.container, getSizeStyle(), style]}>
      <Image
        source={getLogoSource()}
        style={[styles.logo, getSizeStyle()]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    borderRadius: 8,
  },
});

export default AkchabarLogo;