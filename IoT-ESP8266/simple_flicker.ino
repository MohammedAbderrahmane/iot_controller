#include <ESP8266WiFi.h>
#include <coap-simple.h>
#include <WiFiUdp.h>

const char *WIFI_SSID = "Tenda_2F0E40";
const char *PASSWORD = "lGofA94RBd";
const long INTERVAL = 1000;
const IPAddress FOG_NODE_IP_ADDRESS(192, 168, 1, 100);
const int FOG_NODE_PORT = 5683;
const char *ID = "object_1";

WiFiUDP udp;
Coap coap(udp);

unsigned long previousMillis = 0;
char *access_token;
bool ledState = false;

void setup_wifi() {
  WiFi.begin(WIFI_SSID, PASSWORD);
  Serial.print("\nConnecting to ");
  Serial.print(WIFI_SSID);
  Serial.println(" ...");

  int i = 0;
  while (WiFi.status() != WL_CONNECTED) {  // Wait for the Wi-Fi to connect
    delay(1000);
    Serial.print(++i);
    Serial.print(' ');
  }
  Serial.println("\nConnection established!");
  Serial.print("IP address : ");
  Serial.println(WiFi.localIP());
}

void callback_response(CoapPacket &packet, IPAddress ip, int port);

void callback_root(CoapPacket &packet, IPAddress ip, int port);
void callback_temputature(CoapPacket &packet, IPAddress ip, int port);
void callback_set_led(CoapPacket &packet, IPAddress ip, int port);

void setup_coap_server() {
  coap.server(callback_root, "");
  coap.server(callback_temperature, "temperature");
  coap.server(callback_set_led, "set_led");
  Serial.println("--- coap server is setup ---");
  Serial.println("\t/");
  Serial.println("\t/temperature");
  Serial.println("\t/set_led");
  Serial.println("");
}

void setup_coap_access_token() {
  const char *ID = "object_1";
  String ipStr = WiFi.localIP().toString();
  const char *IP_ADDRESS = ipStr.c_str();
  const char *PORT = "5683";
  const char *ACCESS_POLICY = "( tlemcen:prof OR tlemcen:etudiant )";

  const char *format =
    "{\"%s\":{\"ip_address\":\"%s\",\"port\":\"%s\","
    "\"access_policy\":\"%s\"}}";

  size_t buffer_size = snprintf(NULL, 0, format,
                                ID, IP_ADDRESS, PORT,
                                ACCESS_POLICY)
                       + 1;

  char *json_string = (char *)malloc(buffer_size);
  if (!json_string) {
    Serial.println("Memory allocation failed");
    return;
  }

  snprintf(json_string, buffer_size, format,
           ID, IP_ADDRESS, PORT,
           ACCESS_POLICY);


  coap.response(callback_response);

  Serial.println("access_token request sent and waiting for response ...");
}

void setup() {
  pinMode(D4, OUTPUT);
  Serial.begin(9600);

  // Use an unconnected analog pin to introduce randomness
  randomSeed(analogRead(A0));

  setup_wifi();

  setup_coap_access_token();
  setup_coap_server();
  coap.start();
}

bool requestOnce = true;
void loop() {
  if (requestOnce) {
    const char *ID = "object_1";
    uint8_t *id_uint8 = (uint8_t*) ID;
    size_t id_length = strlen(ID);

    coap.send(
      FOG_NODE_IP_ADDRESS,
      FOG_NODE_PORT,
      "register",
      COAP_CON,
      COAP_POST,            
      NULL, 0,
      id_uint8, id_length);         

    requestOnce = false;
  }
  unsigned long currentMillis = millis();

  // if (currentMillis - previousMillis >= INTERVAL) {
  //   previousMillis = currentMillis;
  //   ledState = !ledState;
  //   digitalWrite(D4, ledState);
  // }

  coap.loop();
}

void callback_response(CoapPacket &packet, IPAddress ip, int port) {
  Serial.println("access_token response arrived");
  if (packet.code != COAP_CREATED) {
    Serial.print("response with wrong type : ");
    Serial.println(packet.code);
    return;
  }

  access_token = strdup((char *)packet.payload);
  access_token[packet.payloadlen] = '\0';
  Serial.print("access_token : ");
  Serial.println(access_token);
}

void callback_root(CoapPacket &packet, IPAddress ip, int port) {
  Serial.print("/ : request from : ");
  Serial.print(ip);
  Serial.print(" port :");
  Serial.println(port);
  
  char *payload_string = (char *)malloc(packet.payloadlen + 1);
  if (payload_string == NULL) {
    Serial.println("Memory allocation failed!");
    const char *response_payload = "payload memory allocation failed";
    coap.sendResponse(
      ip,
      port,
      packet.messageid,
      response_payload,
      strlen(response_payload),
      COAP_INTERNAL_SERVER_ERROR,
      COAP_TEXT_PLAIN,
      packet.token,packet.tokenlen );
    return;
  }
  memcpy(payload_string, packet.payload, packet.payloadlen);
  payload_string[packet.payloadlen] = '\0';

  Serial.print("received payload : ");
  Serial.println(payload_string);

  if (strlen(payload_string) < strlen(access_token)) {
    const char *response_payload = "no access token provided";
    Serial.println("Error: Payload too short");
    coap.sendResponse(
      ip,
      port,
      packet.messageid,
      response_payload,
      strlen(response_payload),
      COAP_UNAUTHORIZED,
      COAP_TEXT_PLAIN,
 packet.token,packet.tokenlen );
    return;
  }
  if (!(memcmp(payload_string, access_token, strlen(access_token)) == 0)) {
    const char *response_payload = "wrong access token";
    Serial.println("Authentication failed!");
    coap.sendResponse(
      ip,
      port,
      packet.messageid,
      response_payload,
      strlen(response_payload),
      COAP_UNAUTHORIZED,
      COAP_TEXT_PLAIN,
 packet.token,packet.tokenlen );
    return;
  }

  const char *response_payload = "Hello from ESP8266!";
  coap.sendResponse(ip, port, packet.messageid, response_payload, strlen(response_payload));
  Serial.print("Resposne sent to !");
  Serial.println(ip);
}

