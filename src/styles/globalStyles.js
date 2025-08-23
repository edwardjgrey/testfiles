// src/styles/globalStyles.js - UPDATED with responsive fixes and new auth theme
import { StyleSheet, Dimensions, StatusBar, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');
const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

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
  cardBackground: '#0a2f3a',
  text: '#ffffff',
  textDim: '#9ca3af',
  border: '#374151',
  
  // UPDATED: Auth colors to match main app theme
  authBg: '#05212A', // Changed from '#f7f8fb' to match main app
  authCard: '#1f2937', // Changed from '#ffffff' to match main app cards
  authText: '#ffffff', // Changed from '#0f172a' to white
  authTextDim: '#9ca3af', // Slightly updated for better contrast
  authStroke: '#374151', // Changed from '#e5e7eb' to match main app borders
  
  success: '#16a34a',
  danger: '#dc2626',
  warning: '#f59e0b',
  info: '#3b82f6',
  google: '#111111',
  apple: '#000000',
  secondary: '#374151', // Updated to match new theme
};

export const globalStyles = StyleSheet.create({
  // FIXED: Auth Container with proper padding and responsive layout
  authContainer: {
    flex: 1,
    backgroundColor: colors.authBg,
    paddingTop: statusBarHeight, // Proper status bar handling
  },
  
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // FIXED: Responsive scroll content with proper padding
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: responsiveWidth(5),
    paddingTop: responsiveHeight(2), // Reduced top padding
    paddingBottom: responsiveHeight(5),
    minHeight: height - statusBarHeight - 100, // Account for status bar
    justifyContent: 'flex-start', // Changed from 'center' to prevent pushing content down
  },
  
  mainContent: {
    padding: responsiveWidth(5),
    paddingTop: responsiveHeight(3), // Reduced from 5%
  },
  
  // UPDATED: Auth card with new theme colors
  authCard: {
    backgroundColor: colors.authCard,
    borderRadius: 20,
    padding: responsiveWidth(6),
    marginVertical: 8, // Increased margin
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, // Increased for dark theme
    shadowRadius: 12,
    elevation: 8, // Increased for Android
    width: '100%',
    maxWidth: responsiveWidth(90),
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: colors.border, // Added border for dark theme
  },
  
  signInCard: {
    alignItems: 'center',
    marginTop: 16, // Added top margin
  },
  
  // UPDATED: Logo with new theme
  logoWrap: {
    width: responsiveWidth(22),
    height: responsiveWidth(22),
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20, // Increased margin
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  // UPDATED: Typography with new colors
  authTitle: {
    fontSize: responsiveFontSize(26),
    fontWeight: '800',
    color: colors.authText,
    textAlign: 'center',
    marginBottom: 12, // Increased margin
    lineHeight: responsiveFontSize(32),
  },
  
  authTitleLeft: {
    fontSize: responsiveFontSize(26),
    fontWeight: '800',
    color: colors.authText,
    marginBottom: 12, // Increased margin
    marginTop: 16, // Increased margin
    lineHeight: responsiveFontSize(32),
  },
  
  authSubtitle: {
    fontSize: responsiveFontSize(14),
    color: colors.authTextDim,
    textAlign: 'center',
    marginBottom: 20, // Increased margin
    lineHeight: responsiveFontSize(20),
  },
  
  authSubtitleLeft: {
    fontSize: responsiveFontSize(14),
    color: colors.authTextDim,
    marginBottom: 24, // Increased margin
    lineHeight: responsiveFontSize(20),
  },
  
  footerText: {
    textAlign: 'center',
    color: colors.authTextDim,
    marginTop: 20, // Increased margin
    fontSize: responsiveFontSize(14),
    lineHeight: responsiveFontSize(20),
  },
  
  alreadyAccountText: {
    color: colors.authTextDim,
    fontSize: responsiveFontSize(16),
  },
  
  linkText: {
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  
  // UPDATED: Button styles with new theme
  pill: {
    height: responsiveHeight(7),
    borderRadius: responsiveHeight(3.5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    minHeight: 54,
  },
  
  pillPrimary: {
    backgroundColor: colors.primary,
  },
  
  pillSecondary: {
    backgroundColor: colors.secondary,
    marginTop: 12,
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
    fontSize: responsiveFontSize(16),
    fontWeight: '700',
  },
  
  pillTextSecondary: {
    color: colors.authText,
    fontSize: responsiveFontSize(16),
    fontWeight: '700',
    marginLeft: 8,
  },
  
  pillTextGoogle: {
    color: '#ffffff',
    fontSize: responsiveFontSize(16),
    fontWeight: '700',
  },
  
  pillTextApple: {
    color: '#ffffff',
    fontSize: responsiveFontSize(16),
    fontWeight: '700',
  },
  
  // FIXED: Back button alignment
  backButton: {
    padding: 12, // Increased padding
    marginBottom: 16, // Reduced margin
    marginTop: 8, // Reduced margin
    alignSelf: 'flex-start',
    borderRadius: 12, // Increased border radius
    backgroundColor: colors.authCard,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 44, // Minimum touch target
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Language Selector (keeping existing position)
  languageContainer: {
    position: 'absolute',
    top: statusBarHeight + 10,
    right: 20,
    zIndex: 1000,
  },
  
  languageButton: {
    backgroundColor: colors.authCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  languageText: {
    fontSize: responsiveFontSize(14),
    color: colors.authText,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)', // Darker overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  languageModal: {
    backgroundColor: colors.authCard,
    borderRadius: 12, // Increased border radius
    padding: 10,
    minWidth: 140,
    margin: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  languageOption: {
    padding: 12, // Increased padding
    borderRadius: 8,
  },
  
  selectedLanguage: {
    backgroundColor: colors.primary + '20', // Semi-transparent primary
  },
  
  languageOptionText: {
    fontSize: responsiveFontSize(14),
    color: colors.authText,
  },
  
  // UPDATED: Form styles with new theme
  formGroup: {
    marginBottom: 20, // Increased margin
  },
  
  formLabel: {
    color: colors.authTextDim,
    marginBottom: 8, // Increased margin
    fontSize: responsiveFontSize(14),
    fontWeight: '500',
  },
  
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16, // Increased padding
    backgroundColor: colors.background,
    fontSize: responsiveFontSize(16),
    color: colors.authText,
    minHeight: responsiveHeight(6.5),
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
  
  // UPDATED: Phone input with new theme
  phoneInputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.background,
    marginBottom: 20,
    alignItems: 'center',
    minHeight: responsiveHeight(7),
  },
  
  phoneCountry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    gap: 8,
  },
  
  flagText: {
    fontSize: responsiveFontSize(18),
  },
  
  countryCodeText: {
    color: colors.authText,
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
  },
  
  phoneInput: {
    flex: 1,
    fontSize: responsiveFontSize(18),
    color: colors.authText,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  
  // UPDATED: Verification input with new theme
  verificationInput: {
    height: responsiveHeight(7),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.background,
    textAlign: 'center',
    fontSize: responsiveFontSize(24),
    letterSpacing: 8,
    marginBottom: 20,
    color: colors.authText,
  },
  
  resendSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  resendText: {
    color: colors.authTextDim,
    fontSize: responsiveFontSize(14),
  },
  
  resendButton: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: responsiveFontSize(14),
  },
  
  // UPDATED: Country modal with new theme
  countryModal: {
    backgroundColor: colors.authCard,
    borderRadius: 12,
    margin: 20,
    maxHeight: height * 0.6,
    width: width * 0.9,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  modalTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: 'bold',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    color: colors.authText,
  },
  
  countryOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  
  countryOptionText: {
    fontSize: responsiveFontSize(14),
    color: colors.authText,
  },
  
  // UPDATED: Profile picture with new theme
  profilePicSection: {
    alignItems: 'center',
    marginBottom: 28, // Increased margin
  },
  
  profilePicContainer: {
    position: 'relative',
  },
  
  profilePicPreview: {
    width: responsiveWidth(20),
    height: responsiveWidth(20),
    borderRadius: responsiveWidth(10),
    borderWidth: 3,
    borderColor: colors.primary,
  },
  
  profilePicPlaceholder: {
    width: responsiveWidth(20),
    height: responsiveWidth(20),
    borderRadius: responsiveWidth(10),
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
    width: responsiveWidth(7),
    height: responsiveWidth(7),
    borderRadius: responsiveWidth(3.5),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  
  // UPDATED: Plan styles with new theme and better spacing
  plansContainer: {
    marginBottom: 30,
    gap: 16, // Reduced gap for better fit
  },
  
  planCard: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 20,
    padding: responsiveWidth(5), // Reduced padding slightly
    marginBottom: 16,
    position: 'relative',
    backgroundColor: colors.authCard,
    marginHorizontal: 0, // Removed horizontal margin
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
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 15,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  
  popularBadgeText: {
    color: 'white',
    fontSize: responsiveFontSize(12),
    fontWeight: '700',
  },
  
  planHeader: {
    marginBottom: 16, // Reduced margin
    marginTop: 8,
  },
  
  planName: {
    fontSize: responsiveFontSize(20), // Reduced from 22
    fontWeight: '800',
    color: colors.authText,
    marginBottom: 10, // Reduced margin
  },
  
  planPrice: {
    fontSize: responsiveFontSize(24), // Reduced from 28
    fontWeight: '900',
    color: colors.authText,
    lineHeight: responsiveFontSize(28),
  },
  
  planPeriod: {
    fontSize: responsiveFontSize(14),
    color: colors.authTextDim,
    fontWeight: '500',
  },
  
  planFeatures: {
    marginBottom: 16, // Reduced margin
    gap: 8, // Reduced gap
  },
  
  planFeature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10, // Reduced gap
    marginBottom: 8, // Reduced margin
    paddingVertical: 2,
  },
  
  planFeatureText: {
    fontSize: responsiveFontSize(14),
    color: colors.authText,
    flex: 1,
    lineHeight: responsiveFontSize(18), // Reduced line height
    marginTop: -2,
  },
  
  // Divider styles remain the same but updated colors
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
  },
  
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  
  dividerText: {
    color: colors.authTextDim,
    fontSize: responsiveFontSize(14),
  },
  
  // Add responsive design helpers at the end
  responsiveContainer: {
    paddingHorizontal: Math.min(responsiveWidth(5), 20),
  },
  
  centeredContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  spacingSmall: {
    marginVertical: responsiveHeight(1),
  },
  
  spacingMedium: {
    marginVertical: responsiveHeight(2),
  },
  
  spacingLarge: {
    marginVertical: responsiveHeight(3),
  },
});

// UPDATED: Helper functions with better responsive design
export const responsive = {
  width: responsiveWidth,
  height: responsiveHeight,
  fontSize: responsiveFontSize,
  
  // Device type detection
  isSmallDevice: width < 375,
  isMediumDevice: width >= 375 && width < 414,
  isLargeDevice: width >= 414,
  
  // Screen dimensions
  screenWidth: width,
  screenHeight: height,
  statusBarHeight,
  
  // Safe spacing
  safeSpacing: {
    xs: Math.max(responsiveWidth(1), 4),
    sm: Math.max(responsiveWidth(2), 8),
    md: Math.max(responsiveWidth(4), 16),
    lg: Math.max(responsiveWidth(6), 24),
    xl: Math.max(responsiveWidth(8), 32),
  },
  
  // Common responsive values
  buttonHeight: Math.max(responsiveHeight(7), 48),
  inputHeight: Math.max(responsiveHeight(6.5), 44),
  headerFontSize: Math.max(responsiveFontSize(26), 22),
  bodyFontSize: Math.max(responsiveFontSize(16), 14),
  smallFontSize: Math.max(responsiveFontSize(14), 12),
};