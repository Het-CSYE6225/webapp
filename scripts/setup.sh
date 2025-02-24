#!/bin/bash

# Exit on any failure
set -e

# Create non-login user
sudo groupadd -f csye6225
sudo useradd -g csye6225 -s /usr/sbin/nologin csye6225 || true

# Install Node.js and unzip
sudo apt-get update
sudo apt-get install -y nodejs npm unzip

# Deploy application
sudo mkdir -p /opt/webapp
sudo unzip -o /tmp/webapp.zip -d /opt/webapp

# Set ownership
sudo chown -R csye6225:csye6225 /opt/webapp

# Setup systemd service
sudo mv /tmp/csye6225.service /etc/systemd/system/csye6225.service
sudo systemctl daemon-reload
sudo systemctl enable csye6225.service
sudo systemctl start csye6225.service
