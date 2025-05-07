  #!/bin/sh
printf "+---------------------------------------------------------+\n"
printf "| %-55s |\n" "Welcome to the fognode installer"
printf "|                                                         |\n"
printf "| This script is used to install the fognode for the      |\n"
printf "| first time , preferably a Raspberry Pi. It will         |\n"
printf "| install the code running the fognode and start it. It   |\n"
printf "| will also start the fog node on machine startup.        |\n"
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
printf "➰ Setting up GoLang ...\n"
GO_INSTALL_DIR="/usr/local"
wget https://go.dev/dl/go1.24.2.linux-arm64.tar.gz
rm -rf $GO_INSTALL_DIR/go && tar -C $GO_INSTALL_DIR -xzf go1.24.2.linux-arm64.tar.gz
export PATH=$PATH:$GO_INSTALL_DIR/go/bin
rm go1.24.2.linux-arm64.tar.gz

go version > /dev/null 2>&1
if [ $? -eq 0 ]; then
  printf "✅ GoLang installed\n"
else
  printf "📛 Failled to install go .Exiting\n"
  exit 1
fi

printf "➰ Installing MA-ABE encryption script\n"
cd encryptor
go mod tidy
go build -o maabe-encryptor encryptor.go
printf " ✅ Encryption script is setup\n\n"
cd ..

printf "➰ Installing the nessasserry packages\n"
sudo pip install --break-system-packages .
printf "✅ packages installed\n"
