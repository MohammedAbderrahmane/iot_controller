const express = require("express");
const fs = require("fs");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const { execSync } = require("child_process");
const db = require("./mysql-config.js");
const bcrypt = require("bcrypt");

const MAABE_PUBLIC_PARAMETERS_PATH = "keys/maabe_public_parameters.json";
const AUTHORITY_PATH = "keys/authority.json";
const PORT = 2000;

const GO_CREATE_AUTHORITY_SCRIPT = "maabe/create_authority";
const GO_ADD_ATTRIBUTE_SCRIPT = "maabe/add_attribute";
const GO_RENEW_ATTRIBUTE_SCRIPT = "maabe/renew_attribute";
const C_SEND_AUTH_PK_SCRIPT = "maabe/send_auth_pk";

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

app.post("/api/authority/send_public_keys", (req, res) => {
  const PkJson = JSON.stringify(authority.Pk);

  const FOG_NODE_IP_ADDRESS = "192.168.1.100";
  const FOG_NODE_PORT = "5683";

  const command = `${C_SEND_AUTH_PK_SCRIPT} ${FOG_NODE_IP_ADDRESS} ${FOG_NODE_PORT} ${PkJson}`;
  try {
    execSync(command);
  } catch (error) {
    return response
      .status(400)
      .json({ message: "cant send authority public key : " + error });
  }
});
// app.delete("/api/authority/attribute", (req, res) => {}); // NOT SURE IF THIS SAFE

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

app.post("/api/user/generate_keys", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return response.status(400).json({ message: "Identifiants incomplets" });

  const [results] = await db
    .promise()
    .query("SELECT * FROM User WHERE username = ? ;", [username]);

  if (results.length === 0)
    return response.status(401).json({ message: "Identifiants invalides" });

  const user = results[0];
  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword)
    return response.status(401).json({ message: "Identifiants invalides" });

  const command = `${GO_GENERATE_KEYS_SCRIPT} ${username} ${user.attributes.replaceAll(
    "/",
    " "
  )}`;
  try {
    const output = execSync(command);

    console.log(output);

    const data = fs.readFileSync(AUTHORITY_PATH);
    authority = JSON.parse(data);

    res.json(JSON.parse(output.toString()));
  } catch (error) {
    return res
      .status(400)
      .send({ message: "failed to generete keys : " + error });
  }
});

// app.delete("/api/user/delete", (req, res) => {});
// app.delete("/api/user/update", (req, res) => {});
// app.delete("/api/user/add_attributes", (req, res) => {});
// app.delete("/api/user/remove_attributes", (req, res) => {});
// app.delete("/api/user/re_password", (req, res) => {});

app.post("/api/user/new", async (req, res) => {
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

app.get("/api/users/all", async (req, res) => {
  const [rows] = await db
    .promise()
    .execute("SELECT username,attributes FROM User");

  const users = Object.entries(rows).map((user) => user[1]);

  res.status(200).json(users);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
