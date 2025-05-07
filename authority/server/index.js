require("dotenv").config();

const express = require("express");
const fs = require("fs");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const { execSync } = require("child_process");
const db = require("./mysql-config.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const MAABE_PUBLIC_PARAMETERS_PATH = "keys/maabe_public_parameters.json";
const AUTHORITY_PATH = "keys/authority.json";
const PORT = process.env.PORT || 2000;

const GO_CREATE_AUTHORITY_SCRIPT = "maabe/create_authority";
const GO_ADD_ATTRIBUTE_SCRIPT = "maabe/add_attribute";
const GO_RENEW_ATTRIBUTE_SCRIPT = "maabe/renew_attribute";
const GO_GENERATE_KEYS_SCRIPT = "maabe/generate_keys";

// ---------
const app = express();

app.use(express.json());
app.use(cors());
app.use(fileUpload());

var authority = undefined;
var maabePublicParameter = undefined;

if (fs.existsSync(MAABE_PUBLIC_PARAMETERS_PATH)) {
  const data = fs.readFileSync(MAABE_PUBLIC_PARAMETERS_PATH);
  maabePublicParameter = JSON.parse(data);
} else {
  console.log("There is no public parameters ! import one");
}
if (fs.existsSync(AUTHORITY_PATH)) {
  const data = fs.readFileSync(AUTHORITY_PATH);
  authority = JSON.parse(data);
} else {
  console.log("There authority configured ! import or create new one");
}

app.post("/api/public_parameter/import", (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send({ message: "No file uploaded" });
  }

  try {
    const file = req.files.file;
    const fileContent = file.data.toString("utf8");
    const jsonData = JSON.parse(fileContent);

    if (!jsonData.P || !jsonData.G2 || !jsonData.Gt || !jsonData.G1) {
      return res
        .status(400)
        .send({ message: "Invalid Maabe public parameter" });
    }

    fs.writeFileSync(MAABE_PUBLIC_PARAMETERS_PATH, fileContent);

    const data = fs.readFileSync(MAABE_PUBLIC_PARAMETERS_PATH);
    maabePublicParameter = JSON.parse(data);

    res.send({ message: "File saved successfully" });
  } catch (err) {
    res.status(400).send({
      message:
        err instanceof SyntaxError
          ? "Invalid JSON file"
          : "Can't import parameters",
    });
  }
});

app.post("/api/authority/import", (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send({ message: "No file uploaded" });
  }

  try {
    const file = req.files.file;
    const fileContent = file.data.toString("utf8");
    const jsonData = JSON.parse(fileContent);

    if (!jsonData.ID || !jsonData.Pk || !jsonData.Sk) {
      return res.status(400).send({ message: "Invalid authority" });
    }

    fs.writeFileSync(AUTHORITY_PATH, fileContent);

    const data = fs.readFileSync(AUTHORITY_PATH);
    authority = JSON.parse(data);

    res.send({ message: "File saved successfully" });
  } catch (err) {
    res.status(400).send({
      message:
        err instanceof SyntaxError
          ? "Invalid JSON file"
          : "Can't import authority",
    });
  }
});

app.post("/api/authority/new", (req, res) => {
  const { authorityName, attributes } = req.body;

  const command = `${GO_CREATE_AUTHORITY_SCRIPT} ${authorityName} ${attributes.join(
    " "
  )}`;
  try {
    execSync(command);

    const data = fs.readFileSync(AUTHORITY_PATH);
    authority = JSON.parse(data);

    res.send({ message: "authority created successfully" });
  } catch (error) {
    return res.status(400).send({ message: "failed to create authority" });
  }
});

app.get("/api/authority/", (req, res) => {
  res.status(200).json({
    maabePublicParameter: !!maabePublicParameter,
    authority: !!authority ? { ...authority, Sk: undefined } : undefined,
  });
});

app.get("/api/authority/send", async (req, res) => {
  try {
    await axios.post(`${process.env.SERVER_URL}/api/auths/`, {
      ...authority,
      Sk: undefined,
      port:`${PORT}`,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "failed to send authority to server" });
  }

  res.status(200).end();
});

app.post("/api/authority/new_attribute", (req, res) => {
  const { attribute } = req.body;

  const command = `${GO_ADD_ATTRIBUTE_SCRIPT} ${attribute}`;
  try {
    execSync(command);

    const data = fs.readFileSync(AUTHORITY_PATH);
    authority = JSON.parse(data);

    res.send({ message: "attribute added successfully" });
  } catch (error) {
    return res.status(400).send({ message: "failed to add attribute" });
  }
});

app.put("/api/authority/renew_attribute", (req, res) => {
  const { attribute } = req.body;

  const command = `${GO_RENEW_ATTRIBUTE_SCRIPT} ${attribute}`;
  try {
    execSync(command);

    const data = fs.readFileSync(AUTHORITY_PATH);
    authority = JSON.parse(data);

    res.send({ message: "attribute renewed successfully" });
  } catch (error) {
    return res.status(400).send({ message: "failed to renew attribute" });
  }
});

