const mysql = require("mysql2");

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  // database: process.env.DB_NAME || "users_db", // Database name is handled separately now
};
const dbName = process.env.DB_NAME || "users_db";

async function initializeDatabase() {
  let connection;
  try {
    console.log(`Attempting to create MySQL db...`);
    connection = mysql.createConnection(dbConfig);
    console.log(`Ensuring database '${dbName}' exists...`);
    connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName};`);
    console.log(`✅ Database '${dbName}' created.`);
    connection.end();

    console.log(`Connecting to database '${dbName}'...`);
    const dbConnection = mysql.createConnection({
      ...dbConfig,
      database: dbName,
    });
    console.log(`✅ Successfully connected to MySQL`);

    // 4. Create the table(s) if they don't exist
    console.log("Ensuring table 'users' exists...");
    dbConnection.query(`
        CREATE TABLE IF NOT EXISTS User (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        `);
    console.log("✅ Table 'users' created.");
    dbConnection.query(`
    CREATE TABLE IF NOT EXISTS FogNode (
      id            VARCHAR(255)      PRIMARY KEY,
      name          VARCHAR(255)      NOT NULL,
      description   TEXT              NOT NULL,
      url           TEXT              NULL,
      date_creation TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
      date_entering TIMESTAMP         NULL
    );
      `);
    console.log("✅ Table 'fognodes' created.");
    dbConnection.query(`
    CREATE TABLE IF NOT EXISTS IoTObject (
      id            VARCHAR(255)      PRIMARY KEY,
      fog_node      VARCHAR(255)      NOT NULL,
      name          TEXT              NOT NULL,
      description   TEXT              NOT NULL,
      accessPolicy  TEXT              NOT NULL,
      url           TEXT              NULL,
      date_creation TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
      date_entering   TIMESTAMP         NULL,
      FOREIGN KEY (fog_node) REFERENCES FogNode(id)
    );
      `);
    console.log("✅ Table 'iot_objects' created.");

    dbConnection.on("error", (err) => {
      console.error("MySQL Runtime Error:", err);
      process.exit(1);
    });

    // 5. Return the database-specific connection
    return dbConnection;
  } catch (err) {
    console.error("❌ Database initialization failed:");
    console.error(`   Code: ${err.code}`);
    console.error(`   Message: ${err.message}`);
    process.exit(1);
  }
}

module.exports = initializeDatabase;
