/**
 * HubSpot Calling Extensions SDK Loader
 *
 * This script handles the dynamic loading and initialization of the HubSpot Calling Extensions SDK.
 * It ensures the SDK is fully loaded before attempting to use it, and provides robust constructor detection.
 */

// Function to log messages (will be replaced by the actual logging function from index.html)
let logMessage = function(message, type = "info") {
  console.log(`[SDK-LOADER] ${message}`);
};

// Function to update connection status (will be replaced by the actual function from index.html)
let updateConnectionStatus = function(status, message) {
  console.log(`[SDK-LOADER] Status: ${status}, Message: ${message}`);
};

// Global variables
let CallingExtensionsConstructor = null;
let cti = null;
let sdkLoaded = false;
let initializationAttempted = false;

/**
 * Dynamically loads the HubSpot Calling Extensions SDK
 * @returns {Promise} A promise that resolves when the SDK is loaded
 */
function loadSDK() {
  return new Promise((resolve, reject) => {
    // Check if SDK is already loaded
    if (sdkLoaded) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = "https://static.hsappstatic.net/static-hubspot-com/static-1.270519761/calling-extensions-sdk/1.0/sdk.min.js";
    script.id = "hubspot-sdk";

    script.onload = () => {
      console.log("[SDK-LOADER] HubSpot SDK script loaded successfully");
      sdkLoaded = true;
      resolve();
    };

    script.onerror = (error) => {
      console.error("[SDK-LOADER] Error loading HubSpot SDK script:", error);
      reject(new Error("Failed to load HubSpot SDK script"));
    };

    document.head.appendChild(script);
  });
}

/**
 * Detects the CallingExtensions constructor from various possible locations
 * @returns {Object} An object containing the constructor and its source
 */
function detectConstructor() {
  let constructor = null;
  let source = "";

  // Check for different possible ways the SDK might expose its functionality
  if (typeof HubSpot !== 'undefined' && HubSpot.CallingExtensions) {
    constructor = HubSpot.CallingExtensions;
    source = "HubSpot.CallingExtensions";
  } else if (typeof window.HubSpot !== 'undefined' && window.HubSpot.CallingExtensions) {
    constructor = window.HubSpot.CallingExtensions;
    source = "window.HubSpot.CallingExtensions";
  } else if (typeof CallingExtensions !== 'undefined') {
    constructor = CallingExtensions;
    source = "global CallingExtensions";
  } else if (typeof window.CallingExtensions !== 'undefined') {
    constructor = window.CallingExtensions;
    source = "window.CallingExtensions";
  }

  return { constructor, source };
}

/**
 * Creates a dummy constructor to prevent errors when the real constructor is not found
 * @returns {Function} A dummy constructor with all required methods
 */
function createDummyConstructor() {
  return function() {
    this.initialized = function() {};
    this.userLoggedIn = function() {};
    this.userLoggedOut = function() {};
    this.incomingCall = function() {};
    this.outgoingCall = function() {};
    this.callAnswered = function() {};
    this.callEnded = function() {};
    this.resizeWidget = function() {};
    this.Constants = { callEndStatus: { INTERNAL_COMPLETED: 'completed' } };
  };
}

/**
 * Logs available global objects that might be related to the SDK
 */
function logAvailableObjects() {
  logMessage("Available global objects that might be related:", "info");
  for (const key in window) {
    if (key.includes('HubSpot') || key.includes('Calling') || key.includes('cti') ||
        key.includes('selection') || key.includes('rejection') || key.includes('Selection')) {
      logMessage(`Found: ${key}`, "info");
    }
  }
}

/**
 * Initializes the SDK and creates a cti instance
 * @param {Object} options Configuration options for the cti instance
 * @returns {Promise} A promise that resolves with the cti instance
 */
function initializeSDK(options) {
  // Set the actual logging functions if provided
  if (options.logMessage) {
    logMessage = options.logMessage;
  }

  if (options.updateConnectionStatus) {
    updateConnectionStatus = options.updateConnectionStatus;
  }

  return new Promise((resolve, reject) => {
    // Prevent multiple initialization attempts
    if (initializationAttempted && cti) {
      resolve(cti);
      return;
    }

    initializationAttempted = true;
    logMessage("Starting SDK initialization with dynamic loading...", "info");

    // First, load the SDK script
    loadSDK()
      .then(() => {
        logMessage("SDK script loaded, checking for constructor...", "info");

        // Wait a moment to ensure script is fully processed
        setTimeout(() => {
          // Try to detect the constructor
          const { constructor, source } = detectConstructor();

          if (constructor) {
            logMessage(`Found constructor at ${source}`, "success");
            CallingExtensionsConstructor = constructor;
            updateConnectionStatus("connected", "SDK loaded successfully");
          } else {
            logMessage("CallingExtensions constructor not found", "error");
            updateConnectionStatus("disconnected", "SDK initialization failed");

            // Log available global objects for debugging
            logAvailableObjects();

            // Create a dummy constructor to prevent errors
            CallingExtensionsConstructor = createDummyConstructor();
            logMessage("Created dummy constructor to prevent errors", "error");
          }

          // Create the cti instance
          try {
            cti = new CallingExtensionsConstructor(options.ctiOptions || {});
            logMessage("CTI instance created successfully", "success");
            resolve(cti);
          } catch (error) {
            logMessage(`Error creating CTI instance: ${error.message}`, "error");
            reject(error);
          }
        }, 500); // Give the browser 500ms to process the script
      })
      .catch(error => {
        logMessage(`Failed to load SDK: ${error.message}`, "error");
        updateConnectionStatus("disconnected", "Failed to load SDK");
        reject(error);
      });
  });
}

// Export the functions
window.HubSpotSDKLoader = {
  loadSDK,
  initializeSDK,
  detectConstructor,
  createDummyConstructor,
  logAvailableObjects
};
