const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const router = express.Router();
const CRUDFogNode = require("../crud/fognode_crud.js");
const { fetchCoapJson } = require("../utils.js");

const TimeStamp = (date) =>
  `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

const CA_CERTIFICATE_PEM = fs.readFileSync("certificate/CA.crt", "utf-8");
const CA_CERTIFICATE = new crypto.X509Certificate(CA_CERTIFICATE_PEM);

router.post("/from-fog", async (request, response) => {
  const { port, id, name, description, certificate } = request.body;

  if (!certificate) {
    return response.status(401).send("No certificate provided");
  }

  try {
    console.log("Verefiying th fog node certificate");
    const cert = new crypto.X509Certificate(certificate);
    console.log("issuer:", cert.issuer);
    console.log("date of end validtion :", cert.validTo);

    const verified = cert.verify(CA_CERTIFICATE.publicKey); // Returns true if valid
    if (!verified) {
      return response.status(401).send("Invalid certificate");
    }
  } catch (err) {
    console.log(err);
    return response.status(400).send("Malformed certificate");
  }
  console.log("certificate validated");

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

// router.post("/from-admin", async (request, response) => {
//   const { port, id, name, description } = request.body;

//   try {
//     await CRUDFogNode.createFogNode({
//       id,
//       name,
//       description,
//       url: `coap://${request.ip.replace("::ffff:", "")}:${port}`,
//     });
//   } catch (error) {
//     console.log(error);
//     return response
//       .status(500)
//       .json({ message: "Faile to create fog node : " + error });
//   }

//   console.log("\n--- New fog node created by admin ---");
//   console.log(`\t${id}`);
//   console.log(`\t${name}`);
//   console.log(`\t${description}`);
//   console.log(`\tcoap://${request.ip.replace("::ffff:", "")}:${port}`);
//   console.log("------");
//   response.status(201).end();
// });

router.get("/", async (request, response) => {
  const fogNodes = await CRUDFogNode.readFogNodes();
   for (const fogNode of fogNodes) {
      try {
        await fetchCoapJson(fogNode.url+"/", 1000)
        fogNode.online = true
      } catch (error) {
        console.log(error);
      }
    }
  response.status(200).json(fogNodes);
});

router.get("/:id", async (request, response) => {
  const { id } = request.params;
  const fogNodes = await CRUDFogNode.readFogNodes(id);
  var iotObjects;

  try {
    // Await the result of our promise-based function.
    iotObjects = JSON.parse(
      await fetchCoapJson(fogNodes[0].url + "/objects", 3000)
    );
  } catch (error) {
    console.log(error);
    iotObjects = [];
  }

  const objects = response.status(200).json({
    ...fogNodes[0],
    iotObjects: fogNodes.length ? iotObjects : undefined,
  });
});

router.delete("/:id", async (request, response) => {
  const { id } = request.params;
  await CRUDFogNode.deleteFogNode(id);
  response.status(204).end();
});

module.exports = router;
