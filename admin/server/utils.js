const fs = require("fs");
const coap = require("coap");
const { glob } = require("glob");

const AUTHORITIES_PATH = "./auths";

async function getAuthorities(params) {
  const auths = [];
  if (!fs.existsSync(AUTHORITIES_PATH)) {
    fs.mkdirSync(AUTHORITIES_PATH);
    return [];
  }

  const fileList = glob.sync(`${AUTHORITIES_PATH}/*`);
  for (const fileName of fileList) {
    const fileContent = fs.readFileSync(fileName);

    const authPk = JSON.parse(fileContent);

    auths.push(authPk);
  }
  return auths;
}

function fetchCoap(url, timeoutDuration, method, payload) {
  return new Promise((resolve, reject) => {
    const urlParts = url.match(/^coap:\/\/([^:/]+)(?::(\d+)(\/.*)?)/);

    if (!urlParts) {
      return reject({
        statusCode: 400,
        message: "Invalid CoAP URL format provided.",
      });
    }

    const params = {
      host: urlParts[1],
      port: urlParts[2],
      pathname: urlParts[3] || "/",
      method: method || "GET",
      timeout: timeoutDuration, // Key parameter for timeout handling
    };

    const req = coap.request(params);

    setTimeout(() => {
      reject({
        statusCode: 500, // Internal Server Error
        message: `An error occurred during the CoAP request: timeout`,
      });
    }, timeoutDuration);
    req.on("response", (res) => {
      const payloadString = res.payload.toString();
      resolve(payloadString);
    });

    req.on("error", (err) => {
      if (err.code === "ETIMEDOUT") {
        reject({
          statusCode: 408, // Request Timeout
          message: `Request to CoAP endpoint timed out after ${timeoutDuration}ms.`,
        });
      } else {
        reject({
          statusCode: 500, // Internal Server Error
          message: `An error occurred during the CoAP request: ${err.message}`,
        });
      }
    });

    if (payload) {
      req.write(payload);
    }

    req.end();
  });
}

module.exports = { getAuthorities, fetchCoapJson: fetchCoap };
