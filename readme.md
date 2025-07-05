# MA-ABE IoT access control system

## Admin web application

- install **node.js** and **mysql**,

- setup the ".env"
```

DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=
PORT=
```

- start ./launch.sh

## Authority

- install **node.js** , **goLang** and **mysql**

- setup the .env

```
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=

PORT=
SERVER_URL="the admin server"
```

- start ./launch.sh

## fog node

- install **python3**, **pip**, **goLang**  and **mariadb**

- start ./install.sh and setup

- python3 server.py