app.delete("/api/authority/:attribute", (req, res) => {
  const { attribute } = req.params;
  try {
    const data = fs.readFileSync(AUTHORITY_PATH);
    const auth = JSON.parse(data);

    auth.Pk.attributes = auth.Pk.attributes.filter((e) => e != attribute);
    auth.Pk.EggToAlpha[attribute] = undefined;
    auth.Pk.GToY[attribute] = undefined;
    auth.Sk.attributes = auth.Pk.attributes.filter((e) => e != attribute);
    auth.Sk.Alpha[attribute] = undefined;
    auth.Sk.Y[attribute] = undefined;

    fs.writeFileSync(AUTHORITY_PATH, JSON.stringify(auth, null, 2));
    authority = auth;
    return res.status(204).end();
  } catch (error) {
    console.log(error);
    return res.status(400).send({ message: "failed to delete attribute" });
  }
});

app.post("/api/users/generate_keys", async (req, res) => {
  const { username } = req.body;

  if (!username)
    return res.status(400).json({ message: "Identifiants incomplets" });

  const [results] = await db
    .promise()
    .query("SELECT * FROM User WHERE username = ? ;", [username]);

  if (results.length === 0)
    return res.status(401).json({ message: "Identifiants invalides" });

  const user = results[0];
  // const validPassword = await bcrypt.compare(password, user.password);

  // if (!validPassword)
  //   return res.status(401).json({ message: "Identifiants invalides" });

  const command = `${GO_GENERATE_KEYS_SCRIPT} ${username} ${user.attributes.replaceAll(
    "/",
    " "
  )}`;
  try {
    const output = execSync(command);

    res.json(JSON.parse(output.toString()));
  } catch (error) {
    return res
      .status(400)
      .json({ message: "failed to generete keys : " + error });
  }
});

// app.delete("/api/user/re_password", (req, res) => {});

app.post("/api/users/new", async (req, res) => {
  const { username, password, attributes } = req.body;

  if (!username || !password || !attributes || !attributes.length) {
    return res
      .status(400)
      .json({ error: "username, password, and attributes are required." });
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
      "INSERT INTO User (username,password,attributes) VALUES (?,?,?);",
      [username, hashedPassword, attributes.join("/")]
    );

  if (results[0].affectedRows == 1) {
    return res.status(200).end();
  }
  res.status(500).send({ message: "failed to insert user" });
});

app.delete("/api/users/:username/:attribute", async (req, res) => {
  const { username, attribute } = req.params;

  const [results1] = await db
    .promise()
    .query("SELECT * FROM User WHERE username = ? ;", [username]);

  const user = results1[0];

  const newAttributes = user.attributes
    .split("/")
    .filter((e) => e != attribute)
    .join("/");

  const results2 = await db
    .promise()
    .execute("UPDATE User SET attributes = ? WHERE username = ?", [
      newAttributes,
      username,
    ]);

  if (results2[0].affectedRows > 0) {
    return res.status(200).end();
  }
  res.status(500).send({ message: "failed to delete user" });
});

app.put("/api/users/:username", async (req, res) => {
  const { username } = req.params;
  const { attribute } = req.body;

  const [results1] = await db
    .promise()
    .query("SELECT * FROM User WHERE username = ? ;", [username]);

  const user = results1[0];

  const newAttributes = [...user.attributes.split("/"), attribute].join("/");

  const results2 = await db
    .promise()
    .execute("UPDATE User SET attributes = ? WHERE username = ?", [
      newAttributes,
      username,
    ]);

  if (results2[0].affectedRows > 0) {
    return res.status(200).end();
  }
  res.status(500).send({ message: "failed to delete user" });
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

app.get("/api/users/all", async (req, res) => {
  const [rows] = await db
    .promise()
    .execute("SELECT username,attributes FROM User");

  const users = Object.entries(rows).map((user) => user[1]);

  res.status(200).json(users);
});

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

app.listen(PORT, () => {
  console.log(`authority server running on : http://localhost:${PORT}/`);
  console.log("\t" + "POST" + "\t" + "/api/public_parameter/import");
  console.log("");
  console.log("\t" + "POST" + "\t" + "/api/authority/import");
  console.log("\t" + "POST" + "\t" + "/api/authority/new");
  console.log("\t" + "GET" + "\t" + "/api/authority/");
  console.log("\t" + "GET" + "\t" + "/api/authority/send");
  console.log("\t" + "POST" + "\t" + "/api/authority/new_attribute");
  console.log("\t" + "PUT" + "\t" + "/api/authority/renew_attribute");
  console.log("\t" + "DELETE" + "\t" + "/api/authority/:attribute");
  console.log("");
  console.log("\t" + "POST" + "\t" + "/api/users/generate_keys");
  console.log("\t" + "POST" + "\t" + "/api/users/new");
  console.log("\t" + "DELETE" + "\t" + "/api/users/:username/:attribute");
  console.log("\t" + "DELETE" + "\t" + "/api/users/:username");
  console.log("\t" + "PUT" + "\t" + "/api/users/:username");
  console.log("\t" + "GET" + "\t" + "/api/users/all");
  console.log("");
  console.log("\t" + "POST" + "\t" + "/api/admin/login");
  console.log("\t" + "GET" + "\t" + "/api/admin/verify");
});
