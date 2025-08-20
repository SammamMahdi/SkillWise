import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
      };
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        
        if (authService.isAuthenticated()) {
          console.log('User is authenticated, fetching current user...');
          const user = await authService.getCurrentUser();
          console.log('Fetched user data:', user);
          dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
          authService.storeUser(user);
        } else {
          console.log('User is not authenticated');
          dispatch({ type: AUTH_ACTIONS.SET_USER, payload: null });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: null });
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const { user } = await authService.login(credentials);
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      authService.storeUser(user);
      
      // Auto-switch to dark mode after successful login
      localStorage.setItem('skillwise-theme', 'dark');
      document.documentElement.classList.add('dark');
      
      // Dispatch custom event to update theme context
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: 'dark' }));
      
      return { success: true };
    } catch (error) {
      // Handle under-13 user needing parental approval
      if (error.message === 'UNDER_13_PARENT_APPROVAL_REQUIRED') {
        // Store user data but don't set as authenticated
        const userData = { 
          ...error.userData,
          email: credentials.email, // Store email for parent request
          name: credentials.name || 'User' // Store name if available
        };
        
        // Store in localStorage temporarily for the parent email page
        localStorage.setItem('tempUserData', JSON.stringify(userData));
        
        // Redirect to parent email collection page
        window.location.href = '/auth/parent-email-required';
        return { success: false, requiresParentEmail: true };
      }
      
      // Handle other blocked account cases
      if (error.message === 'ACCOUNT_BLOCKED') {
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: { 
          ...error.userData,
          email: credentials.email
        }});
        
        // Redirect to blocked account page
        window.location.href = '/auth/blocked-account';
        return { success: false, isBlocked: true };
      }
      
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const result = await authService.register(userData);
      
      // If registration successful, log in the user and redirect to profile for first-time setup
      if (result.success && result.data?.user) {
        const userData = result.data.user;
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: userData });
        
        // Store tokens if provided
        if (result.data.accessToken) {
          localStorage.setItem('token', result.data.accessToken);
        }
        if (result.data.refreshToken) {
          localStorage.setItem('refreshToken', result.data.refreshToken);
        }
        
        // Auto-switch to dark mode after successful registration
        localStorage.setItem('skillwise-theme', 'dark');
        document.documentElement.classList.add('dark');
        
        // Dispatch custom event to update theme context
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: 'dark' }));
      }
      
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Google OAuth login
  const googleLogin = async (tokenId, role = null) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const { user } = await authService.googleAuth(tokenId, role);
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      authService.storeUser(user);
      
      // Auto-switch to dark mode after successful login
      localStorage.setItem('skillwise-theme', 'dark');
      document.documentElement.classList.add('dark');
      
      // Dispatch custom event to update theme context
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: 'dark' }));
      
      return { success: true };
    } catch (error) {
      // Handle role selection requirement
      if (error.message === 'ROLE_SELECTION_REQUIRED') {
        console.log('Role selection required, storing temp token');
        // Store the token temporarily for role selection
        localStorage.setItem('tempGoogleToken', tokenId);
        return { success: false, requiresRoleSelection: true };
      }
      
      const errorMessage = error.response?.data?.message || 'Google login failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      // Clear Google ID token if it exists
      localStorage.removeItem('googleIdToken');
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      const result = await authService.forgotPassword(email);
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset email';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      const result = await authService.resetPassword(token, password);
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password reset failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Change password
  const changePassword = async (passwords) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      const result = await authService.changePassword(passwords);
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password change failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      const result = await authService.updateProfile(profileData);
      
      if (result.success) {
        // Update local state with the new user data
        const updatedUser = { ...state.user, ...result.user };
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: updatedUser });
        authService.storeUser(updatedUser);
      }
      
      return result;
    } catch (error) {
      // Handle under-13 user detection after profile update
      if (error.response?.status === 403 && error.response?.data?.isUnder13) {
        const errorData = error.response.data;
        
        // Store temporary token if provided
        if (errorData.tempToken) {
          localStorage.setItem('tempToken', errorData.tempToken);
          localStorage.setItem('under13UserData', JSON.stringify(errorData.userData));
        }
        
        // Store user data but don't set as authenticated
        const userData = { 
          ...errorData.userData,
          requiresParentalApproval: true,
          isUnder13: true,
          blockedReason: errorData.blockedReason
        };
        
        // Store in localStorage temporarily for the parent email page
        localStorage.setItem('tempUserData', JSON.stringify(userData));
        
        // Redirect to parent email collection page
        window.location.href = '/auth/parent-email-required';
        return { success: false, requiresParentEmail: true, error: errorData.message };
      }
      
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Request parent role
  const requestParentRole = async (phoneNumber) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      const result = await authService.requestParentRole(phoneNumber);
      
      if (result.success) {
        // Update local state with the new user data
        const updatedUser = { ...state.user, ...result.data.user };
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: updatedUser });
        authService.storeUser(updatedUser);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to request parent role';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Set user function for direct user updates
  const setUser = (userData) => {
    dispatch({ type: AUTH_ACTIONS.SET_USER, payload: userData });
  };

  // Refresh user data from server
  const refreshUser = async () => {
    try {
      if (authService.isAuthenticated()) {
        console.log('Refreshing user data...');
        const user = await authService.getCurrentUser();
        console.log('Refreshed user data:', user);
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
        authService.storeUser(user);
        return user;
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      // If refresh fails, user might need to re-authenticate
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  const value = {
    ...state,
    login,
    register,
    googleLogin,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    requestParentRole,
    clearError,
    setUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 