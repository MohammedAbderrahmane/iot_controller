const express = require("express");
const cors = require("cors");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const coap = require("coap");
const util = require("./utils.js");

require("dotenv").config();
const initializeDatabase = require("./mysql-config.js");

const PORT = process.env.PORT;

var db = null;
const initDb = async () => (db = await initializeDatabase());
initDb();

// ---
const app = express();
app.use(express.json());
app.use(cors());
// ---
var iotObjects = [];
var authorities = [];
var fogNodes = [];

authorities = util.getAuthorities();

// ---
const admin = () => JSON.parse(fs.readFileSync(`admin.json`).toString());

app.post("/api/admin/login", async (request, response) => {
  const { username, password, rememberMe } = request.body;

  if (!username || !password || !username.length || !password.length)
    return response.status(401).send({ message: "Invalid credentials" });

  if (
    !(username === admin().username) ||
    !bcrypt.compareSync(password, admin().password)
  )
    return response.status(401).send({ message: "Invalid credentials" });

  const authToken = jwt.sign({ username }, process.env.JWT_SECRET, {
    expiresIn: rememberMe ? "7d" : "30m",
  });

  response.status(200).send(authToken);
});

app.get("/api/admin/verify", async (request, response) => {
  const authorization = request.get("authorization");

  if (!authorization)
    return response.status(401).send({ message: "no authorization provided" });

  const authToken = authorization.replace("Bearer ", "");
  try {
    jwt.verify(authToken, process.env.JWT_SECRET);
  } catch (error) {
    if (error.expiredAt)
      return response.status(401).send({ message: "session expired" });
    return response.status(401).send({ message: "wrong credentials" });
  }

  response.status(200).end();
});

// ---
app.post("/api/fognodes/", async (request, response) => {
  const { port, id, name, description } = request.body;
  fogNodes.push({
    port,
    id,
    name,
    description,
    ipAddress: request.ip.replace("::ffff:", ""),
  });
  console.log("\n--- New fog node registred ---\n");
  response.status(201).end();
});

app.get("/api/fognodes/", async (request, response) => {
  response.status(200).json(fogNodes);
});

app.get("/api/fognodes/objects", async (request, response) => {
  const nodes = [...fogNodes];
  for (const node of nodes) {
    node.iotObjects = iotObjects.filter((iot) => iot.nodeId == node.id);
  }
  response.status(200).json(nodes);
});

app.get("/api/fognodes/:id", async (request, response) => {
  const { id } = request.params;
  const node = fogNodes.filter((e) => e.id == id);
  const objects = iotObjects.filter((e) => e.nodeId == id);
  if (node.length == 0) return response.status(200).json({});
  response.status(200).json({ ...node[0], iotObjects: objects });
});

app.delete("/api/fognodes/:id", async (request, response) => {
  const { id } = request.params;
  fogNodes = fogNodes.filter((e) => e.id != id);
  response.status(204).end();
});

// ---
app.get("/api/auths", async (request, response) => {
  response.json(authorities);
});

app.get("/api/auths/info", async (request, response) => {
  response.json(authorities.map((auth) => ({ ...auth, Pk: undefined })));
});

app.get("/api/auths/attributes", async (request, response) => {
  const attributes = {};
  for (const auth of authorities) {
    attributes[auth["ID"]] = auth.Pk.attributes;
  }
  response.json(attributes);
});

app.post("/api/auths/", async (request, response) => {
  const { ID, Pk, port } = request.body;

  const newAuth = { ID, Pk, port, host: request.ip.replace("::ffff:", "") };

  fs.writeFileSync(
    `auths/auth_${ID}_keys.json`,
    JSON.stringify(newAuth, null, 2)
  );

  console.log(`\n--- authority ${ID} is registred ---\n`);

  response.status(200).end();
});

// ---
app.get("/api/objects", async (request, response) => {
  response.json(iotObjects);
});

app.post("/api/objects", async (request, response) => {
  const { nodeId, name, description, accessPolicy } = request.body;
  const iotObject = {
    nodeId,
    name,
    description,
    accessPolicy,
  };

  const fogNode = fogNodes.filter((e) => e.id == nodeId)[0];

  try {
    // FIXME : the coap message cant be confirmed if it arrived
    await util.registerIoTObjectOnFognode(iotObject, fogNode);
  } catch (error) {
    console.log(error);
    return response
      .status(500)
      .send({ message: "object can't be registred on fog node" });
  }
  iotObjects.push(iotObject);

  response.status(201).end();
});

app.put("/api/objects/:name", async (request, response) => {
  const { name } = request.params;
  const { description, accessPolicy, ipAddress, port } = request.body;

  for (const iotObject of iotObjects) {
    if (iotObject.name == name) {
      iotObject.description = description || iotObject.description;
      iotObject.accessPolicy = accessPolicy || iotObject.accessPolicy;
      iotObject.ipAddress = ipAddress || iotObject.ipAddress;
      iotObject.port = port || iotObject.port;

      const fogNode = fogNodes.filter((e) => e.id == iotObject.nodeId)[0];

      try {
        // FIXME : the coap message cant be confirmed if it arrived
        await util.registerIoTObjectOnFognode(
          {
            description: iotObject.description,
            accessPolicy: iotObject.accessPolicy,
            name: iotObject.name,
          },
          fogNode
        );
      } catch (error) {
        console.log(error);
        return response
          .status(500)
          .send({ message: "object can't be registred on fog node" });
      }
    }
  }
  response.status(200).end();
});

