  #!/bin/sh
printf "+---------------------------------------------------------+\n"
printf "| %-55s |\n" "Welcome to the fognode installer"
printf "|                                                         |\n"
printf "| This script is used to install the fognode for the      |\n"
printf "| first time , preferably a Raspberry Pi.                 |\n"
printf "+---------------------------------------------------------+\n"

default_ip=$(hostname -I | awk '{print $1}')
default_server_url="http://192.168.1.12:2210"
default_port="5683"

printf "\n" # Add some space
printf "➰ Please enter the following informations:\n"
printf "%s\n" "-----------------------------------------"
read -p "Enter node name : " node_name
read -p "Enter node description : " node_description
read -p "Select ip address to be used (default=$default_ip) : " node_ip
read -p "Enter CoAP port to be used (default=$default_port) : " node_port
read -p "Enter admin server (default=$default_server_url)  : "  admin_server_url

if [ -z "$node_ip" ]; then
  node_ip="$default_ip"
fi
 
if [ -z "$node_port" ]; then
  node_port="$default_port"
fi

if [ -z "$admin_server_url" ]; then
  admin_server_url="$default_server_url"
fi

config_string=$(cat <<EOF
PORT=${node_port}
IP_ADDRESS="$node_ip"
FOG_NAME="$node_name"
FOG_DESCRIPTION="$node_description"
SERVER_URL="$admin_server_url"
EOF
)

printf "✅ Enverenment variables are setup\n\n"
echo "$config_string" > .env

# ----

go version > /dev/null 2>&1
if [ $? -eq 0 ]; then
  printf "✅ GoLang installed\n"
else
  printf "➰ Installing GoLang ...\n"
  GO_INSTALL_DIR="/usr/local"
  wget https://go.dev/dl/go1.24.2.linux-arm64.tar.gz
  rm -rf $GO_INSTALL_DIR/go && tar -C $GO_INSTALL_DIR -xzf go1.24.2.linux-arm64.tar.gz
  export PATH=$PATH:$GO_INSTALL_DIR/go/bin
  rm go1.24.2.linux-arm64.tar.gz

  go version > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    printf "✅ GoLang installed\n"
  else
    printf "📛 Failled to install GoLang .Exiting\n"
    exit 1
  fi
fi

maabe_encryptor_file="maabe-encryptor"
cd encryptor
if [ -f "$maabe_encryptor_file" ]; then
  printf "✅  File '$maabe_encryptor_file' already exists. Skipping build.\n\n"
else
  printf "➰ Building MA-ABE encryptor\n"
  go mod tidy
  go build -o "$maabe_encryptor_file" encryptor.go
  printf " ✅ MA-ABE encryptor is built\n\n"
fi
cd ..

required_package="aiocoap"

# Check if the required package is installed
if pip show "$required_package" > /dev/null 2>&1; then
  printf "✅ packages are already installed. Skipping installation.\n\n"
else
  printf "➰ Installing the necessary packages\n"
  sudo pip install --break-system-packages .
  printf "✅ Packages installed\n\n"
fi

# Set custom values for username and password
default_username="med"    # Replace with the desired username
default_password="0000"    # Replace with the desired password
default_db_name="fog_node_db"

printf "\n" # Add some space
printf "➰ Please enter the db informations:\n"
printf "%s\n" "-----------------------------------------"
read -p "Select username (default=$default_username) : " username
read -p "Enter user's password (default=$default_password) : " password
read -p "Enter database name (default=$default_db_name)  : "  db_name
read -p "Enter root password : "  root_password

if [ -z "$username" ]; then
  username="$default_username"
fi
 
if [ -z "$password" ]; then
  password="$default_password"
fi

if [ -z "$db_name" ]; then
  db_name="$default_db_name"
fi

config_string=$(cat <<EOF
DB_USER=${username}
DB_PASSWORD="$password"
DB_NAME="$db_name"
EOF
)
echo "$config_string" >> .env

printf "➰ Setting up db...\n\n"

printf "➰ Creating user...\n"
user_exists=$(mysql -u root -p$root_password  -N -e "SELECT COUNT(*) FROM mysql.user WHERE user = '$username' AND host = 'localhost';")
if [ "$user_exists" -gt 0 ]; then
    printf "⚠️ User '$username' already exists. Skipping user creation.\n\n"
else
    mysql -u root -p$root_password  -e "CREATE USER '$username'@'localhost' IDENTIFIED BY '$password';"
    printf "✅ User '$username' created.\n\n"
fi

printf "➰ Creating databse...\n"
db_exists=$(mysql -u root -p$root_password  -N -e "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '$db_name';")
if [ "$db_exists" -gt 0 ]; then
    printf "⚠️ Database '$db_name' already exists. Skipping database creation.\n\n"
else
    mysql -u root -p$root_password  -e "CREATE DATABASE $db_name;"
    printf "✅ Database '$db_name' created.\n\n"
fi

printf "➰ Granting access of $db_name to $username ...\n"
mysql -u root -p$root_password  -e "GRANT ALL PRIVILEGES ON $db_name.* TO '$username'@'localhost';"
printf "✅ Granted access of $db_name to $username\n\n"

printf "➰ Flushing privileges ...\n"
mysql -u root -p$root_password  -e "FLUSH PRIVILEGES;"
printf "✅ Privileges Flushed\n\n"

printf "➰ Creating tables ...\n"
mysql -u root -p$root_password  -e "
USE $db_name;

CREATE TABLE IF NOT EXISTS IoTObject (
    id VARCHAR(255) PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    accessPolicy TEXT NOT NULL,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_enters TIMESTAMP NULL
);
"

printf "✅ Table created\n\n"

echo "✅ Database and tables setup completed."