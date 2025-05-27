const fs = require("fs");
const coap = require("coap");
const {glob} = require("glob");

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

async function sendCoapRequest(body, fognodeUrl, method, pathname) {
  const match = fognodeUrl.match(/^coap:\/\/([^:/]+)(?::(\d+))?/);

  const ip = match[1]; // "192.168.1.12"
  const port = match[2] ? parseInt(match[2]) : 5683; // 5683 if not specified

  return sendCoapRequestAsync(
    {
      host: ip,
      port,
      method,
      confirmable: true,
      pathname,
    },
    JSON.stringify(body)
  );
}

/**
 * Sends a CoAP request and returns a Promise that resolves with the response
 * or rejects on error/timeout.
 *
 * @param {object} options - Options for coap.request (host, port, method, etc.)
 * @param {Buffer|string} [payload] - Optional payload to send with the request.
 * @returns {Promise<object>} A Promise resolving with the CoAP response object (res).
 */
function sendCoapRequestAsync(options, payload) {
  coap.ackTimeout = 1000;
  return new Promise((resolve, reject) => {
    const request = coap.request(options);

    // Handle successful response
    request.on("response", (res) => {
      // Optional: Automatically read the payload into the response object
      // CoAP chunks payloads, so we need to accumulate them.
      let accumulatedPayload = Buffer.alloc(0);
      res.on("data", (chunk) => {
        accumulatedPayload = Buffer.concat([accumulatedPayload, chunk]);
      });
      res.on("end", () => {
        res.payload = accumulatedPayload; // Attach accumulated payload to the response object
        resolve(res); // Resolve the promise with the full response object
      });
      res.on("error", (err) => {
        // Handle errors during response stream reading
        reject(new Error(`Error reading response stream: ${err.message}`));
      });
    });

    // Handle request errors (e.g., network issues)
    request.on("error", (err) => {
      reject(new Error(`CoAP request error: ${err.message}`));
    });

    // Handle request timeout (important for confirmable messages)
    if (options.confirmable) {
      request.on("timeout", (err) => {
        // Note: The 'err' argument might not always be provided by coap.js on timeout
        reject(
          new Error(
            `CoAP request timed out after ${
              request.options.ackTimeout *
              request.options.ackRandomFactor *
              (1 << request.options.retransmit)
            }s`
          )
        );
      });
    }

    // Write payload if provided
    if (payload) {
      request.write(payload);
    }

    // Send the request
    request.end();
  });
}

module.exports = { getAuthorities, sendCoapRequest };
