const mysql = require("mysql2");

// --- CRUD Operations ---

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "users_db",
};

async function createIoTObject(iotObjectData) {
  console.log(iotObjectData);

  const connection = mysql.createConnection(dbConfig);
  try {
    const sql = `
            INSERT INTO IoTObject (id, fog_node, name, description, accessPolicy, url, date_entering)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
    const values = [
      iotObjectData.id,
      iotObjectData.fog_node,
      iotObjectData.name,
      iotObjectData.description,
      iotObjectData.accessPolicy,
      iotObjectData.url || null,
      iotObjectData.date_entering || null,
    ];

    const results = await connection.promise().execute(sql, values);

    return results; // Return results if needed by the caller
  } catch (error) {
    console.error("Error creating node:", error);
    throw error; // Re-throw the error for the caller to handle
  }
}

async function updateIoTObject(iotObjectData) {
  const connection = mysql.createConnection(dbConfig);
  try {
    const fieldsToUpdate = [];
    const values = [];

    if (iotObjectData.description !== undefined) {
      fieldsToUpdate.push("description = ?");
      values.push(iotObjectData.description);
    }
    if (iotObjectData.accessPolicy !== undefined) {
      fieldsToUpdate.push("accessPolicy = ?");
      values.push(iotObjectData.accessPolicy);
    }
    if (iotObjectData.url !== undefined) {
      fieldsToUpdate.push("url = ?");
      values.push(iotObjectData.url || null);
    }
    if (iotObjectData.date_entering !== undefined) {
      fieldsToUpdate.push("date_entering = ?");
      values.push(iotObjectData.date_entering || null);
    }

    if (fieldsToUpdate.length === 0) {
      throw new Error("No fields provided for update");
    }

    // Add the ID at the end for the WHERE clause
    values.push(iotObjectData.name);

    const sql = `
      UPDATE IoTObject 
      SET ${fieldsToUpdate.join(", ")}
      WHERE name = ?
    `;

    const results = await connection.promise().execute(sql, values);
    return results;
  } catch (error) {
    console.error("Error updating IoT object:", error);
    throw error; // Re-throw the error for the caller to handle
  }
}

async function readIoTObjects(objectName, fognodeId) {
  const connection = mysql.createConnection(dbConfig);
  try {
    const conditions = [];
    const values = [];

    if (objectName) {
      conditions.push("name = ?");
      values.push(objectName);
    }

    if (fognodeId) {
      conditions.push("fog_node = ?");
      values.push(fognodeId);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `SELECT * FROM IoTObject ${whereClause}`;

    const [results] = await connection.promise().execute(sql, values);
    return results;
  } catch (error) {
    console.error("Error creating node:", error);
    throw error; // Re-throw the error for the caller to handle
  }
}

async function deleteIoTObject(objectName) {
  const connection = mysql.createConnection(dbConfig);
  try {
    const sql = `DELETE FROM IoTObject WHERE name = ?`;

    const [results] = await connection.promise().execute(sql, [objectName]);
    return results;
  } catch (error) {
    console.error("Error deleting IoT object:", error);
    throw error; // Re-throw the error for the caller to handle
  }
}

module.exports = {
  createIoTObject,
  updateIoTObject,
  readIoTObjects,
  deleteIoTObject,
};
