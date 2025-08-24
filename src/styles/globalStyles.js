// src/styles/globalStyles.js - Universal Responsive System
import { StyleSheet, Dimensions, StatusBar, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');
const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

// Enhanced device detection
const deviceTypes = {
  isSmallPhone: width < 375,
  isStandardPhone: width >= 375 && width < 414,
  isLargePhone: width >= 414 && width < 600,
  isTablet: width >= 600 && width < 900,
  isFoldable: width >= 700 && width < 900,
  isDesktop: width >= 900,
  isLandscape: width > height
};

// Universal spacing system
const spacing = {
  xs: Math.max(4, width * 0.01),
  sm: Math.max(8, width * 0.02),
  md: Math.max(16, width * 0.04),
  lg: Math.max(24, width * 0.06),
  xl: Math.max(32, width * 0.08),
  xxl: Math.max(40, width * 0.10)
};

// Responsive font sizes
const typography = {
  tiny: Math.max(10, width * 0.025),
  small: Math.max(12, width * 0.032),
  body: Math.max(14, width * 0.038),
  subtitle: Math.max(16, width * 0.042),
  title: Math.max(20, width * 0.053),
  heading: Math.max(24, width * 0.064),
  display: Math.max(28, deviceTypes.isTablet ? width * 0.065 : width * 0.075)
};

// Responsive helper functions
const responsiveWidth = (percentage) => (width * percentage) / 100;
const responsiveHeight = (percentage) => (height * percentage) / 100;
const responsiveFontSize = (size) => {
  const baseWidth = 375; // iPhone X width as base
  return Math.round((size * width) / baseWidth);
};

export const colors = {
  primary: '#98DDA6',
  primaryDark: '#7bc496',
  background: '#05212A',
  cardBackground: '#1f2937',
  text: '#ffffff',
  textDim: '#9ca3af',
  border: '#374151',
  
  // Auth colors properly configured for dark theme
  authBg: '#05212A',
  authCard: '#1f2937',
  authText: '#ffffff',
  authTextDim: '#9ca3af',
  authStroke: '#374151',
  
  success: '#16a34a',
  danger: '#dc2626',
  warning: '#f59e0b',
  info: '#3b82f6',
  google: '#111111',
  apple: '#000000',
  secondary: '#374151',
};

// Responsive values
export const responsive = {
  ...deviceTypes,
  spacing,
  typography,
  
  // Container widths
  containerWidth: deviceTypes.isTablet || deviceTypes.isFoldable ? 
    Math.min(600, width * 0.85) : width * 0.9,
  
  // Input heights
  inputHeight: deviceTypes.isSmallPhone ? 48 : 
              deviceTypes.isTablet ? 56 : 52,
              
  // Button heights  
  buttonHeight: deviceTypes.isSmallPhone ? 48 :
                deviceTypes.isTablet ? 56 : 52,
                
  // Screen dimensions
  screenWidth: width,
  screenHeight: height,
  statusBarHeight,
  
  // Safe spacing
  safeSpacing: {
    xs: Math.max(spacing.xs, 4),
    sm: Math.max(spacing.sm, 8),
    md: Math.max(spacing.md, 16),
    lg: Math.max(spacing.lg, 24),
    xl: Math.max(spacing.xl, 32),
  },
};

export const globalStyles = StyleSheet.create({
  // Main Containers
  authContainer: {
    flex: 1,
    backgroundColor: colors.authBg,
  },
  
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Scroll Content
  scrollContent: {
  flexGrow: 1,
  paddingHorizontal: spacing.md,
  paddingTop: Platform.OS === 'ios' ? 
    (deviceTypes.isTablet ? 140 : 120) : // INCREASED from 120/100
    (deviceTypes.isTablet ? 120 : 100), // INCREASED from 100/80
  paddingBottom: spacing.xl,
  justifyContent: 'flex-start', // Keep flex-start but with more top padding
  minHeight: deviceTypes.isTablet ? height * 0.85 : height * 0.75, // REDUCED min height
},
  
  mainContent: {
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  
  // Auth Card
authCard: {
  backgroundColor: colors.authCard,
  borderRadius: deviceTypes.isTablet ? 24 : 16,
  padding: spacing.lg,
  marginVertical: spacing.sm, // REDUCED from spacing.md
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 12,
  elevation: 8,
  width: responsive.containerWidth,
  maxWidth: deviceTypes.isTablet ? 500 : 400,
  alignSelf: 'center',
  borderWidth: 1,
  borderColor: colors.border,
  marginTop: spacing.xs, // ADDED: Less top margin
},
  
  signInCard: {
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: colors.authCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  // Logo
  logoWrap: {
    width: deviceTypes.isTablet ? spacing.xxl * 2 : spacing.xxl * 1.5,
    height: deviceTypes.isTablet ? spacing.xxl * 2 : spacing.xxl * 1.5,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  // Typography
  authTitle: {
    fontSize: typography.display,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: typography.display * 1.2,
  },
  
 authTitleLeft: {
  fontSize: typography.display,
  fontWeight: '800',
  color: '#ffffff',
  marginBottom: spacing.sm,
  marginTop: spacing.sm, // REDUCED from spacing.md
  lineHeight: typography.display * 1.2,
},
  
  authSubtitle: {
    fontSize: typography.body,
    color: colors.authTextDim,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: typography.body * 1.4,
  },
  
  authSubtitleLeft: {
    fontSize: typography.body,
    color: colors.authTextDim,
    marginBottom: spacing.lg,
    lineHeight: typography.body * 1.4,
  },
  
  footerText: {
    textAlign: 'center',
    color: colors.authTextDim,
    marginTop: spacing.lg,
    fontSize: typography.body,
    lineHeight: typography.body * 1.4,
  },
  
  alreadyAccountText: {
    color: colors.authTextDim,
    fontSize: typography.subtitle,
  },
  
  linkText: {
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  
  // Button Styles
  pill: {
    height: responsive.buttonHeight,
    borderRadius: responsive.buttonHeight / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    minHeight: responsive.buttonHeight,
  },
  
  pillPrimary: {
    backgroundColor: colors.primary,
  },
  
  pillSecondary: {
    backgroundColor: colors.secondary,
    marginTop: spacing.sm,
  },
  
  pillGoogle: {
    backgroundColor: colors.google,
  },
  
  pillApple: {
    backgroundColor: colors.apple,
  },
  
  pillDisabled: {
    opacity: 0.6,
  },
  
  pillTextPrimary: {
  color: colors.background,
  fontSize: typography.subtitle,
  fontWeight: '700',
  textAlign: 'center', // ADDED: Center align for better Russian text
  letterSpacing: 0.3, // ADDED: Slight letter spacing for readability
},

pillTextSecondary: {
  color: '#ffffff',
  fontSize: typography.subtitle,
  fontWeight: '700',
  marginLeft: spacing.xs, // REDUCED from spacing.sm
  textAlign: 'center', // ADDED: Center align
  letterSpacing: 0.3, // ADDED: Better spacing
},

// 5. FIXED: Google/Apple button text - More icon spacing
pillTextGoogle: {
  color: '#ffffff',
  fontSize: typography.subtitle,
  fontWeight: '700',
  marginLeft: spacing.sm, // INCREASED from default
  textAlign: 'center',
  letterSpacing: 0.3,
},

pillTextApple: {
  color: '#ffffff',
  fontSize: typography.subtitle,
  fontWeight: '700',
  marginLeft: spacing.sm, // INCREASED from default
  textAlign: 'center',
  letterSpacing: 0.3,
},
  
  // Navigation Buttons
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 
      (deviceTypes.isTablet ? 60 : 50) : // MATCH language selector height
      (deviceTypes.isTablet ? 50 : 40), // MATCH language selector height
    left: spacing.lg,
    zIndex: 1000,
    backgroundColor: 'rgba(152, 221, 166, 0.1)',
    borderRadius: 12,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Language Selector
 languageContainer: {
  position: 'absolute',
  top: Platform.OS === 'ios' ? 
    (deviceTypes.isTablet ? 60 : 50) : // DECREASED from 80/60
    (deviceTypes.isTablet ? 50 : 40), // DECREASED from 60/40
  right: spacing.lg,
  zIndex: 1000,
},
  
  languageButton: {
    backgroundColor: 'rgba(152, 221, 166, 0.1)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  
  languageText: {
    fontSize: typography.body,
    color: '#ffffff',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  languageModal: {
    backgroundColor: colors.authCard,
    borderRadius: 12,
    padding: spacing.sm,
    minWidth: deviceTypes.isTablet ? 180 : 140,
    margin: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  languageOption: {
    padding: spacing.sm,
    borderRadius: 8,
  },
  
  selectedLanguage: {
    backgroundColor: colors.primary + '20',
  },
  
  languageOptionText: {
    fontSize: typography.body,
    color: '#ffffff',
  },
  
  // Form Styles
  formGroup: {
    marginBottom: spacing.lg,
  },
  
  formLabel: {
    color: '#ffffff',
    marginBottom: spacing.sm,
    fontSize: typography.body,
    fontWeight: '500',
  },
  
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: deviceTypes.isTablet ? 16 : 12,
    paddingHorizontal: spacing.md,
    paddingVertical: deviceTypes.isSmallPhone ? spacing.sm : spacing.md,
    backgroundColor: colors.background,
    fontSize: typography.body,
    color: '#ffffff',
    minHeight: responsive.inputHeight,
  },
  
  formInputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.cardBackground,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Phone Input Styles
  phoneInputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: deviceTypes.isTablet ? 16 : 12,
    backgroundColor: colors.background,
    marginBottom: spacing.lg,
    alignItems: 'center',
    minHeight: responsive.inputHeight,
  },
  
  phoneCountry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    gap: spacing.xs,
  },
  
  flagText: {
    fontSize: deviceTypes.isTablet ? typography.title : typography.subtitle,
  },
  
  countryCodeText: {
    color: '#ffffff',
    fontSize: typography.subtitle,
    fontWeight: '600',
  },
  
  phoneInput: {
    flex: 1,
    fontSize: typography.subtitle,
    color: '#ffffff',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  
  // Verification Input
  verificationInput: {
    height: responsive.inputHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: deviceTypes.isTablet ? 16 : 12,
    backgroundColor: colors.background,
    textAlign: 'center',
    fontSize: deviceTypes.isTablet ? typography.heading : typography.title,
    letterSpacing: deviceTypes.isTablet ? 12 : 8,
    marginBottom: spacing.lg,
    color: '#ffffff',
  },
  
  resendSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  
  resendText: {
    color: colors.authTextDim,
    fontSize: typography.body,
  },
  
  resendButton: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: typography.body,
  },
  
  // Country Modal
  countryModal: {
    backgroundColor: colors.authCard,
    borderRadius: 12,
    margin: spacing.lg,
    maxHeight: height * 0.6,
    width: deviceTypes.isTablet ? 
      Math.min(400, width * 0.8) : 
      width * 0.9,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  modalTitle: {
    fontSize: typography.subtitle,
    fontWeight: 'bold',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    color: '#ffffff',
  },
  
  countryOption: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  
  countryOptionText: {
    fontSize: typography.body,
    color: '#ffffff',
  },
  
  // Profile Picture Section
  profilePicSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  
  profilePicContainer: {
    position: 'relative',
  },
  
  profilePicPreview: {
    width: deviceTypes.isTablet ? 120 : 80,
    height: deviceTypes.isTablet ? 120 : 80,
    borderRadius: deviceTypes.isTablet ? 60 : 40,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  
  profilePicPlaceholder: {
    width: deviceTypes.isTablet ? 120 : 80,
    height: deviceTypes.isTablet ? 120 : 80,
    borderRadius: deviceTypes.isTablet ? 60 : 40,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  
  profilePicUpload: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: deviceTypes.isTablet ? 36 : 28,
    height: deviceTypes.isTablet ? 36 : 28,
    borderRadius: deviceTypes.isTablet ? 18 : 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  
  // Plan Styles
  plansContainer: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  
  planCard: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: deviceTypes.isTablet ? 24 : 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    position: 'relative',
    backgroundColor: colors.authCard,
    marginHorizontal: 0,
  },
  
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.cardBackground,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#7c3aed',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: 15,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  
  popularBadgeText: {
    color: 'white',
    fontSize: typography.small,
    fontWeight: '700',
  },
  
  planHeader: {
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  
  planName: {
    fontSize: typography.title,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: spacing.sm,
  },
  
  planPrice: {
    fontSize: deviceTypes.isTablet ? typography.heading : typography.title,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: deviceTypes.isTablet ? typography.heading * 1.1 : typography.title * 1.1,
  },
  
  planPeriod: {
    fontSize: typography.body,
    color: colors.authTextDim,
    fontWeight: '500',
  },
  
  planFeatures: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  
  planFeature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingVertical: 2,
  },
  
  planFeatureText: {
    fontSize: typography.body,
    color: '#ffffff',
    flex: 1,
    lineHeight: typography.body * 1.3,
    marginTop: -2,
  },
  
  // Divider Styles
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  
  dividerText: {
    color: colors.authTextDim,
    fontSize: typography.body,
  },
  
  // Responsive Container
  responsiveContainer: {
    paddingHorizontal: spacing.md,
    maxWidth: responsive.containerWidth,
    alignSelf: 'center',
    width: '100%',
  },
  
  centeredContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Spacing Utilities
  spacingSmall: {
    marginVertical: spacing.sm,
  },
  
  spacingMedium: {
    marginVertical: spacing.md,
  },
  
  spacingLarge: {
    marginVertical: spacing.lg,
  },
});

// Legacy support - keeping old function names
export { responsiveWidth, responsiveHeight, responsiveFontSize };