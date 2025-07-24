/**
 * security.js - Security utilities for HubSpot Calling Widget
 *
 * This file provides security-related functionality for the HubSpot Calling Widget,
 * including authentication, token management, and secure API calls.
 */

// Token storage key in localStorage
const TOKEN_STORAGE_KEY = 'hubspot_calling_widget_token';

/**
 * Securely stores an access token
 *
 * In a production environment, consider using more secure storage methods
 * such as HttpOnly cookies or a server-side session.
 *
 * @param {string} token - The access token to store
 * @param {number} expiresIn - Token expiration time in seconds
 */
function storeAccessToken(token, expiresIn) {
  if (!token) {
    console.error('[DEBUG_LOG] Cannot store empty token');
    return;
  }

  const tokenData = {
    token: token,
    expires: Date.now() + (expiresIn * 1000), // Convert seconds to milliseconds
  };

  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenData));
    console.log('[DEBUG_LOG] Access token stored successfully');
  } catch (error) {
    console.error(`[DEBUG_LOG] Error storing access token: ${error.message}`);
  }
}

/**
 * Retrieves the stored access token if it's valid
 *
 * @returns {string|null} The access token or null if not found or expired
 */
function getAccessToken() {
  try {
    const tokenData = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!tokenData) {
      console.log('[DEBUG_LOG] No access token found');
      return null;
    }

    const { token, expires } = JSON.parse(tokenData);

    // Check if token is expired
    if (Date.now() > expires) {
      console.log('[DEBUG_LOG] Access token has expired');
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }

    return token;
  } catch (error) {
    console.error(`[DEBUG_LOG] Error retrieving access token: ${error.message}`);
    return null;
  }
}

/**
 * Clears the stored access token
 */
function clearAccessToken() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    console.log('[DEBUG_LOG] Access token cleared');
  } catch (error) {
    console.error(`[DEBUG_LOG] Error clearing access token: ${error.message}`);
  }
}

/**
 * Makes an authenticated API call to HubSpot
 *
 * @param {string} endpoint - The API endpoint to call
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Object>} The API response
 */
async function callHubSpotApi(endpoint, options = {}) {
  const token = getAccessToken();

  if (!token) {
    throw new Error('No valid access token available');
  }

  const url = endpoint.startsWith('https://')
    ? endpoint
    : `https://api.hubspot.com/${endpoint.startsWith('/') ? endpoint.substring(1) : endpoint}`;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      // Handle 401 Unauthorized (token expired or invalid)
      if (response.status === 401) {
        clearAccessToken();
        throw new Error('Authentication failed. Please log in again.');
      }

      throw new Error(`API call failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[DEBUG_LOG] API call error: ${error.message}`);
    throw error;
  }
}

/**
 * Initializes authentication with HubSpot
 *
 * This is a placeholder for the actual authentication flow.
 * In a real implementation, you would redirect to HubSpot's OAuth flow
 * or use a Private App token.
 *
 * @param {Object} options - Authentication options
 * @returns {Promise<boolean>} True if authentication was successful
 */
async function initializeAuth(options = {}) {
  console.log('[DEBUG_LOG] Initializing authentication');

  // In a real implementation, this would be replaced with actual authentication logic
  // For now, we'll just check if a token exists or use a provided one

  const existingToken = getAccessToken();
  if (existingToken) {
    console.log('[DEBUG_LOG] Using existing token');
    return true;
  }

  if (options.token) {
    console.log('[DEBUG_LOG] Using provided token');
    storeAccessToken(options.token, options.expiresIn || 86400); // Default to 24 hours
    return true;
  }

  console.log('[DEBUG_LOG] No authentication method available');
  return false;
}

// Export the functions
window.HubSpotSecurity = {
  storeAccessToken,
  getAccessToken,
  clearAccessToken,
  callHubSpotApi,
  initializeAuth
};
