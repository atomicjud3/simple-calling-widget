/**
 * HubSpot Calling Extensions SDK Loader
 *
 * This script handles the loading and initialization of the HubSpot Calling Extensions SDK.
 * It follows the approach used in the demo-minimal-js example while maintaining fallback options.
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
let cti = null;

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
    try {
      logMessage("Starting SDK initialization...", "info");

      // Following the demo approach, access the SDK via window.default
      const CallingExtensions = window.default;

      if (!CallingExtensions) {
        throw new Error("CallingExtensions constructor not found. Make sure the SDK script is loaded.");
      }

      // Create the cti instance
      cti = new CallingExtensions(options.ctiOptions || {});

      // Access constants from window.Constants like in the demo
      cti.Constants = window.Constants;

      logMessage("CTI instance created successfully", "success");
      updateConnectionStatus("connected", "SDK initialized successfully");

      resolve(cti);
    } catch (error) {
      logMessage(`Error initializing SDK: ${error.message}`, "error");
      updateConnectionStatus("disconnected", "Failed to initialize SDK");

      // Try fallback approach
      logMessage("Attempting fallback initialization...", "warning");

      try {
        // Try alternative ways to access the SDK
        const alternativeConstructors = [
          window.HubSpot && window.HubSpot.CallingExtensions,
          window.CallingExtensions,
          window.hubspot && window.hubspot.callingExtensions
        ];

        const Constructor = alternativeConstructors.find(c => c);

        if (Constructor) {
          logMessage("Found alternative constructor", "success");
          cti = new Constructor(options.ctiOptions || {});
          updateConnectionStatus("connected", "SDK initialized with fallback");
          resolve(cti);
        } else {
          throw new Error("No valid constructor found");
        }
      } catch (fallbackError) {
        logMessage(`Fallback initialization failed: ${fallbackError.message}`, "error");
        reject(error); // Reject with the original error
      }
    }
  });
}

// Export the functions
window.HubSpotSDKLoader = {
  initializeSDK
};
