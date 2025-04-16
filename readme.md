# Maabe Authority Web Application

web application built with [SolidJS](https://www.solidjs.com/), it aims to provide an interface for authorities to manges attributes and users.

## 🚀 Features

- import MAABE public parameters (it must be generated using the maabe.go script of the project)
- create new authority or import a exesting one
- create new attributes
- creaet new users (username,passwords) and assiate attributes to them
- see exesting users with their attributes
- generte keys for users when they interacte with API (need authentication)

## 📦 Running


Make sure you have **Node.js** , **npm** , **mysql** installed on your machine.

copy the this into your .env variable file : `iot_controller/authority/server/.env`
```yaml
DB_HOST     =localhost
DB_USER     =your_admin
DB_PASSWORD =your_password
DB_NAME     =your_db
```
run the `iot_controller/authority/server/.db` file on mysql to create the nessessery tables
```bash
mysql -u your_username -p your_database_name < iot_controller/authority/server/.db
```
now run the server
```bash
cd iot_controller/authority/server
npm install
npm run dev / npm start
```
now the ui : 
```bash
cd iot_controller/authority/client
npm install
npm run dev
```
default admin login credentials : admin/0000