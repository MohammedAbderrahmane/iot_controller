const express = require("express");
const router = express.Router();
const CRUDFogNode = require("../crud/fognode_crud.js");
const coap = require("coap");
const util = require("../utils.js");
const crypto = require("crypto");

const TimeStamp = (date) =>
  `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

router.get("/", async (request, response) => {
  const fogNodes = await CRUDFogNode.readFogNodes();
  var iotObjects = [];
  for (const fogNode of fogNodes) {
    try {
      iotObjects.push(
        ...JSON.parse(await util.fetchCoapJson(fogNode.url + "/objects", 1000))
      );

      for (const iot of iotObjects) {
        iot.nodeId = fogNode.id;
      }
    } catch (error) {
      console.log(`fogNode ${fogNode.name} not connected: ${error}`);
    }
  }

  response.status(200).json(iotObjects);
});

router.post("/", async (request, response) => {
  const { nodeId, name, description, accessPolicy } = request.body;

  const id = crypto
    .randomBytes(16)
    .toString("base64")
    .replace(/\+/g, "-") // Replace '+' with '-'
    .replace(/\//g, "_") // Replace '/' with '_'
    .replace(/=+$/, "");

  const iotObject = {
    fog_node: nodeId,
    id,
    name,
    description,
    accessPolicy,
  };
  const [fogNode] = await CRUDFogNode.readFogNodes(nodeId);
  try {
    await util.fetchCoapJson(
      fogNode.url + "/objects",
      3000,
      "POST",
      JSON.stringify(iotObject)
    );
  } catch (error) {
    console.log(error);
    return response
      .status(500)
      .send({ message: "object can't be registred on fog node" });
  }

  response.status(201).end();
});

router.put("/:name", async (request, response) => {
  const { name } = request.params;
  const { description, accessPolicy, nodeId } = request.body;

  const updatedIoTObject = {
    name,
    description,
    access_policy: accessPolicy,
  };
  const [fogNode] = await CRUDFogNode.readFogNodes(nodeId);
  try {
    await util.fetchCoapJson(
      fogNode.url + "/objects",
      3000,
      "PUT",
      JSON.stringify({
        action: "UPDATE",
        objectName: name,
        data: updatedIoTObject,
      })
    );
  } catch (error) {
    console.log(error);
    return response
      .status(500)
      .send({ message: "object can't be updated on fog node" });
  }

  response.status(200).end();
});

router.delete("/:name", async (request, response) => {
  const { name } = request.params;
  const { nodeId } = request.body;

  const [fogNode] = await CRUDFogNode.readFogNodes(nodeId);
  try {
    await util.fetchCoapJson(
      fogNode.url + "/objects",
      3000,
      "PUT",
      JSON.stringify({ action: "DELETE", objectName: name })
    );
  } catch (error) {
    console.log(error);
    return response
      .status(500)
      .send({ message: "object can't be deleted on fog node" });
  }

  response.status(204).end();
});

module.exports = router;
