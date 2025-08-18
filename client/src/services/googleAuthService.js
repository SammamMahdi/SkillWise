// Google OAuth Service for frontend
// This service handles Google OAuth authentication using the Google Identity Services library
// Updated for FedCM compatibility

class GoogleAuthService {
  constructor() {
    // Use the Google OAuth Client ID from environment variables
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id_here';
    this.isInitialized = false;
    this.callback = null;
  }

  // Initialize Google OAuth
  async initialize() {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      // Load Google Identity Services script
      if (!window.google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => this.setupGoogleAuth(resolve, reject);
        script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.head.appendChild(script);
      } else {
        this.setupGoogleAuth(resolve, reject);
      }
    });
  }

  // Setup Google Auth after script loads
  setupGoogleAuth(resolve, reject) {
    try {
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      this.isInitialized = true;
    } catch (error) {
      reject(error);
    }
  }

  // Render Google Sign-In button (FedCM compatible)
  renderButton(element, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Google Auth not initialized. Call initialize() first.');
    }

    if (!element) {
      throw new Error('Element is required for rendering Google Sign-In button');
    }

    try {
      const defaultOptions = {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: '100%',
      };

      const buttonOptions = { ...defaultOptions, ...options };
      
      window.google.accounts.id.renderButton(element, buttonOptions);
    } catch (error) {
      console.error('Failed to render Google Sign-In button:', error);
      throw error;
    }
  }

  // Get user info from Google ID token
  async getUserInfo(idToken) {
    try {
      // Decode the JWT token to get user info
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        given_name: payload.given_name,
        family_name: payload.family_name,
        picture: payload.picture,
        verified_email: payload.email_verified
      };
    } catch (error) {
      throw new Error('Failed to decode user info from Google token');
    }
  }

  // Sign out
  signOut() {
    if (window.google && window.google.accounts.id) {
      window.google.accounts.id.disableAutoSelect();
    }
    // Clear stored tokens
    localStorage.removeItem('googleIdToken');
  }

  // Check if user is signed in
  isSignedIn() {
    return !!localStorage.getItem('googleIdToken');
  }

  // Revoke access (optional)
  async revokeAccess() {
    try {
      const token = localStorage.getItem('googleIdToken');
      if (token && window.google) {
        await window.google.accounts.id.revoke(token, () => {
          console.log('Google access revoked');
        });
      }
    } catch (error) {
      console.error('Failed to revoke Google access:', error);
    }
  }
}

// Create singleton instance
const googleAuthService = new GoogleAuthService();

export default googleAuthService; 