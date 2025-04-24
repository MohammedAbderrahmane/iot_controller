const express = require("express");
const cors = require("cors");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const coap = require("coap");

require("dotenv").config();

const PORT = 2210;
// ---
const app = express();
app.use(express.json());
app.use(cors());
// ---
var iotObjects = [];
var attributes = [];

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


  coap
  .request({
    hostname: "192.168.1.100",
    pathname: "/attributes",
    options: {
      Accept: "application/json",
    },
  })
  .on("response", (res) => {
    attributes = JSON.parse(res.payload.toString());
  })
  .end();
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

app.get("/api/objects", async (request, response) => {
  response.json({iotObjects,attributes});
});

app.get("/api/objects/update", async (request, response) => {
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
      console.log("iot list updated");
    })
    .end();
  response.status(200).end();
});

app.post("/api/objects", async (request, response) => {
  const { name,description, accessPolicy } = request.body;
  const coapPayload = { name,description, accessPolicy };

  const coapRequest = coap.request({
    hostname: "192.168.1.100",
    pathname: "/objects/all",
    method: "POST",
  });
  coapRequest.write(JSON.stringify(coapPayload));

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
      console.log("iot list updated ");
    })
    .end();
});

app.put("/api/objects", async (request, response) => {}); // too complex

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
