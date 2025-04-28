INSTALL_DIR="/usr/local"

wget https://go.dev/dl/go1.24.2.linux-arm64.tar.gz
rm -rf $INSTALL_DIR/go && tar -C $INSTALL_DIR -xzf go1.24.2.linux-amd64.tar.gz
export PATH=$PATH:$INSTALL_DIR/go/bin
go version

cd encryptor
go mod tidy
go build -o maabe-encryptor encryptor.go