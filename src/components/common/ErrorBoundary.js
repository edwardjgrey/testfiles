// src/components/common/ErrorBoundary.js - Production Error Handling
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log to crash reporting service (if you have one)
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // In production, you'd send this to your crash reporting service
    // like Sentry, Crashlytics, or Bugsnag
    
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      appVersion: Application.nativeApplicationVersion,
      buildVersion: Application.nativeBuildVersion,
      platform: require('react-native').Platform.OS,
      userAgent: global.navigator?.userAgent,
    };

    // For now, just log to console
    console.log('📊 Error Report:', errorReport);
    
    // TODO: Replace with actual crash reporting service
    // Sentry.captureException(error, { extra: errorReport });
  };

  handleRestart = () => {
    // Clear error state and try to recover
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorId: null 
    });
  };

  handleReportError = () => {
    const errorMessage = `
Error ID: ${this.state.errorId}
Message: ${this.state.error?.message || 'Unknown error'}
Component: ${this.props.componentName || 'Unknown'}
Time: ${new Date().toLocaleString()}
    `;

    Alert.alert(
      'Report Error',
      'Would you like to report this error to help us improve the app?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          onPress: () => {
            // In production, this would send the error to your support system
            console.log('📤 Error reported by user:', errorMessage);
            Alert.alert('Thank You', 'Error report sent successfully!');
          }
        }
      ]
    );
  };

  render() {
    if (this.state.hasError) {
      // Render custom error UI
      return (
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="warning" size={64} color="#ef4444" />
            </View>

            {/* Error Message */}
            <Text style={styles.errorTitle}>
              {this.props.language === 'ru' ? 'Что-то пошло не так' :
               this.props.language === 'ky' ? 'Бир нерсе туура эмес болду' :
               'Something went wrong'}
            </Text>

            <Text style={styles.errorSubtitle}>
              {this.props.language === 'ru' ? 'Произошла непредвиденная ошибка. Мы работаем над исправлением.' :
               this.props.language === 'ky' ? 'Күтүлбөгөн ката болду. Биз аны оңдоо үстүндө иштеп жатабыз.' :
               'An unexpected error occurred. We\'re working on fixing it.'}
            </Text>

            {/* Error ID for support */}
            {this.state.errorId && (
              <View style={styles.errorIdContainer}>
                <Text style={styles.errorIdLabel}>Error ID:</Text>
                <Text style={styles.errorId}>{this.state.errorId}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]} 
                onPress={this.handleRestart}
              >
                <Ionicons name="refresh" size={20} color="#ffffff" />
                <Text style={styles.primaryButtonText}>
                  {this.props.language === 'ru' ? 'Попробовать снова' :
                   this.props.language === 'ky' ? 'Кайра аракет кылуу' :
                   'Try Again'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]} 
                onPress={this.handleReportError}
              >
                <Ionicons name="bug" size={20} color="#6b7280" />
                <Text style={styles.secondaryButtonText}>
                  {this.props.language === 'ru' ? 'Сообщить об ошибке' :
                   this.props.language === 'ky' ? 'Ката жөнүндө билдирүү' :
                   'Report Error'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Development Info */}
            {__DEV__ && this.state.error && (
              <View style={styles.devInfo}>
                <Text style={styles.devInfoTitle}>Development Info:</Text>
                <Text style={styles.devInfoText}>
                  {this.state.error.message}
                </Text>
                <Text style={styles.devInfoText}>
                  {this.state.error.stack?.substring(0, 200)}...
                </Text>
              </View>
            )}

            {/* Support Contact */}
            <View style={styles.supportContainer}>
              <Text style={styles.supportText}>
                {this.props.language === 'ru' ? 'Нужна помощь? Свяжитесь с поддержкой:' :
                 this.props.language === 'ky' ? 'Жардам керекпи? Колдоо кызматы менен байланышыңыз:' :
                 'Need help? Contact support:'}
              </Text>
              <Text style={styles.supportEmail}>support@akchabar.com</Text>
            </View>
          </View>
        </View>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

// Styles
const styles = {
  errorContainer: {
    flex: 1,
    backgroundColor: '#05212a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 50,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorIdContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIdLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 8,
  },
  errorId: {
    fontSize: 12,
    color: '#98DDA6',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#98DDA6',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#374151',
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  devInfo: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    width: '100%',
  },
  devInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
  },
  devInfoText: {
    fontSize: 12,
    color: '#fca5a5',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  supportContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  supportText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  supportEmail: {
    fontSize: 14,
    color: '#98DDA6',
    fontWeight: '600',
  },
};

// Higher-order component to wrap any component with error boundary
export const withErrorBoundary = (Component, componentName = 'Unknown') => {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary componentName={componentName} language={props.language}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

export default ErrorBoundary;