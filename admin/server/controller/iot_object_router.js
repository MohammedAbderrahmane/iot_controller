const express = require("express");
const router = express.Router();
const CRUDIoTObject = require("../crud/iot_object_crud.js");
const CRUDFogNode = require("../crud/fognode_crud.js");
const coap = require("coap");
const util = require("../utils.js");
const crypto = require("crypto");

const TimeStamp = (date) =>
  `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

router.get("/", async (request, response) => {
  const iotObjects = await CRUDIoTObject.readIoTObjects();
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
  await CRUDIoTObject.createIoTObject(iotObject);
  const fogNodes = await CRUDFogNode.readFogNodes(nodeId);

  try {
    // FIXME : the coap message cant be confirmed if it arrived
    await util.sendCoapRequest(iotObject, fogNodes[0].url, "POST", "/objects");
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
  const { description, accessPolicy, ipAddress, port } = request.body;

  const updatedIoTObject = {
    name,
    description,
    accessPolicy,
    url: `coap://${ipAddress}:${port}`,
    date_entering: ipAddress ? TimeStamp(new Date()) : undefined,
  };
  await CRUDIoTObject.updateIoTObject(updatedIoTObject);

  const object = await CRUDIoTObject.readIoTObjects(name);
  const fogNodes = await CRUDFogNode.readFogNodes(object[0].fog_node);

  try {
    // FIXME : the coap message cant be confirmed if it arrived
    if (!ipAddress) {
      await util.sendCoapRequest(
        {
          action: "UPDATE",
          objectName: name,
          data: {
            ...object[0],
            access_policy: object[0].accessPolicy,
            accessPolicy: undefined,
          },
        },
        fogNodes[0].url,
        "PUT",
        "/objects"
      );
    }
  } catch (error) {
    console.log(error);
    return response
      .status(500)
      .send({ message: "object can't be registred on fog node" });
  }

  response.status(200).end();
});

router.delete("/:name", async (request, response) => {
  const { name } = request.params;
  const object = await CRUDIoTObject.readIoTObjects(name);

  await CRUDIoTObject.deleteIoTObject(name);

  const fogNodes = await CRUDFogNode.readFogNodes(object.fog_node);
  try {
    // FIXME : the coap message cant be confirmed if it arrived
    await util.sendCoapRequest(
      { action: "DELETE", objectName: name },
      fogNodes[0].url,
      "PUT",
      "/objects"
    );
  } catch (error) {
    console.log(error);
    return response
      .status(500)
      .send({ message: "object can't be registred on fog node" });
  }

  response.status(204).end();
});

module.exports = router;
