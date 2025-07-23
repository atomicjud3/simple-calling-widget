#!/usr/bin/env python3
"""
Enhanced HTTP Server for testing the HubSpot Calling Widget locally.

This script starts a Python HTTP server in the current directory,
making the widget accessible via a web browser at http://localhost:8000.
It also provides proxy functionality for HubSpot API endpoints to help
debug and fix issues with API calls.

Usage:
    python3 serve.py [port]

Arguments:
    port: Optional port number (default: 8000)

Example:
    python3 serve.py 8080  # Starts server on port 8080
"""

import http.server
import socketserver
import sys
import os
import urllib.request
import urllib.error
import json
import ssl
from urllib.parse import urlparse, parse_qs

# Default port
PORT = 8000

# Use command line argument for port if provided
if len(sys.argv) > 1:
    try:
        PORT = int(sys.argv[1])
    except ValueError:
        print(f"Invalid port number: {sys.argv[1]}")
        print(f"Using default port: {PORT}")

# Get the current directory
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler with CORS headers and proxy functionality."""

    # HubSpot API endpoints to proxy
    HUBSPOT_API_HOSTS = [
        "app-ap1.hubspot.com",
        "api.hubspot.com",
        "api.hubapi.com"
    ]

    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS preflight."""
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        """Handle GET requests."""
        if self.should_proxy():
            self.proxy_request("GET")
        else:
            super().do_GET()

    def do_POST(self):
        """Handle POST requests."""
        if self.should_proxy():
            self.proxy_request("POST")
        else:
            super().do_POST()

    def should_proxy(self):
        """Determine if the request should be proxied to HubSpot."""
        path = self.path.lower()

        # Check if this is a HubSpot API request
        for host in self.HUBSPOT_API_HOSTS:
            if host in path:
                return True

        # Check for specific API endpoints
        if "/api/calling/extensions/" in path:
            return True

        return False

    def proxy_request(self, method):
        """Proxy the request to the HubSpot API."""
        url = self.path

        # If the URL doesn't start with http, assume it's a relative path to the HubSpot API
        if not url.startswith('http'):
            # Extract the API path
            if url.startswith('/'):
                api_path = url
            else:
                api_path = '/' + url

            # Determine which HubSpot host to use
            if "calling/extensions" in api_path:
                url = f"https://app-ap1.hubspot.com{api_path}"
            else:
                url = f"https://api.hubspot.com{api_path}"

        print(f"\n[PROXY] {method} {url}")

        # Get request headers
        headers = {key: value for key, value in self.headers.items()}

        # Remove headers that might cause issues
        for header in ['Host', 'Content-Length']:
            if header in headers:
                del headers[header]

        # Read request body for POST requests
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else None

        if body:
            try:
                body_json = json.loads(body)
                print(f"[PROXY] Request Body: {json.dumps(body_json, indent=2)}")
            except json.JSONDecodeError:
                print(f"[PROXY] Request Body: {body}")

        # Create the request
        req = urllib.request.Request(
            url=url,
            data=body,
            headers=headers,
            method=method
        )

        try:
            # Create a context that doesn't verify SSL certificates (for testing only)
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE

            # Send the request
            with urllib.request.urlopen(req, context=context) as response:
                # Get response status and headers
                status_code = response.status
                response_headers = response.getheaders()

                # Read response body
                response_body = response.read()

                # Log response
                print(f"[PROXY] Response Status: {status_code}")

                try:
                    response_json = json.loads(response_body)
                    print(f"[PROXY] Response Body: {json.dumps(response_json, indent=2)}")
                except json.JSONDecodeError:
                    if len(response_body) > 1000:
                        print(f"[PROXY] Response Body: {response_body[:1000]}... (truncated)")
                    else:
                        print(f"[PROXY] Response Body: {response_body}")

                # Send response to client
                self.send_response(status_code)

                # Forward response headers
                for header, value in response_headers:
                    if header.lower() not in ['transfer-encoding', 'connection']:
                        self.send_header(header, value)

                # Add CORS headers
                self.send_cors_headers()
                self.end_headers()

                # Send response body
                self.wfile.write(response_body)

        except urllib.error.HTTPError as e:
            # Handle HTTP errors
            print(f"[PROXY] HTTP Error: {e.code} {e.reason}")

            # Read error response
            error_body = e.read()

            try:
                error_json = json.loads(error_body)
                print(f"[PROXY] Error Body: {json.dumps(error_json, indent=2)}")
            except json.JSONDecodeError:
                print(f"[PROXY] Error Body: {error_body}")

            # Send error response to client
            self.send_response(e.code)

            # Forward error headers
            for header, value in e.headers.items():
                if header.lower() not in ['transfer-encoding', 'connection']:
                    self.send_header(header, value)

            # Add CORS headers
            self.send_cors_headers()
            self.end_headers()

            # Send error body
            self.wfile.write(error_body)

        except Exception as e:
            # Handle other errors
            print(f"[PROXY] Error: {str(e)}")
            self.send_response(500)
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(str(e).encode())

    def send_cors_headers(self):
        """Send CORS headers."""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Max-Age', '86400')  # 24 hours

    def end_headers(self):
        """End headers without adding CORS headers (they're added separately)."""
        super().end_headers()

# Change to the directory containing the script
os.chdir(DIRECTORY)

# Create the server with the proxy handler
with socketserver.TCPServer(("", PORT), ProxyHandler) as httpd:
    print(f"Starting enhanced server at http://localhost:{PORT}")
    print(f"Serving files from: {DIRECTORY}")
    print(f"Proxying requests to HubSpot API endpoints")
    print("Press Ctrl+C to stop the server")

    # Serve until interrupted
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
