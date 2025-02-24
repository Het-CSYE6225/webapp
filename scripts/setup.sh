#!/bin/bash
# Update packages and install necessary software
export DEBIAN_FRONTEND=noninteractive

sudo apt update -y || { echo "apt update failed. Exiting."; exit 1; }
sudo apt upgrade -y || { echo "apt upgrade failed. Exiting."; exit 1; }
sudo apt install postgresql postgresql-contrib unzip telnet curl -y || { echo "Package installation failed. Exiting."; exit 1; }

# Start and enable PostgreSQL service
sudo systemctl start postgresql || { echo "Failed to start PostgreSQL. Exiting."; exit 1; }
sudo systemctl enable postgresql || { echo "Failed to enable PostgreSQL. Exiting."; exit 1; }

# Fetch PostgreSQL version dynamically
PG_VERSION=$(psql --version | awk '{print $3}' | cut -d'.' -f1)

# Configure PostgreSQL to listen on all IP addresses
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/$PG_VERSION/main/postgresql.conf
echo "host    all    all    0.0.0.0/0    md5" | sudo tee -a /etc/postgresql/$PG_VERSION/main/pg_hba.conf

# Restart PostgreSQL to apply changes
sudo systemctl restart postgresql || { echo "Failed to restart PostgreSQL. Exiting."; exit 1; }

# Verify PostgreSQL is active and running
PG_STATUS=$(sudo systemctl is-active postgresql)
echo "PostgreSQL status: $PG_STATUS"

# Check if the database exists; if not, create it.
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='cloud_app'" 2>/dev/null)
if [ "$DB_EXISTS" != "1" ]; then
    sudo -u postgres psql -c "CREATE DATABASE cloud_app;"
else
    echo "Database 'cloud_app' already exists. Skipping creation."
fi

# Check if the user exists; if not, create it.
USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='clouduser'")
if [ "$USER_EXISTS" != "1" ]; then
    sudo -u postgres psql -c "CREATE USER clouduser WITH PASSWORD 'Tejal123';"
else
    echo "User 'clouduser' already exists. Skipping creation."
fi

# Grant privileges on the database to the user.
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE cloud_app TO clouduser;"

# Create app group and user if they do not exist.
if ! getent group cloudgroup > /dev/null; then
    sudo groupadd cloudgroup
fi
if ! id -u clouduser > /dev/null 2>&1; then
    sudo useradd -s /bin/bash -g cloudgroup -m clouduser
fi

# Deploy app to /opt/csye6225
if [ -d "/opt/csye6225/webapp" ]; then
    sudo cp -r /tmp/webapp/* /opt/csye6225/
else
    echo "Directory /opt/csye6225/webapp does not exist. Exiting."
    exit 1
fi

# Install Node.js if needed
if ! command -v curl &> /dev/null; then
    echo "curl not found. Installing curl."
    sudo apt install curl -y
fi
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - || { echo "Node.js setup failed. Exiting."; exit 1; }
sudo apt install nodejs -y || { echo "Node.js installation failed. Exiting."; exit 1; }

# Set ownership and permissions
sudo chown -R clouduser:cloudgroup /opt/csye6225
sudo chmod -R 755 /opt/csye6225

# Change directory to the app folder
cd /opt/csye6225/webapp || { echo "Directory /opt/csye6225/webapp not found. Exiting."; exit 1; }

# Check if package.json exists.
if [ -f package.json ]; then
    echo "package.json found; skipping 'npm install'."
else
    echo "package.json not found; running 'npm install'."
    npm install || { echo "'npm install' failed. Exiting."; exit 1; }
fi

# Create environment variables file 
echo -e "DB_NAME=cloud_app\nDB_USER=postgres\nDB_PASS=Tejal123\nDB_HOST=localhost\nPORT=8080" | sudo tee .env > /dev/null

# Setup systemd service
if [ -f /tmp/csye6225.service ]; then
    sudo mv /tmp/csye6225.service /etc/systemd/system/csye6225.service
else
    echo "Service file /tmp/csye6225.service not found. Exiting."
    exit 1
fi
sudo systemctl daemon-reload || { echo "Failed to reload systemd daemon. Exiting."; exit 1; }
sudo systemctl enable csye6225.service || { echo "Failed to enable service. Exiting."; exit 1; }
sudo systemctl start csye6225.service || { echo "Failed to start service. Exiting."; exit 1; }

echo "Script completed successfully."
