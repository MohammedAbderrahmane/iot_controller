const express = require("express");
const util = require("../utils.js");
const fs = require("fs");

const router = express.Router();

router.get("/", async (request, response) => {
  authorities = await util.getAuthorities();
  response.json(authorities);
});

router.get("/info", async (request, response) => {
  authorities = await util.getAuthorities();
  response.json(authorities.map((auth) => ({ ...auth, Pk: undefined })));
});

router.get("/attributes", async (request, response) => {
  const attributes = {};
  authorities = await util.getAuthorities();
  for (const auth of authorities) {
    attributes[auth["ID"]] = auth.Pk.attributes;
  }
  response.json(attributes);
});

router.post("/", async (request, response) => {
  const { ipAddress, port } = request.body;

  try {
    const responseOfAuthority = await fetch(
      `http://${ipAddress}:${port}/api/authority/`
    );
    const authority = (await responseOfAuthority.json()).authority;

    const newAuth = {
      ID: authority.ID,
      Pk: authority.Pk,
      port,
      host: ipAddress,
    };

    fs.writeFileSync(
      `auths/auth_${authority.ID}_keys.json`,
      JSON.stringify(newAuth, null, 2)
    );

    response.status(200).end();
  } catch (error) {
    response.status(500).json({ message: `Failed to get authority: ${error}` });
  }
});

module.exports = router;
