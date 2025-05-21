const mysql = require("mysql2");

// --- CRUD Operations ---

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "users_db",
};

async function createFogNode(nodeData) {
  const connection = mysql.createConnection(dbConfig);
  try {
    const sql = `
            INSERT INTO FogNode (id, name, description, url, date_entering)
            VALUES (?, ?, ?, ?, ?)
        `;
    const values = [
      nodeData.id,
      nodeData.name,
      nodeData.description,
      nodeData.url,
      nodeData.date_entering,
    ];

    const results = await connection.promise().execute(sql, values);

    return results; // Return results if needed by the caller
  } catch (error) {
    console.error("Error creating node:", error);
    throw error; // Re-throw the error for the caller to handle
  }
}

async function readFogNodes(nodeId) {
  const connection = mysql.createConnection(dbConfig);
  try {
    const sql = !!nodeId
      ? `SELECT * FROM FogNode WHERE id = ?`
      : `SELECT * FROM FogNode`;

    const values = nodeId ? [nodeId] : [];

    const [results] = await connection.promise().execute(sql, values);
    return results;
  } catch (error) {
    console.error("Error creating node:", error);
    throw error; // Re-throw the error for the caller to handle
  }
}


async function updateFogNode(nodeId, nodeData) {
  const connection = mysql.createConnection(dbConfig);
  
  try {
    const updates = [];
    const values = [];

    if (nodeData.name !== undefined) {
      updates.push("name = ?");
      values.push(nodeData.name);
    }
    if (nodeData.description !== undefined) {
      updates.push("description = ?");
      values.push(nodeData.description);
    }
    if (nodeData.port !== undefined) {
      updates.push("port = ?");
      values.push(nodeData.port);
    }
    if (nodeData.ip_address !== undefined) {
      updates.push("ip_address = ?");
      values.push(nodeData.ip_address);
    }
    if (nodeData.date_entering !== undefined) {
      updates.push("date_entering = ?");
      values.push(nodeData.date_entering);
    }

    if (updates.length === 0) {
      return { message: "No fields to update." };
    }

    const sql = `UPDATE FogNode SET ${updates.join(', ')} WHERE id = ?`;
    values.push(nodeId);

    const [results] = await connection.promise().execute(sql, values);
    return results;

  } catch (error) {
    console.error("Error updating node:", error);
    throw error;
  }
}

async function deleteFogNode(id) {
  const connection = mysql.createConnection(dbConfig);
  try {
    const sql = `DELETE FROM FogNode WHERE id = ?`;
    const values = [id];

    const results = await connection.promise().execute(sql, values);
    
    return results[0]; // Return results (contains affectedRows etc)
  } catch (error) {
    console.error("Error deleting node:", error);
    throw error; // Re-throw for error handling middleware
  }
}

module.exports = {
  createFogNode,
  readFogNodes,
  updateFogNode,
  deleteFogNode
};