app.delete("/api/objects/:name", async (request, response) => {
  const { name } = request.params;

  iotObjects = iotObjects.filter((e) => e.name != name);
  response.status(204).end();
});

app.delete("/api/objects/:name", async (request, response) => {
  console.log(request.params);
  const { name } = request.params;

  const coapRequest = coap.request({
    hostname: "192.168.1.100",
    pathname: "/objects/all",
    method: "PUT",
  });
  coapRequest.write(name);

  coapRequest
    .on("response", (res) => {
      console.log("received response");
    })
    .end();

  response.status(200).end();

  coap
    .request({
      hostname: "192.168.1.100",
      pathname: "/objects/all",
      options: {
        Accept: "application/json",
      },
    })
    .on("response", (res) => {
      iotObjects = JSON.parse(res.payload.toString());
      for (var iot of iotObjects) {
        iot.encrypted_token = undefined;
      }
      console.log("iot list received ");
    })
    .end();
});

// ---

app.post("/api/users/new", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "username, password are required." });
  }

  try {
    hashedPassword = bcrypt.hashSync(password, 10);
  } catch (err) {
    console.error("Password hashing failed:", err);
    return res.status(400).json({ error: "Failed to process password." });
  }

  const results = await db
    .promise()
    .execute(
      "INSERT INTO User (username,password) VALUES (?,?);",
      [username, hashedPassword]
    );

  if (results[0].affectedRows == 1) {
    return res.status(200).end();
  }
  res.status(500).send({ message: "failed to insert user" });
});

app.post("/api/users/login", async (request, response) => {
  const { username, password, rememberMe } = request.body;

  if (!username || !password || !username.length || !password.length)
    return response.status(401).send({ message: "Invalid credentials" });

  const [results] = await db
    .promise()
    .query("SELECT * FROM User WHERE username = ? ;", [username]);

  if (results.length === 0)
    return response.status(401).json({ message: "Identifiants invalides" });

  const user = results[0];

  if (
    !(username === user.username) ||
    !bcrypt.compareSync(password, user.password)
  )
    return response.status(401).send({ message: "Invalid credentials" });

  const authToken = jwt.sign({ username }, process.env.JWT_SECRET, {
    expiresIn: rememberMe ? "7d" : "30m",
  });

  response.status(200).send(authToken);
});

app.get("/api/users/verify", async (request, response) => {
  const authorization = request.get("authorization");

  if (!authorization)
    return response.status(401).send({ message: "no authorization provided" });

  const authToken = authorization.replace("Bearer ", "");
  try {
    jwt.verify(authToken, process.env.JWT_SECRET);
  } catch (error) {
    if (error.expiredAt)
      return response.status(401).send({ message: "session expired" });
    return response.status(401).send({ message: "wrong credentials" });
  }

  response.status(200).end();
});

app.get("/api/users", async (req, res) => {
  const [rows] = await db.promise().execute("SELECT username FROM User");

  const users = Object.entries(rows).map((user) => user[1]);

  res.status(200).json(users);
});

app.delete("/api/users/:username", async (req, res) => {
  const { username } = req.params;

  const results = await db
    .promise()
    .execute("DELETE FROM User WHERE username = ?", [username]);

  if (results[0].affectedRows > 0) {
    return res.status(200).end();
  }
  res.status(500).send({ message: "failed to delete user" });
});

// ---

app.listen(PORT, () => {
  console.log(`Admin server running on : http://localhost:${PORT}/`);
  console.log("\t" + "POST" + "\t" + "/api/admin/login");
  console.log("\t" + "GET" + "\t" + "/api/admin/verify");
  console.log("");
  console.log("\t" + "GET" + "\t" + "/api/fognodes/");
  console.log("\t" + "GET" + "\t" + "/api/fognodes/:id");
  console.log("\t" + "POST" + "\t" + "/api/fognodes/");
  console.log("\t" + "DELETE" + "\t" + "/api/fognodes/");
  console.log("");
  console.log("\t" + "GET" + "\t" + "/api/auths");
  console.log("\t" + "GET" + "\t" + "/api/auths/info");
  console.log("\t" + "GET" + "\t" + "/api/auths/attributes");
  console.log("");
  console.log("\t" + "GET" + "\t" + "/api/objetcs/");
  console.log("\t" + "POST" + "\t" + "/api/objetcs/"); // MUST NOTIFY FOG NODE
  console.log("\t" + "PUT" + "\t" + "/api/objects/:name"); // MUST NOTIFY FOG NODE
  console.log("\t" + "DELETE" + "\t" + "/api/objects/:name"); // MUST NOTIFY FOG NODE
  console.log("");
  console.log("\t" + "GET" + "\t" + "/api/users"); // MUST NOTIFY FOG NODE
  console.log("\t" + "POST" + "\t" + "/api/users/new"); // MUST NOTIFY FOG NODE
  console.log("\t" + "POST" + "\t" + "/api/users/login"); // MUST NOTIFY FOG NODE
  console.log("\t" + "GET" + "\t" + "/api/users/verify"); // MUST NOTIFY FOG NODE
  console.log("\t" + "DELETE" + "\t" + "/api/users/:username"); // MUST NOTIFY FOG NODE
  console.log("");
});
