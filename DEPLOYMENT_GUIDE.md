# Deployment Guide for HubSpot Calling Widget

This guide provides comprehensive instructions for deploying the HubSpot Calling Widget in a production environment, including CORS configuration, monitoring, logging, versioning, and rollback procedures.

## Deployment Prerequisites

Before deploying the HubSpot Calling Widget, ensure you have:

1. A web server with HTTPS support (Nginx, Apache, etc.)
2. A valid SSL certificate
3. A HubSpot account with a configured Private App (see HUBSPOT_INTEGRATION_GUIDE.md)
4. Access to your domain's DNS settings (if using a custom domain)

## CORS Configuration

Cross-Origin Resource Sharing (CORS) is critical for the HubSpot Calling Widget to function properly, especially when making API calls to HubSpot from a different domain.

### Nginx CORS Configuration

Add the following to your Nginx server block:

```nginx
server {
    listen 443 ssl http2;
    server_name your-widget-domain.com;
    
    # SSL configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # CORS headers
    add_header 'Access-Control-Allow-Origin' 'https://app.hubspot.com' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
    add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Authorization' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    
    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' 'https://app.hubspot.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Authorization' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Content-Type' 'text/plain charset=UTF-8';
        add_header 'Content-Length' '0';
        return 204;
    }
    
    # Other configuration...
    root /path/to/your/widget;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Apache CORS Configuration

Add the following to your Apache virtual host configuration or .htaccess file:

```apache
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "https://app.hubspot.com"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
    Header set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    Header set Access-Control-Allow-Credentials "true"
    
    # Handle preflight requests
    RewriteEngine On
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^(.*)$ $1 [R=200,L]
</IfModule>
```

### Docker/Kubernetes CORS Configuration

If you're using the provided Docker/Kubernetes setup, update the Nginx configuration in `nginx/nginx.conf`:

```nginx
# Add to the http or server block
add_header 'Access-Control-Allow-Origin' 'https://app.hubspot.com' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Authorization' always;
add_header 'Access-Control-Allow-Credentials' 'true' always;
```

Then rebuild and redeploy your container:

```bash
docker build -t hubspot-calling-widget:latest .
docker-compose up -d
# Or for Kubernetes
kubectl apply -f kubernetes/deployment.yaml
```

## Monitoring and Logging Setup

Proper monitoring and logging are essential for maintaining a production-ready HubSpot Calling Widget.

### Client-Side Logging

The widget already includes basic client-side logging. To enhance it for production:

1. **Add a Logging Service**

   Create a `logging.js` file:

   ```javascript
   // logging.js
   const LoggingService = {
     // Log levels
     LEVELS: {
       DEBUG: 'debug',
       INFO: 'info',
       WARNING: 'warning',
       ERROR: 'error'
     },
     
     // Configuration
     config: {
       logToConsole: true,
       logToServer: true,
       logLevel: 'info', // 'debug', 'info', 'warning', 'error'
       serverEndpoint: '/api/logs'
     },
     
     // Initialize with custom config
     init(customConfig = {}) {
       this.config = { ...this.config, ...customConfig };
       console.log('[DEBUG_LOG] Logging service initialized');
     },
     
     // Log a message
     log(message, level = this.LEVELS.INFO, data = null) {
       // Check if we should log this level
       if (!this.shouldLog(level)) return;
       
       const logEntry = {
         timestamp: new Date().toISOString(),
         level,
         message,
         data
       };
       
       // Log to console if enabled
       if (this.config.logToConsole) {
         this.logToConsole(logEntry);
       }
       
       // Log to server if enabled
       if (this.config.logToServer) {
         this.logToServer(logEntry);
       }
       
       // Add to UI log if available
       this.logToUI(logEntry);
     },
     
     // Check if we should log this level
     shouldLog(level) {
       const levels = Object.values(this.LEVELS);
       const configLevelIndex = levels.indexOf(this.config.logLevel);
       const messageLevelIndex = levels.indexOf(level);
       
       return messageLevelIndex >= configLevelIndex;
     },
     
     // Log to console
     logToConsole(logEntry) {
       const { level, message, data } = logEntry;
       const prefix = `[${level.toUpperCase()}]`;
       
       switch (level) {
         case this.LEVELS.DEBUG:
           console.debug(prefix, message, data || '');
           break;
         case this.LEVELS.INFO:
           console.info(prefix, message, data || '');
           break;
         case this.LEVELS.WARNING:
           console.warn(prefix, message, data || '');
           break;
         case this.LEVELS.ERROR:
           console.error(prefix, message, data || '');
           break;
         default:
           console.log(prefix, message, data || '');
       }
     },
     
     // Log to server
     logToServer(logEntry) {
       fetch(this.config.serverEndpoint, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify(logEntry)
       }).catch(error => {
         console.error('[ERROR] Failed to send log to server:', error);
       });
     },
     
     // Log to UI
     logToUI(logEntry) {
       const { level, message } = logEntry;
       
       // If the logMessage function exists (defined in the widget), use it
       if (typeof window.logMessage === 'function') {
         window.logMessage(message, level);
       }
     },
     
     // Convenience methods
     debug(message, data = null) {
       this.log(message, this.LEVELS.DEBUG, data);
     },
     
     info(message, data = null) {
       this.log(message, this.LEVELS.INFO, data);
     },
     
     warning(message, data = null) {
       this.log(message, this.LEVELS.WARNING, data);
     },
     
     error(message, data = null) {
       this.log(message, this.LEVELS.ERROR, data);
     }
   };
   
   // Export the logging service
   window.LoggingService = LoggingService;
   ```

2. **Include the Logging Service in Your HTML**

   ```html
   <script src="logging.js"></script>
   <script>
     // Initialize with production settings
     LoggingService.init({
       logToConsole: false, // Disable console logging in production
       logToServer: true,
       logLevel: 'warning', // Only log warnings and errors in production
       serverEndpoint: '/api/logs'
     });
   </script>
   ```

3. **Replace Console Logs with Logging Service**

   Update your code to use the logging service:

   ```javascript
   // Instead of:
   console.log('[DEBUG_LOG] Some message');
   
   // Use:
   LoggingService.debug('Some message');
   
   // For errors:
   LoggingService.error('Error message', errorObject);
   ```

### Server-Side Logging

For server-side logging, set up a simple Express endpoint to collect logs:

1. **Create a Simple Log Server**

   ```javascript
   // log-server.js
   const express = require('express');
   const fs = require('fs');
   const path = require('path');
   const morgan = require('morgan');
   const bodyParser = require('body-parser');
   
   const app = express();
   const PORT = process.env.PORT || 3000;
   const LOG_DIR = path.join(__dirname, 'logs');
   
   // Ensure log directory exists
   if (!fs.existsSync(LOG_DIR)) {
     fs.mkdirSync(LOG_DIR);
   }
   
   // Create a write stream for access logs
   const accessLogStream = fs.createWriteStream(
     path.join(LOG_DIR, 'access.log'),
     { flags: 'a' }
   );
   
   // Create a write stream for application logs
   const appLogStream = fs.createWriteStream(
     path.join(LOG_DIR, 'app.log'),
     { flags: 'a' }
   );
   
   // Middleware
   app.use(morgan('combined', { stream: accessLogStream }));
   app.use(bodyParser.json());
   
   // Log endpoint
   app.post('/api/logs', (req, res) => {
     const logEntry = req.body;
     
     // Add client IP and user agent
     logEntry.clientIp = req.ip;
     logEntry.userAgent = req.get('User-Agent');
     
     // Write to log file
     appLogStream.write(JSON.stringify(logEntry) + '\n');
     
     // Respond with success
     res.status(200).json({ success: true });
   });
   
   // Serve static files
   app.use(express.static('public'));
   
   // Start server
   app.listen(PORT, () => {
     console.log(`Log server listening on port ${PORT}`);
   });
   ```

2. **Install Dependencies**

   ```bash
   npm init -y
   npm install express morgan body-parser
   ```

3. **Start the Log Server**

   ```bash
   node log-server.js
   ```

### Third-Party Monitoring Services

For production environments, consider integrating with third-party monitoring services:

1. **Application Performance Monitoring (APM)**
   - New Relic
   - Datadog
   - Dynatrace

2. **Error Tracking**
   - Sentry
   - Rollbar
   - Bugsnag

3. **Log Management**
   - ELK Stack (Elasticsearch, Logstash, Kibana)
   - Graylog
   - Splunk

## Versioning Strategy

A proper versioning strategy ensures smooth updates and rollbacks.

### Semantic Versioning

Follow semantic versioning (SemVer) for your widget:

- **Major version (X.0.0)**: Incompatible API changes
- **Minor version (0.X.0)**: New functionality in a backward-compatible manner
- **Patch version (0.0.X)**: Backward-compatible bug fixes

### Version Tagging

1. **Tag Releases in Git**

   ```bash
   git tag -a v1.0.0 -m "Version 1.0.0"
   git push origin v1.0.0
   ```

2. **Include Version in Your Widget**

   Add a version indicator to your widget:

   ```html
   <div class="version-info">Version 1.0.0</div>
   ```

   And in your JavaScript:

   ```javascript
   const WIDGET_VERSION = '1.0.0';
   
   // Log version on initialization
   LoggingService.info(`Initializing HubSpot Calling Widget v${WIDGET_VERSION}`);
   ```

### Deployment Artifacts

For each version:

1. Create a release bundle:

   ```bash
   # Create a release directory
   mkdir -p releases/v1.0.0
   
   # Copy all necessary files
   cp index.html releases/v1.0.0/
   cp *.js releases/v1.0.0/
   cp -r css releases/v1.0.0/
   
   # Create a zip archive
   cd releases
   zip -r hubspot-calling-widget-v1.0.0.zip v1.0.0
   ```

2. Store release artifacts in a secure location (AWS S3, Google Cloud Storage, etc.)

## Rollback Plan

A well-defined rollback plan is essential for quickly recovering from failed deployments.

### Rollback Procedure

1. **Prepare for Rollback**

   Before each deployment, create a rollback script:

   ```bash
   #!/bin/bash
   # rollback.sh
   
   # Define variables
   PREVIOUS_VERSION="1.0.0"
   DEPLOYMENT_DIR="/var/www/html"
   BACKUP_DIR="/var/backups/widget"
   
   # Check if backup exists
   if [ ! -d "$BACKUP_DIR/$PREVIOUS_VERSION" ]; then
     echo "Error: Backup for version $PREVIOUS_VERSION not found!"
     exit 1
   fi
   
   # Perform rollback
   echo "Rolling back to version $PREVIOUS_VERSION..."
   
   # Remove current version
   rm -rf $DEPLOYMENT_DIR/*
   
   # Restore previous version
   cp -r $BACKUP_DIR/$PREVIOUS_VERSION/* $DEPLOYMENT_DIR/
   
   echo "Rollback complete. Version $PREVIOUS_VERSION restored."
   ```

2. **Automated Rollback Triggers**

   Define conditions that trigger automatic rollbacks:

   - Error rate exceeds threshold (e.g., >5% of requests)
   - Response time exceeds threshold (e.g., >2000ms)
   - Critical functionality fails (e.g., calls cannot be initiated)

3. **Test Rollback Procedure**

   Before each production deployment, test the rollback procedure in a staging environment.

### Docker/Kubernetes Rollback

For containerized deployments:

1. **Docker Rollback**

   ```bash
   # Pull the previous version
   docker pull hubspot-calling-widget:1.0.0
   
   # Stop and remove the current container
   docker stop calling-widget
   docker rm calling-widget
   
   # Start a new container with the previous version
   docker run -d --name calling-widget -p 80:80 hubspot-calling-widget:1.0.0
   ```

2. **Kubernetes Rollback**

   ```bash
   # Rollback to the previous deployment
   kubectl rollout undo deployment/hubspot-calling-widget
   
   # Or rollback to a specific revision
   kubectl rollout undo deployment/hubspot-calling-widget --to-revision=2
   ```

## Deployment Checklist

Use this checklist before each production deployment:

1. **Pre-Deployment**
   - [ ] All tests pass
   - [ ] Code has been reviewed
   - [ ] Version has been updated
   - [ ] Backup of the current version has been created
   - [ ] Rollback plan has been prepared
   - [ ] CORS configuration has been verified
   - [ ] SSL certificates are valid

2. **Deployment**
   - [ ] Deploy to staging environment first
   - [ ] Verify functionality in staging
   - [ ] Deploy to production during low-traffic period
   - [ ] Monitor logs for errors
   - [ ] Verify critical functionality

3. **Post-Deployment**
   - [ ] Monitor error rates for 24 hours
   - [ ] Monitor performance metrics
   - [ ] Update documentation if needed
   - [ ] Communicate changes to stakeholders

## Conclusion

Following this deployment guide will help ensure a smooth, reliable deployment of the HubSpot Calling Widget in a production environment. The CORS configuration, monitoring and logging setup, versioning strategy, and rollback plan provide a comprehensive framework for managing the widget throughout its lifecycle.

Remember that deployment is not a one-time event but an ongoing process that requires regular monitoring, updates, and maintenance to ensure optimal performance and security.
