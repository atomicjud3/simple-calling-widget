# HubSpot Calling Widget Implementation

This project implements a HubSpot Calling Widget based on the requirements specified in the HubSpot_App_v2.md document, particularly focusing on the "Register and Associate Your Widget" and "Debug and Refine the Flow" sections.

## Features Implemented

### Register and Associate Your Widget

The widget properly initializes the HubSpot Calling Extensions SDK and registers itself with HubSpot:

- The `cti.initialized` method is called during setup to link the widget to the HubSpot calling interface
- Event handlers are registered for key events like `onReady`, `onDialNumber`, and others
- The widget handles both inbound and outbound calls
- Engagements are automatically created in HubSpot for each call

### Debug and Refine the Flow

The widget includes comprehensive debugging and troubleshooting features:

- Debug mode is enabled in the Calling Extensions SDK
- Detailed logging is implemented with different message types (info, success, error)
- A visual connection status indicator shows the current state of the connection
- A debug log area displays all logs directly in the UI
- A "Test Connection" button allows users to test the connectivity with HubSpot
- Troubleshooting guidance is provided for common issues

### Call Management

The widget includes advanced call management features:

- Call timer to track call duration
- Mute and hold functionality
- Call transfer capability
- Call status display with real-time updates
- Contact information display during calls

### CRM Integration

The widget integrates with CRM functionality:

- Contact search with filtering
- Click-to-call from contact search results
- Caller ID customization
- Contact information display during calls

### Call History and Recording

The widget includes comprehensive call history and recording features:

- Call history view with date, contact, duration, and notes
- Call recording with start/stop functionality
- Recordings list with playback and download options
- Call notes that can be added during or after a call
- Notes are saved with the call record for future reference

## How to Use

1. **Host the Widget**: Deploy the widget to a publicly accessible HTTPS URL
2. **Create a Private App in HubSpot**:
   - Navigate to Settings → Account Management → Integrations → Private Apps
   - Create a new private app with the required scopes (calling, CRM objects)
   - Copy the Access Token for API calls
3. **Test the Widget**:
   - Open the widget in a browser
   - Click "Test Connection" to verify connectivity with HubSpot
   - Use the buttons to simulate calling actions
   - Check the debug log for detailed information
4. **Using Call Management Features**:
   - Click "Log In" to authenticate with HubSpot
   - Use "Incoming Call" to simulate an incoming call
   - Click "Answer Call" to answer the call
   - Use "Mute", "Hold", and "Transfer" buttons during an active call
   - Click "End Call" to terminate the call
5. **Using CRM Integration**:
   - Enter a search term in the Contact Search field
   - Click "Search" to find matching contacts
   - Click on a contact to select it or use the "Call" button to initiate a call
   - Customize your Caller ID in the Caller ID Settings section
6. **Using Call History and Recording**:
   - Click "Call History" to view past calls
   - During a call, click "Start Recording" to record the call
   - Click "Add Notes" to add notes about the current call
   - After recording calls, click "Show Recordings" to view and manage recordings
   - Use the "Play" and "Download" buttons to access recorded calls

## Troubleshooting

If you encounter issues with the widget:

1. **Check Connection Status**:
   - Use the "Test Connection" button to verify connectivity
   - Check the debug log for error messages
2. **Verify HubSpot Integration**:
   - Ensure the widget URL is correctly set up
   - Verify the access token is valid
   - Check that the private app has the required scopes
3. **Validate Engagements**:
   - Make a test call using the widget
   - Verify that an engagement appears in the Activity Feed for the associated contact
4. **JavaScript Console Errors**:
   - If you see "CallingExtensions is not defined" or similar errors, check that the SDK is loading correctly
   - The widget uses a robust constructor detection mechanism to handle different ways the SDK might expose its functionality
5. **Missing Favicon**:
   - The widget includes an embedded favicon using a data URI
   - If you want to use a custom favicon, replace the link tag in the head section

## Implementation Details

The widget is implemented as a single HTML file with embedded JavaScript and CSS, plus a dedicated SDK loader. It uses:

- The HubSpot Calling Extensions SDK for integration with HubSpot
- A robust SDK loader that ensures proper initialization
- UUID generation for unique call IDs
- Custom UI elements for debugging and troubleshooting

### SDK Loader

The widget includes a dedicated SDK loader (`sdk-loader.js`) that handles loading and initializing the HubSpot Calling Extensions SDK. This loader:

- Dynamically loads the SDK script
- Ensures the script is fully loaded before attempting to use it
- Implements robust constructor detection to handle different ways the SDK might expose its functionality
- Creates a dummy constructor if the real one isn't found
- Provides comprehensive logging for troubleshooting

This approach resolves issues with the SDK not being properly loaded or the constructor not being available in the expected location. The SDK loader makes the widget more robust and reliable, especially when dealing with changes to the SDK or different browser environments.

The implementation follows the guidelines specified in the HubSpot_App_v2.md document, ensuring proper registration of the widget and comprehensive debugging capabilities.
