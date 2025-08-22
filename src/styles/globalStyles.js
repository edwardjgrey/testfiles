import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

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
  authBg: '#f7f8fb',
  authCard: '#ffffff',
  authText: '#0f172a',
  authTextDim: '#6b7280',
  authStroke: '#e5e7eb',
  success: '#16a34a',
  danger: '#dc2626',
  warning: '#f59e0b',
  info: '#3b82f6',
  google: '#111111',
  apple: '#000000',
  secondary: '#e5e7eb',
};

export const globalStyles = StyleSheet.create({
  // Auth Container Styles
  authContainer: {
    flex: 1,
    backgroundColor: colors.authBg,
  },
  
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  scrollContent: {
    padding: responsiveWidth(5),
    minHeight: height - 100,
    justifyContent: 'center',
  },
  
  mainContent: {
    padding: responsiveWidth(5),
    paddingTop: responsiveHeight(5),
  },
  
  authCard: {
    backgroundColor: colors.authCard,
    borderRadius: 20,
    padding: responsiveWidth(6),
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    width: '100%',
    maxWidth: responsiveWidth(90),
  },
  
  signInCard: {
    alignItems: 'center',
  },
  
  // Logo Styles
  logoWrap: {
    width: responsiveWidth(22),
    height: responsiveWidth(22),
    borderRadius: 16,
    backgroundColor: '#efeefb',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  
  // Typography
  authTitle: {
    fontSize: responsiveFontSize(26),
    fontWeight: '800',
    color: colors.authText,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: responsiveFontSize(32),
  },
  
  authTitleLeft: {
    fontSize: responsiveFontSize(26),
    fontWeight: '800',
    color: colors.authText,
    marginBottom: 8,
    marginTop: 10,
    lineHeight: responsiveFontSize(32),
  },
  
  authSubtitle: {
    fontSize: responsiveFontSize(14),
    color: colors.authTextDim,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: responsiveFontSize(20),
  },
  
  authSubtitleLeft: {
    fontSize: responsiveFontSize(14),
    color: colors.authTextDim,
    marginBottom: 20,
    lineHeight: responsiveFontSize(20),
  },
  
  footerText: {
    textAlign: 'center',
    color: colors.authTextDim,
    marginTop: 16,
    fontSize: responsiveFontSize(14),
    lineHeight: responsiveFontSize(20),
  },
  
  alreadyAccountText: {
    color: colors.authTextDim,
    fontSize: responsiveFontSize(16),
  },
  
  linkText: {
    color: '#6d28d9',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  
  // Button Styles
  pill: {
    height: responsiveHeight(7),
    borderRadius: responsiveHeight(3.5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    minHeight: 54, // Ensure minimum height for longer text
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
  
  // Back Button for light backgrounds
  backButton: {
    padding: 8,
    marginBottom: 20,
    marginTop: 50,
    alignSelf: 'flex-start',
    borderRadius: 8,
  },
  
  // Back Button for dark backgrounds
  backButtonDark: {
    padding: 8,
    marginBottom: 20,
    marginTop: 50,
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Language Selector
  languageContainer: {
    position: 'absolute',
    top: 30,
    right: 20,
    zIndex: 1000,
  },
  
  languageButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.authStroke,
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  languageText: {
    fontSize: responsiveFontSize(14),
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  languageModal: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    minWidth: 120,
    margin: 20,
  },
  
  languageOption: {
    padding: 10,
    borderRadius: 6,
  },
  
  selectedLanguage: {
    backgroundColor: '#f3f4f6',
  },
  
  languageOptionText: {
    fontSize: responsiveFontSize(14),
  },
  
  // Form Input Styles
  formGroup: {
    marginBottom: 16,
  },
  
  formLabel: {
    color: colors.authTextDim,
    marginBottom: 6,
    fontSize: responsiveFontSize(14),
    fontWeight: '500',
  },
  
  formInput: {
    borderWidth: 1,
    borderColor: colors.authStroke,
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fff',
    fontSize: responsiveFontSize(16),
    color: colors.authText,
    minHeight: responsiveHeight(6.5),
  },
  
  formInputFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  
  // Phone Input Styles
  phoneInputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.authStroke,
    borderRadius: 14,
    backgroundColor: '#fff',
    marginBottom: 16,
    alignItems: 'center',
    minHeight: responsiveHeight(7),
  },
  
  phoneCountry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: colors.authStroke,
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
  
  // Verification Input
  verificationInput: {
    height: responsiveHeight(7),
    borderWidth: 1,
    borderColor: colors.authStroke,
    borderRadius: 14,
    backgroundColor: '#fff',
    textAlign: 'center',
    fontSize: responsiveFontSize(24),
    letterSpacing: 8,
    marginBottom: 16,
    color: colors.authText,
  },
  
  resendSection: {
    alignItems: 'center',
    marginBottom: 16,
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
  
  // Country Modal
  countryModal: {
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 20,
    maxHeight: height * 0.6,
    width: width * 0.9,
  },
  
  modalTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: 'bold',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.authStroke,
  },
  
  countryOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  
  countryOptionText: {
    fontSize: responsiveFontSize(14),
  },
  
  // Profile Picture
  profilePicSection: {
    alignItems: 'center',
    marginBottom: 24,
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
    backgroundColor: colors.authStroke,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.authStroke,
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
    borderColor: 'white',
  },
  
  // Plans
  plansContainer: {
    marginBottom: 30,
    gap: 20,
  },
  
  planCard: {
    borderWidth: 2,
    borderColor: colors.authStroke,
    borderRadius: 20,
    padding: responsiveWidth(6),
    marginBottom: 20,
    position: 'relative',
    backgroundColor: 'white',
    marginHorizontal: responsiveWidth(2),
  },
  
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#f0fdf4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
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
    marginBottom: 20,
    marginTop: 8,
  },
  
  planName: {
    fontSize: responsiveFontSize(22),
    fontWeight: '800',
    color: colors.authText,
    marginBottom: 12,
  },
  
  planPrice: {
    fontSize: responsiveFontSize(28),
    fontWeight: '900',
    color: colors.authText,
    lineHeight: responsiveFontSize(32),
  },
  
  planPeriod: {
    fontSize: responsiveFontSize(15),
    color: colors.authTextDim,
    fontWeight: '500',
  },
  
  planFeatures: {
    marginBottom: 20,
    gap: 12,
  },
  
  planFeature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
    paddingVertical: 2,
  },
  
  planFeatureText: {
    fontSize: responsiveFontSize(15),
    color: colors.authText,
    flex: 1,
    lineHeight: responsiveFontSize(20),
    marginTop: -2,
  },
  
  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
  },
  
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.authStroke,
  },
  
  dividerText: {
    color: colors.authTextDim,
    fontSize: responsiveFontSize(14),
  },
  
  // Main App Styles
  userGreeting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  
  userAvatar: {
    width: responsiveWidth(12),
    height: responsiveWidth(12),
    borderRadius: responsiveWidth(6),
  },
  
  avatarImage: {
    width: responsiveWidth(12),
    height: responsiveWidth(12),
    borderRadius: responsiveWidth(6),
  },
  
  avatarPlaceholder: {
    width: responsiveWidth(12),
    height: responsiveWidth(12),
    borderRadius: responsiveWidth(6),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  avatarText: {
    fontSize: responsiveFontSize(20),
    fontWeight: 'bold',
    color: colors.background,
  },
  
  greeting: {
    fontSize: responsiveFontSize(24),
    fontWeight: 'bold',
    color: colors.text,
  },
  
  subGreeting: {
    fontSize: responsiveFontSize(16),
    color: colors.textDim,
    marginTop: 4,
  },
  
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: responsiveWidth(5),
    marginBottom: 16,
  },
  
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: responsiveFontSize(14),
  },
  
  balanceAmount: {
    color: 'white',
    fontSize: responsiveFontSize(28),
    fontWeight: 'bold',
  },
  
  quickStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  
  statCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: responsiveWidth(4),
  },
  
  statLabel: {
    fontSize: responsiveFontSize(14),
    color: colors.textDim,
    marginBottom: 8,
  },
  
  statValue: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: colors.text,
  },
  
  successCard: {
    marginTop: 24,
  },
  
  successTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  
  successText: {
    color: colors.authTextDim,
    marginBottom: 16,
    lineHeight: responsiveFontSize(20),
    fontSize: responsiveFontSize(14),
  },
});

// Helper functions for responsive design
export const responsive = {
  width: responsiveWidth,
  height: responsiveHeight,
  fontSize: responsiveFontSize,
  
  // Device type detection
  isSmallDevice: width < 375,
  isMediumDevice: width >= 375 && width < 414,
  isLargeDevice: width >= 414,
  
  // Spacing helpers
  spacing: {
    xs: responsiveWidth(1),
    sm: responsiveWidth(2),
    md: responsiveWidth(4),
    lg: responsiveWidth(6),
    xl: responsiveWidth(8),
  },
  
  // Common responsive values
  buttonHeight: responsiveHeight(7),
  inputHeight: responsiveHeight(6.5),
  headerFontSize: responsiveFontSize(26),
  bodyFontSize: responsiveFontSize(16),
  smallFontSize: responsiveFontSize(14),
};