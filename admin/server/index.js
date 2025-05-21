const express = require("express");
const cors = require("cors");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const coap = require("coap");
const util = require("./utils.js");
const crypto = require("crypto");

require("dotenv").config();
const fogNodeRouter = require("./controller/fognode_router.js");
const iotObjectRouter = require("./controller/iot_object_router.js");
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

app.use("/api/fognodes",fogNodeRouter)
app.use("/api/objects",iotObjectRouter)


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

app.post("/api/users/new", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "username, password are required." });
  }

  const N = 16384; // CPU/memory cost factor (must be power of 2, > 1)
  const r = 8; // Block size factor
  const p = 1; // Parallelization factor
  const keylen = 64; // Desired length of the derived key in bytes

  const hashedPassword = crypto
    .scryptSync(password, username, keylen, { N, r, p })    
    .toString("base64");

  const results = await db
    .promise()
    .execute("INSERT INTO User (username,password) VALUES (?,?);", [
      username,
      hashedPassword,
    ]);

  if (results[0].affectedRows == 1) {
    return res.status(200).end();
  }
  res.status(500).send({ message: "failed to insert user" });
});

app.get("/api/users", async (req, res) => {
  const [users] = await db.promise().execute("SELECT username,date_creation FROM User");
  res.status(200).json(users);
});

app.get("/api/users/auth", async (req, res) => {
  const authority = req.get("authority");
  const [users] = await db
    .promise()
    .execute("SELECT username,password FROM User");

        const N = 16384; // CPU/memory cost factor (must be power of 2, > 1)
        const r = 8; // Block size factor
        const p = 1; // Parallelization factor
        const keylen = 64; // Desired length of the derived key in bytes

        
        users.forEach(    
          (user) =>{
            console.log(user.password , authority.trim());
            return (user.password = crypto  
              .scryptSync(user.password, authority, keylen, {
                N: N,
                r: r,
                p: p,
              })
              .toString("base64"))}
        );

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
  console.log("\t" + "GET" + "\t" + "/api/users/auth");
  console.log("\t" + "POST" + "\t" + "/api/users/new"); // MUST NOTIFY FOG NODE
  console.log("\t" + "DELETE" + "\t" + "/api/users/:username"); // MUST NOTIFY FOG NODE
  console.log("");
});
