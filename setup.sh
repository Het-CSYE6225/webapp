#!/bin/bash
# Update packages and install necessary software
sudo apt update -y
sudo apt upgrade -y
sudo apt install postgresql postgresql-contrib unzip telnet -y

# Start and enable PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configure PostgreSQL to listen on all IP addresses
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/16/main/postgresql.conf

# Append appropriate access rule to pg_hba.conf for MD5 authentication from any IP
echo "host    all    all    0.0.0.0/0    md5" | sudo tee -a /etc/postgresql/16/main/pg_hba.conf

# Restart PostgreSQL to apply changes
sudo systemctl restart postgresql

# Verify PostgreSQL is active and running
PG_STATUS=$(sudo systemctl is-active postgresql)
echo "PostgreSQL status: $PG_STATUS"

# Check if the database exists; if not, create it.
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='cloud_app'")
if [ "$DB_EXISTS" != "1" ]; then
    sudo -u postgres psql -c "CREATE DATABASE cloud_app;"
else
    echo "Database 'cloud_app' already exists. Skipping creation."
fi

# Check if the user exists; if not, create it.
USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='postgres'")
if [ "$USER_EXISTS" != "1" ]; then
    sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'Tejal123';"
else
    echo "User 'postgres' already exists. Skipping creation."
fi

# Grant privileges on the database to the user.
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE cloud_app TO postgres;"

sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'Tejal123';"
# Create app group and user if they do not exist.
if ! getent group cloudgroup > /dev/null; then
    sudo groupadd cloudgroup
fi
if ! id -u clouduser > /dev/null 2>&1; then
    sudo useradd -s /bin/bash -g cloudgroup -m clouduser
fi

# Deploy app to /opt/csye6225
sudo mkdir -p /opt/csye6225
sudo unzip "/root/webapp.zip" -d /opt/csye6225
# Install Node.js (if needed)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install nodejs -y

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
    npm install
fi

# Create environment variables file (.env)
echo -e "DB_NAME=cloud_app\nDB_USER=postgres\nDB_PASSWORD=Tejal123\nDB_HOST=10.116.0.3\nPORT=8080" | sudo tee .env > /dev/nul
