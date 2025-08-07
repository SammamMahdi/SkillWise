// Google Sign-In Debug Utility
// This utility helps debug Google Sign-In issues and provides better error handling

export const GoogleSignInDebug = {
  // Check if FedCM is supported
  isFedCMSupported() {
    return 'IdentityCredential' in window;
  },

  // Check if FedCM is enabled in the browser
  isFedCMEnabled() {
    if (!this.isFedCMSupported()) {
      return false;
    }
    
    // Check if FedCM is enabled (this is a best-effort check)
    try {
      return navigator.permissions && navigator.permissions.query;
    } catch (error) {
      return false;
    }
  },

  // Get browser information
  getBrowserInfo() {
    const userAgent = navigator.userAgent;
    const browserInfo = {
      userAgent,
      isChrome: /Chrome/.test(userAgent) && !/Edge/.test(userAgent),
      isEdge: /Edge/.test(userAgent),
      isFirefox: /Firefox/.test(userAgent),
      isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
      version: this.getBrowserVersion(userAgent),
    };
    
    return browserInfo;
  },

  // Get browser version
  getBrowserVersion(userAgent) {
    const match = userAgent.match(/(chrome|firefox|safari|edge)\/(\d+)/i);
    return match ? match[2] : 'unknown';
  },

  // Check if Google Sign-In should work
  canUseGoogleSignIn() {
    const browserInfo = this.getBrowserInfo();
    const fedcmSupported = this.isFedCMSupported();
    
    // Google Sign-In works on all modern browsers
    // FedCM is supported in Chrome 108+, Edge 108+, and other Chromium-based browsers
    return {
      supported: true,
      fedcmSupported,
      browserInfo,
      recommendations: this.getRecommendations(browserInfo, fedcmSupported)
    };
  },

  // Get recommendations for better Google Sign-In experience
  getRecommendations(browserInfo, fedcmSupported) {
    const recommendations = [];
    
    if (!fedcmSupported) {
      recommendations.push('Consider updating to a newer browser version for better Google Sign-In support');
    }
    
    if (browserInfo.isChrome && parseInt(browserInfo.version) < 108) {
      recommendations.push('Update Chrome to version 108 or later for FedCM support');
    }
    
    if (browserInfo.isEdge && parseInt(browserInfo.version) < 108) {
      recommendations.push('Update Edge to version 108 or later for FedCM support');
    }
    
    return recommendations;
  },

  // Log debug information
  logDebugInfo() {
    const canUse = this.canUseGoogleSignIn();
    const browserInfo = this.getBrowserInfo();
    
    console.group('Google Sign-In Debug Info');
    console.log('Browser:', browserInfo);
    console.log('FedCM Supported:', this.isFedCMSupported());
    console.log('FedCM Enabled:', this.isFedCMEnabled());
    console.log('Google Sign-In Supported:', canUse.supported);
    console.log('Recommendations:', canUse.recommendations);
    console.groupEnd();
    
    return canUse;
  },

  // Handle Google Sign-In errors
  handleError(error, context = '') {
    console.error(`Google Sign-In Error${context ? ` (${context})` : ''}:`, error);
    
    // Common error patterns
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes('NetworkError')) {
      console.warn('Network error detected. This might be related to FedCM or network connectivity.');
      return {
        type: 'network',
        message: 'Network error occurred. Please check your internet connection and try again.',
        suggestion: 'If the problem persists, try refreshing the page or using a different browser.'
      };
    }
    
    if (errorMessage.includes('FedCM')) {
      console.warn('FedCM-related error detected.');
      return {
        type: 'fedcm',
        message: 'Browser compatibility issue detected.',
        suggestion: 'Try updating your browser or using a different browser.'
      };
    }
    
    if (errorMessage.includes('popup')) {
      console.warn('Popup blocked error detected.');
      return {
        type: 'popup',
        message: 'Popup was blocked by the browser.',
        suggestion: 'Please allow popups for this site and try again.'
      };
    }
    
    return {
      type: 'unknown',
      message: 'An unexpected error occurred.',
      suggestion: 'Please try again or contact support if the problem persists.'
    };
  },

  // Validate Google Sign-In configuration
  validateConfig(config) {
    const errors = [];
    
    if (!config.client_id) {
      errors.push('Client ID is required');
    }
    
    if (!config.callback) {
      errors.push('Callback function is required');
    }
    
    if (typeof config.callback !== 'function') {
      errors.push('Callback must be a function');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

export default GoogleSignInDebug; 