void callback_temperature(CoapPacket &packet, IPAddress ip, int port) {
  Serial.print("/temperature : request from : ");
  Serial.print(ip);
  Serial.print(" port :");
  Serial.println(port);
  
  char *payload_string = (char *)malloc(packet.payloadlen + 1);
  if (payload_string == NULL) {
    Serial.println("Memory allocation failed!");
    const char *response_payload = "payload memory allocation failed";
    coap.sendResponse(
      ip,
      port,
      packet.messageid,
      response_payload,
      strlen(response_payload),
      COAP_INTERNAL_SERVER_ERROR,
      COAP_TEXT_PLAIN,
 packet.token,packet.tokenlen );
    return;
  }
  memcpy(payload_string, packet.payload, packet.payloadlen);
  payload_string[packet.payloadlen] = '\0';

  Serial.print("received payload : ");
  Serial.println(payload_string);

  if (strlen(payload_string) < strlen(access_token)) {
    const char *response_payload = "no access token provided";
    Serial.println("Error: Payload too short");
    coap.sendResponse(
      ip,
      port,
      packet.messageid,
      response_payload,
      strlen(response_payload),
      COAP_UNAUTHORIZED,
      COAP_TEXT_PLAIN,
 packet.token,packet.tokenlen );
    return;
  }
  if (!(memcmp(payload_string, access_token, strlen(access_token)) == 0)) {
    const char *response_payload = "wrong access token";
    Serial.println("Authentication failed!");
    coap.sendResponse(
      ip,
      port,
      packet.messageid,
      response_payload,
      strlen(response_payload),
      COAP_UNAUTHORIZED,
      COAP_TEXT_PLAIN,
 packet.token,packet.tokenlen );
    return;
  }

  long temperature = random(0, 100);
  char response_payload[16];
  sprintf(response_payload, "%ld", temperature);
  coap.sendResponse(ip, port, packet.messageid, response_payload, strlen(response_payload));
  Serial.print("Resposne sent to ");
  Serial.println(ip);
}

void callback_set_led(CoapPacket &packet, IPAddress ip, int port) {
  Serial.print("/set_led : request from : ");
  Serial.print(ip);
  Serial.print(" port :");
  Serial.println(port);

 char *payload_string = (char *)malloc(packet.payloadlen + 1);
  if (payload_string == NULL) {
    Serial.println("Memory allocation failed!");
    const char *response_payload = "payload memory allocation failed";
    coap.sendResponse(
      ip,
      port,
      packet.messageid,
      response_payload,
      strlen(response_payload),
      COAP_INTERNAL_SERVER_ERROR,
      COAP_TEXT_PLAIN,
 packet.token,packet.tokenlen );
    return;
  }
  memcpy(payload_string, packet.payload, packet.payloadlen);
  payload_string[packet.payloadlen] = '\0';

  Serial.print("received payload : ");
  Serial.println(payload_string);

  if (strlen(payload_string) < strlen(access_token)) {
    const char *response_payload = "no access token provided";
    Serial.println("Error: Payload too short");
    coap.sendResponse(
      ip,
      port,
      packet.messageid,
      response_payload,
      strlen(response_payload),
      COAP_UNAUTHORIZED,
      COAP_TEXT_PLAIN,
 packet.token,packet.tokenlen );
    return;
  }
  if (!(memcmp(payload_string, access_token, strlen(access_token)) == 0)) {
    const char *response_payload = "wrong access token";
    Serial.println("Authentication failed!");
    coap.sendResponse(
      ip,
      port,
      packet.messageid,
      response_payload,
      strlen(response_payload),
      COAP_UNAUTHORIZED,
      COAP_TEXT_PLAIN,
 packet.token,packet.tokenlen );
    return;
  }
  const char *led_state = (char *)(payload_string + strlen(access_token));
  Serial.print("received led state : ");
  Serial.println(led_state);

  if (strcmp(led_state, "ON") == 0) {
    digitalWrite(D4, HIGH);
  } else if (strcmp(led_state, "OFF") == 0) {
    digitalWrite(D4, LOW);
  } else {
    coap.sendResponse(
      ip,
      port,
      packet.messageid,
      NULL,
      0,
      COAP_BAD_REQUEST, 
      COAP_NONE,
 packet.token,packet.tokenlen );
    return;
  }


  const char *response_payload = "OK!";
  coap.sendResponse(ip, port, packet.messageid, response_payload, strlen(response_payload));
  Serial.print("Resposne sent to !");
  Serial.println(ip);
}
