const express = require("express");
const router = express.Router();
const CRUDFogNode = require("../crud/fognode_crud.js");
const CRUDIoTObject = require("../crud/iot_object_crud.js");

const TimeStamp = (date) =>
  `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

router.post("/from-fog", async (request, response) => {
  const { port, id, name, description } = request.body;

  try {
    const fogNodes = await CRUDFogNode.readFogNodes(id);
    if (fogNodes.length == 1) {
      await CRUDFogNode.updateFogNode(id, {
        name,
        description,
        url: `coap://${request.ip.replace("::ffff:", "")}:${port}`,
        date_entering: TimeStamp(new Date()),
      });
      console.log("\n--- Fog node reentered ---");
      console.log(`\t${id}`);
      console.log(`\t${name}`);
      console.log(`\t${description}`);
      console.log(`\tcoap://${request.ip.replace("::ffff:", "")}:${port}`);
      console.log("------");
      response.status(201).end();
      return response.status(201).end();
    }

    await CRUDFogNode.createFogNode({
      id,
      name,
      description,
      url: `coap://${request.ip.replace("::ffff:", "")}:${port}`,
      date_entering: TimeStamp(new Date()),
    });
  } catch (error) {
    console.log(error);
    return response
      .status(500)
      .json({ message: "Faile to create fog node : " + error });
  }

  console.log("\n--- New fog node registred ---");
  console.log(`\t${id}`);
  console.log(`\t${name}`);
  console.log(`\t${description}`);
  console.log(`\tcoap://${request.ip.replace("::ffff:", "")}:${port}`);
  console.log("------");
  response.status(201).end();
});

router.post("/from-admin", async (request, response) => {
  const { port, id, name, description } = request.body;

  try {
    await CRUDFogNode.createFogNode({
      id,
      name,
      description,
      url: `coap://${request.ip.replace("::ffff:", "")}:${port}`,
    });
  } catch (error) {
    console.log(error);
    return response
      .status(500)
      .json({ message: "Faile to create fog node : " + error });
  }

  console.log("\n--- New fog node created by admin ---");
  console.log(`\t${id}`);
  console.log(`\t${name}`);
  console.log(`\t${description}`);
  console.log(`\tcoap://${request.ip.replace("::ffff:", "")}:${port}`);
  console.log("------");
  response.status(201).end();
});

router.get("/", async (request, response) => {
  const fogNodes = await CRUDFogNode.readFogNodes();
  response.status(200).json(fogNodes);
});

router.get("/:id", async (request, response) => {
  const { id } = request.params;
  const fogNodes = await CRUDFogNode.readFogNodes(id);
  const iotObjects = await CRUDIoTObject.readIoTObjects(null, id);
  response.status(200).json({ ...fogNodes, iotObjects });
});

router.delete("/:id", async (request, response) => {
  const { id } = request.params;
  await CRUDFogNode.deleteFogNode(id);
  response.status(204).end();
});

module.exports = router;
