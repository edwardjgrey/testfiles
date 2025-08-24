// src/components/common/LoadingComponents.js
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, responsive } from '../../styles/globalStyles';

const { width } = Dimensions.get('window');

// Main App Loading Screen with Logo Animation
export const AppLoadingScreen = ({ message = 'Loading Akchabar...', progress = null }) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial fade in
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  return (
    <View style={styles.appLoadingContainer}>
      <Animated.View style={[
        styles.logoContainer,
        {
          transform: [
            { scale: Animated.multiply(scaleAnim, pulseAnim) }
          ],
          opacity: opacityAnim
        }
      ]}>
        {/* Logo placeholder - replace with your actual logo */}
        <View style={styles.logoCircle}>
          <Ionicons name="wallet" size={48} color="#05212a" />
        </View>
      </Animated.View>
      
      <Animated.View style={[styles.loadingTextContainer, { opacity: opacityAnim }]}>
        <Text style={styles.appName}>Akchabar</Text>
        <Text style={styles.loadingMessage}>{message}</Text>
        
        {progress !== null && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { width: `${Math.max(0, Math.min(100, progress))}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}
        
        {progress === null && (
          <ActivityIndicator 
            size="small" 
            color={colors.primary} 
            style={styles.spinner}
          />
        )}
      </Animated.View>
    </View>
  );
};

// Form Loading Overlay
export const FormLoadingOverlay = ({ visible, message = 'Processing...' }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <View style={styles.overlayContent}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.overlayText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

// Skeleton Loading for Lists
export const SkeletonLoader = ({ count = 3, itemHeight = 80 }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View 
          key={index} 
          style={[
            styles.skeletonItem, 
            { height: itemHeight, opacity }
          ]}
        >
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

// Button Loading State
export const LoadingButton = ({ 
  loading, 
  onPress, 
  children, 
  style, 
  textStyle,
  loadingText = 'Loading...',
  disabled = false
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading) {
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
      return () => spinAnimation.stop();
    }
  }, [loading]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity
      style={[
        styles.loadingButton,
        style,
        (loading || disabled) && styles.loadingButtonDisabled
      ]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <View style={styles.buttonLoadingContent}>
          <Animated.View style={[styles.buttonSpinner, { transform: [{ rotate: spin }] }]}>
            <Ionicons name="refresh" size={16} color="#05212a" />
          </Animated.View>
          <Text style={[styles.loadingButtonText, textStyle]}>{loadingText}</Text>
        </View>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

// Page Transition Loading
export const PageTransitionLoader = ({ visible }) => {
  const slideAnim = useRef(new Animated.Value(width)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[
      styles.pageTransition,
      {
        transform: [{ translateX: slideAnim }],
        opacity: opacityAnim
      }
    ]}>
      <View style={styles.pageTransitionContent}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.pageTransitionText}>Loading...</Text>
      </View>
    </Animated.View>
  );
};

// Pulse Animation for Cards/Items Loading
export const PulseLoader = ({ children, loading = true, style }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (loading) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [loading]);

  return (
    <Animated.View style={[style, { opacity: loading ? pulseAnim : 1 }]}>
      {children}
    </Animated.View>
  );
};

// Financial Data Loading with Context
export const FinancialDataLoader = ({ 
  message = 'Loading your financial data...', 
  progress = null,
  steps = []
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Simulate step progression if steps are provided
    if (steps.length > 0) {
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < steps.length - 1) {
            return prev + 1;
          }
          clearInterval(interval);
          return prev;
        });
      }, 1500);

      return () => clearInterval(interval);
    }
  }, []);

  return (
    <Animated.View style={[styles.financialLoader, { opacity: fadeAnim }]}>
      <View style={styles.financialLoaderContent}>
        <Ionicons name="analytics" size={64} color={colors.primary} />
        <Text style={styles.financialLoaderTitle}>Akchabar</Text>
        <Text style={styles.financialLoaderMessage}>{message}</Text>
        
        {steps.length > 0 && (
          <View style={styles.stepsContainer}>
            {steps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={[
                  styles.stepIndicator,
                  index <= currentStep && styles.stepIndicatorActive
                ]}>
                  {index < currentStep ? (
                    <Ionicons name="checkmark" size={12} color="#05212a" />
                  ) : (
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                  )}
                </View>
                <Text style={[
                  styles.stepText,
                  index <= currentStep && styles.stepTextActive
                ]}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {progress !== null ? (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { width: `${Math.max(0, Math.min(100, progress))}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        ) : (
          <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // App Loading Screen
  appLoadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsive.spacing.lg,
  },
  logoContainer: {
    marginBottom: responsive.spacing.xl,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingTextContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: responsive.typography.heading,
    fontWeight: '800',
    color: colors.text,
    marginBottom: responsive.spacing.sm,
  },
  loadingMessage: {
    fontSize: responsive.typography.body,
    color: colors.textDim,
    textAlign: 'center',
    marginBottom: responsive.spacing.lg,
  },
  spinner: {
    marginTop: responsive.spacing.sm,
  },

  // Progress Bar
  progressContainer: {
    alignItems: 'center',
    marginTop: responsive.spacing.md,
  },
  progressBar: {
    width: width * 0.6,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: responsive.spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: responsive.typography.small,
    color: colors.textDim,
  },

  // Overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: colors.cardBackground,
    padding: responsive.spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: width * 0.6,
  },
  overlayText: {
    fontSize: responsive.typography.body,
    color: colors.text,
    marginTop: responsive.spacing.md,
    textAlign: 'center',
  },

  // Skeleton Loader
  skeletonContainer: {
    padding: responsive.spacing.md,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: responsive.spacing.md,
    marginBottom: responsive.spacing.sm,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border,
    marginRight: responsive.spacing.md,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    marginBottom: responsive.spacing.xs,
  },
  skeletonLineShort: {
    width: '60%',
  },

  // Loading Button
  loadingButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: responsive.spacing.md,
    paddingHorizontal: responsive.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  loadingButtonDisabled: {
    opacity: 0.6,
  },
  buttonLoadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonSpinner: {
    marginRight: responsive.spacing.sm,
  },
  loadingButtonText: {
    color: '#05212a',
    fontSize: responsive.typography.body,
    fontWeight: '600',
  },

  // Page Transition
  pageTransition: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  pageTransitionContent: {
    alignItems: 'center',
  },
  pageTransitionText: {
    fontSize: responsive.typography.body,
    color: colors.textDim,
    marginTop: responsive.spacing.md,
  },

  // Financial Data Loader
  financialLoader: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsive.spacing.lg,
  },
  financialLoaderContent: {
    alignItems: 'center',
    maxWidth: width * 0.8,
  },
  financialLoaderTitle: {
    fontSize: responsive.typography.heading,
    fontWeight: '800',
    color: colors.text,
    marginTop: responsive.spacing.md,
    marginBottom: responsive.spacing.xs,
  },
  financialLoaderMessage: {
    fontSize: responsive.typography.body,
    color: colors.textDim,
    textAlign: 'center',
    marginBottom: responsive.spacing.xl,
  },

  // Steps
  stepsContainer: {
    marginBottom: responsive.spacing.lg,
    alignSelf: 'stretch',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsive.spacing.md,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsive.spacing.md,
  },
  stepIndicatorActive: {
    backgroundColor: colors.primary,
  },
  stepNumber: {
    fontSize: responsive.typography.small,
    color: colors.textDim,
    fontWeight: '600',
  },
  stepText: {
    fontSize: responsive.typography.body,
    color: colors.textDim,
    flex: 1,
  },
  stepTextActive: {
    color: colors.text,
    fontWeight: '500',
  },
});