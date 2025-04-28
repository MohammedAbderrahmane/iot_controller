const mysql = require("mysql2");

// Configuration de la connexion à la base de données
const config = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "users_db",
};

console.log("Tentative de connexion à la base de données avec les paramètres :");
console.log(`  - Host: ${config.host}`);
console.log(`  - User: ${config.user}`);
console.log(`  - Database: ${config.database}`);

// Création de la connexion
const db = mysql.createConnection(config);

// Établir la connexion
db.connect((err) => {
  if (err) {
    console.error("Erreur de connexion à la base de données MySQL :");
    console.error(`Code: ${err.code}`);
    console.error(`Message: ${err.message}`);
    
    // Si la base de données n'existe pas, essayer de la créer
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.log("Tentative de création de la base de données...");
      const tempDb = mysql.createConnection({
        host: config.host,
        user: config.user,
        password: config.password
      });
      
      tempDb.query(`CREATE DATABASE IF NOT EXISTS ${config.database}`, (createErr) => {
        if (createErr) {
          console.error("Impossible de créer la base de données :", createErr);
          process.exit(1);
        }
        console.log(`Base de données '${config.database}' créée avec succès.`);
        console.log("Veuillez importer le schéma avec la commande :");
        console.log(`mysql -u ${config.user} -p ${config.database} < database.sql`);
        process.exit(0);
      });
    } else {
      process.exit(1);
    }
  } else {
    console.log("✅ Connecté avec succès à la base de données MySQL");
  }
});

// Gestion des erreurs après la connexion initiale
db.on('error', (err) => {
  console.error('Erreur MySQL :', err);
  
  // Si la connexion est perdue, tenter de se reconnecter
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Tentative de reconnexion à la base de données...');
    db.connect();
  } else {
    throw err;
  }
});

module.exports = db;