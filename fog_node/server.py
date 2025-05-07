import asyncio
import logging
import aiocoap

import random

import aiocoap.resource as Res
from aiocoap.numbers.contentformat import ContentFormat
from aiocoap.oscore_sitewrapper import *
from aiocoap.oscore import *
from aiocoap.transports.oscore import *
import glob
from dotenv import load_dotenv

import subprocess
MAABE_ENCRYPTOR_SCRIPT = "encryptor/maabe-encryptor"
MAABE_AUTHS_PATH_PATTERN = "maabe-keys/auth_*_keys.json"

load_dotenv()  # Loads from .env by default

map_iot_objects = {}
authorities = []

PORT = int(os.getenv("PORT"))
IP_ADDRESS = os.getenv("IP_ADDRESS")
FOG_NAME = os.getenv("FOG_NAME")
FOG_DESCRIPTION = os.getenv("FOG_DESCRIPTION")


def notify_object_join (iot_object_id, ip_address, port):
    server_url = os.getenv("SERVER_URL") + "/api/objects/" + iot_object_id
    
    import requests
    
    data = {
    "port": port,
    "ipAddress": ip_address,
    }
    
    try:
        response = requests.put(server_url, json=data)  
        response.raise_for_status()
        print("fog node is now notified")
        return
    except requests.exceptions.HTTPError as e:
        print("fog node failed to notify server : ", e)
    except requests.exceptions.RequestException as e:
        print("fog node failed to notify server : ", e)


def register_fog_node ():
    server_url = os.getenv("SERVER_URL") + "/api/fognodes/"
    
    import hashlib
    import requests

    # Encode the string and hash it using SHA-256
    fog_id = hashlib.sha256(FOG_NAME.encode()).hexdigest()[:10]

    data = {
    "port": PORT,
    "id": fog_id,
    "name": FOG_NAME,
    "description": FOG_DESCRIPTION,
    }
    print("Regestring fog node :")
    print(json.dumps(data, indent=2))
    
    try:
        response = requests.post(server_url, json=data)
        response.raise_for_status()
        print("fog node is now registered")
        return
    except requests.exceptions.HTTPError as e:
        print("fog node failed to register : ", e)
    except requests.exceptions.RequestException as e:
        print("fog node failed to register : ", e)
    exit(1)


def fetch_authorities ():
    server_url = os.getenv("SERVER_URL") + "/api/auths/"
    
    import requests
    try:
        response = requests.get(server_url)
        response.raise_for_status()
        
        e = response.json()
        for item in e:
            with open(f"maabe-keys/auth_{item['ID']}_keys.json", "w", encoding="utf-8") as file:
                file.write(json.dumps(item))
        
        print("fog node retreived auths")
        return
    except requests.exceptions.HTTPError as e:
        print("fog node failed to retreive auths : ", e)
    except requests.exceptions.RequestException as e:
        print("fog node failed to retreive auths : ", e)
    
    # TODO : fetch pk authorities from admin 
    auths = []
    for filepath in glob.glob(MAABE_AUTHS_PATH_PATTERN):
        with open(filepath, 'r') as f:
            data = json.load(f)

            new_entry = {
                "ID": data["ID"],
                "port": str(data["port"]),
                "host": data["host"]
            }
            auths.append(new_entry)
    return auths


def generateCypherText(message, access_policy_str):
    params = [message, access_policy_str]
    result = subprocess.run([MAABE_ENCRYPTOR_SCRIPT] + params,
                            capture_output=True, text=True)

    if result.returncode == 0:
        return result.stdout
    else:
        return None


# GET/POST/PUT
class IoTObjects(Res.Resource):

    # admin enter a new IoT object
    async def render_post(self, request):
        payload = request.payload.decode('utf-8')   
        try:
            import json
            object_map = json.loads(payload)

        except Exception as e:
            print(f"Failled to add the IoT object : wrong format")
            return aiocoap.Message(content_format=ContentFormat.TEXT, code=aiocoap.BAD_REQUEST, payload=b"failed to parse data")
        
        map_iot_objects[object_map["name"]] = {
            "accessPolicy": object_map["accessPolicy"],
            "description": object_map["description"]
        }
        print(f"adding the IoT object : {object_map['name']} from the admin")
        print(f"\taccess policy: {object_map['accessPolicy']}")
        print(f"\tdescription: {object_map['description']}")

        return aiocoap.Message(content_format=ContentFormat.TEXT, payload="ACK".encode("utf8"))

    # admin delete a IoT object
    async def render_put(self, request):
        object_id = request.payload.decode('utf-8')  
        print(f"deleting the IoT object : {object_id} from the fog node")

        del map_iot_objects[object_id]
        return aiocoap.Message(content_format=ContentFormat.TEXT, payload="ACK".encode("utf8"))

                
class ObjectRegister(Res.Resource):

    # IoT object register itself
    async def render_post(self, request):
        object_id = request.payload.decode('utf-8')

        print(f"Reveived request from IoT object : {object_id}")
        if "accessPolicy" not in map_iot_objects.get(object_id, {}) or map_iot_objects[object_id]["accessPolicy"] is None:
            print(f"no access policy defined for {object_id}")
            return aiocoap.Message(content_format=ContentFormat.TEXT, code=aiocoap.BAD_REQUEST, payload=b"object is not yet defined")

        import secrets
        token = secrets.token_urlsafe(32)


        cyphertext = generateCypherText(
            token,
            map_iot_objects[object_id]['accessPolicy']
        )
        map_iot_objects[object_id]['encryptedToken'] = cyphertext
        map_iot_objects[object_id]['ipAddress'] = request.remote.hostinfo
        map_iot_objects[object_id]['port'] = "5683"
        
        notify_object_join(object_id, request.remote.hostinfo, "5683")
        
        print(f"\t--- token of {object_id} ---")
        print(token)
        print(f"\t--- encrypted token of {object_id} ---")
        print(cyphertext)
        print("\t------")

        return aiocoap.Message(content_format=ContentFormat.TEXT,
                                code=aiocoap.CREATED,
                                payload=token.encode())

     # get IoT object from fog node
    
    async def render_put(self, request):
        selected_iot_name = request.payload.decode('utf-8')
        iot_array = []

        response_payload = ""
        for name, info in map_iot_objects.items():
            if selected_iot_name == name:
                response_payload = map_iot_objects[name]["encryptedToken"]

        if response_payload == "":
            return aiocoap.Message(content_format=ContentFormat.TEXT, code=aiocoap.BAD_REQUEST, payload=b"object not found in fog node")
        
        return aiocoap.Message(content_format=ContentFormat.TEXT, payload=response_payload.encode("utf8"))


async def main():

    root = Res.Site()

    root.add_resource(["objects"], IoTObjects())
    root.add_resource(["register"], ObjectRegister())

    coap_context = await aiocoap.Context.create_server_context(
        root, bind=(IP_ADDRESS, PORT)
    )

    print(f"\nFog node running at: coap://{IP_ADDRESS}:{PORT}\n")

    print("Available Endpoints:")
    print(f"{'METHOD':<8} {'ENDPOINT':<20} DESCRIPTION")
    print("-" * 50)
    print(f"{'POST':<8} {'/objects':<20} Create new IoT object")
    print(f"{'PUT':<8} {'/objects':<20} Update existing IoT object")
    print(f"{'POST':<8} {'/register':<20} Register new IoT object")
    print(f"{'PUT':<8} {'/register':<20} Get the token if an IoT object")

    # Run forever
    await asyncio.get_running_loop().create_future()


if __name__ == "__main__":
    register_fog_node()
    authorities = fetch_authorities()
    asyncio.run(main())
