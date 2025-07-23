#!/usr/bin/env python3
"""
Simple HTTP Server for testing the HubSpot Calling Widget locally.

This script starts a Python HTTP server in the current directory,
making the widget accessible via a web browser at http://localhost:8000.

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

class Handler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler with CORS headers."""

    def end_headers(self):
        # Add CORS headers to allow the widget to be loaded from any origin
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept')
        super().end_headers()

# Change to the directory containing the script
os.chdir(DIRECTORY)

# Create the server
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Starting server at http://localhost:{PORT}")
    print(f"Serving files from: {DIRECTORY}")
    print("Press Ctrl+C to stop the server")

    # Serve until interrupted
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
