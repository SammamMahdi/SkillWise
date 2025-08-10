/**
 * Utility functions for handling profile pictures across the application
 */

/**
 * Determines which profile picture to show for a user
 * @param {Object} user - The user object
 * @returns {string|null} - The URL of the profile picture to show, or null if none available
 */
export const getProfilePicture = (user) => {
  // First priority: User uploaded profile picture (avatarUrl)
  if (user?.avatarUrl) {
    return user.avatarUrl;
  }
  
  // Second priority: Google profile picture (only if user has googleId and no uploaded picture)
  if (user?.googleId && user?.profilePhoto && !user?.avatarUrl) {
    return user.profilePhoto;
  }
  
  // No profile picture available
  return null;
};

/**
 * Determines if a user has a Google Auth profile picture
 * @param {Object} user - The user object
 * @returns {boolean} - True if user has Google Auth but no uploaded picture
 */
export const hasGoogleAuthPicture = (user) => {
  return user?.googleId && user?.profilePhoto && !user?.avatarUrl;
};

/**
 * Determines if a user has uploaded a profile picture
 * @param {Object} user - The user object
 * @returns {boolean} - True if user has uploaded a profile picture
 */
export const hasUploadedPicture = (user) => {
  return !!user?.avatarUrl;
};

/**
 * Gets the fallback avatar URL for users without profile pictures
 * @param {string} name - The user's name
 * @param {string} backgroundColor - Background color for the avatar (default: 7C3AED)
 * @returns {string} - The fallback avatar URL
 */
export const getFallbackAvatarUrl = (name, backgroundColor = '7C3AED') => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${backgroundColor}&color=fff`;
};
