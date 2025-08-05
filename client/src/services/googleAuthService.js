// Google OAuth Service for frontend
// This service handles Google OAuth authentication using the Google Identity Services library

class GoogleAuthService {
  constructor() {
    // Use the actual Google OAuth Client ID from environment variables
    this.clientId = '269526213654-n074agil0bclv6aiu651jd2hgfdfikil.apps.googleusercontent.com';
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
      });
      this.isInitialized = true;
    } catch (error) {
      reject(error);
    }
  }

  // Sign in with Google
  async signIn() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      try {
        // Create a temporary button to trigger Google Sign-In
        const button = document.createElement('div');
        button.id = 'google-signin-button';
        button.style.display = 'none';
        document.body.appendChild(button);

        // Render the Google Sign-In button
        window.google.accounts.id.renderButton(button, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        });

        // Simulate a click on the button
        const googleButton = button.querySelector('div[role="button"]');
        if (googleButton) {
          googleButton.click();
        } else {
          // Fallback: try to trigger the sign-in directly
          window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed()) {
              reject(new Error('Google Sign-In not available'));
            } else if (notification.isSkippedMoment()) {
              reject(new Error('Google Sign-In skipped'));
            } else if (notification.isDismissedMoment()) {
              reject(new Error('Google Sign-In dismissed'));
            }
          });
        }

        // Clean up the temporary button after a short delay
        setTimeout(() => {
          if (document.body.contains(button)) {
            document.body.removeChild(button);
          }
        }, 1000);
      } catch (error) {
        reject(error);
      }
    });
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
  }

  // Check if user is signed in
  isSignedIn() {
    return !!localStorage.getItem('googleIdToken');
  }
}

// Create singleton instance
const googleAuthService = new GoogleAuthService();

export default googleAuthService; 