import asyncio
import logging
import aiocoap

import secrets

import aiocoap.resource as Res
from aiocoap.numbers.contentformat import ContentFormat
from aiocoap.oscore_sitewrapper import *
from aiocoap.oscore import *
from aiocoap.transports.oscore import *
import glob
from dotenv import load_dotenv

import subprocess
from db import *

MAABE_ENCRYPTOR_SCRIPT = "encryptor/maabe-encryptor"
MAABE_AUTHS_PATH_PATTERN = "maabe-keys/auth_*_keys.json"
CERTIFICATE_PATH = "certificate/.crt"

load_dotenv()  # Loads from .env by default

objects_as_map = {}
authorities = []

PORT = int(os.getenv("PORT"))
IP_ADDRESS = os.getenv("IP_ADDRESS")
FOG_NAME = os.getenv("FOG_NAME")
FOG_DESCRIPTION = os.getenv("FOG_DESCRIPTION")
SERVER_URL = os.getenv("SERVER_URL")


def setup_objects_as_map():
    objects_list = read_iot_objects()
    
    for i in range(len(objects_list)):
        if objects_list[i]["date_enters"] is not None:
            objects_list[i]["date_enters"] = objects_list[i]["date_enters"].isoformat()
        
        objects_list[i]["date_creation"] = objects_list[i]["date_creation"].isoformat()
    
    print("--- object in db ---")
    for obj in objects_list:
        name = obj["name"]
        print(name)
        nested_obj = obj.copy()
        del nested_obj["name"]
        objects_as_map[name] = nested_obj


def notify_admin_object_joined(iot_object_id, ip_address, port):
    server_url = os.getenv("SERVER_URL") + "/api/objects/" + iot_object_id

    import requests

    data = {
        "port": port,
        "ipAddress": ip_address,
    }

    try:
        response = requests.put(server_url, json=data)
        response.raise_for_status()
        print("✅ Admin notified")
        return
    except Exception as e:
        print("---")
        print("📛 Failed to notify server : ", e)
        print("---")
    except requests.exceptions.RequestException as e:
        print("---")
        print("📛 Failed to notify server : ", e)
        print("---")

def register_fog_node():
    admin_regestry_endpoint = SERVER_URL + "/api/fognodes/from-fog"

    import hashlib
    import requests
    import base64
    import sys

    FOG_ID = base64.urlsafe_b64encode(hashlib.sha256(FOG_NAME.encode('utf-8')).digest()[:16]).decode('utf-8')


    try:
        with open(CERTIFICATE_PATH, "r") as cert_file:
            cert_pem = cert_file.read()
    except FileNotFoundError:
        print(f"--- 📛 Certificate file not found at {CERTIFICATE_PATH}")
        sys.exit(1)
    except PermissionError:
        print(f"--- 📛 Permission denied when accessing {CERTIFICATE_PATH}")
        sys.exit(1)
    except Exception as e:
        print(f"--- 📛 Could not read certificate file {str(e)}")
        sys.exit(1)

    data = {
        "port": PORT,
        "id": FOG_ID,
        "name": FOG_NAME,
        "description": FOG_DESCRIPTION,
        "certificate": cert_pem,
    }
    print(f"--- Regestring fog node ... ---")
    print(f"  port: {PORT}")
    print(f"  id: {FOG_ID}")
    print(f"  name: {FOG_NAME}")
    print(f"  description: {FOG_DESCRIPTION}")
    print(f"---")

    try:
        response = requests.post(admin_regestry_endpoint, json=data)
        response.raise_for_status()
        print("✅ Fog node is now registered in admin")
        return True
    except Exception as e:
        print("\n📛 Fog node failed to register to admin : ", e)
        return False

def fetch_authorities():
    server_url = SERVER_URL + "/api/auths/"

    import requests
    auths = []
    print("\n--- Retreiving authorities public keys ... ---")
    try:
        response = requests.get(server_url)
        response.raise_for_status()

        e = response.json()
        for item in e:
            new_entry = {
                "authority": item["ID"],
                "url": f"http://{item['host']}:{item['port']}"
            }
            authorities.append(new_entry)
            print(f"  retreived authority : {item['ID']}")
            with open(f"maabe-keys/auth_{item['ID']}_keys.json", "w", encoding="utf-8") as file:
                file.write(json.dumps(item))

        print("✅ Fog node retreived auths from admin")
    except Exception as e:
        print("\n📛 fog node failed to retreive auths HTTPError: ", e)
        print("\n--- Loading authorities from local storage ... ---")

        filepaths = glob.glob(MAABE_AUTHS_PATH_PATTERN)

        if not filepaths:
            print("📛 No authorities found.")
        else:
            for filepath in filepaths:
                with open(filepath, 'r') as f:
                    data = json.load(f)

                    new_entry = {
                        "authority": data["ID"],
                        "url": f"http://{data['host']}:{str(data['port'])}"
                    }
                    authorities.append(new_entry)
                    print(f"  authority found in local storage: {data['ID']}")


def generateCypherText(message, access_policy_str):
    params = [message, access_policy_str]
    result = subprocess.run([MAABE_ENCRYPTOR_SCRIPT] + params,
                            capture_output=True, text=True)

    if result.returncode == 0:
        return result.stdout
    else:
        return None

class RootRessource(Res.Resource):

    # get objects
    async def render_get(self, request):
        return aiocoap.Message(content_format=ContentFormat.TEXT,
                               code=aiocoap.CREATED,
                               payload="OK".encode('utf-8'))


# GET/POST/PUT
class IoTObjects(Res.Resource):

    # get objects
    async def render_get(self, request):
        objects_list = []
        for name, data in objects_as_map.items():
            full_object = {"name": name, **data}
            objects_list.append(full_object)

        return aiocoap.Message(content_format=ContentFormat.TEXT,
                               code=aiocoap.CREATED,
                               payload=json.dumps(objects_list).encode('utf-8'))

    # admin enter a new IoT object
    async def render_post(self, request):
        payload = request.payload.decode('utf-8')
        try:
            import json
            object_map = json.loads(payload)

        except Exception as e:
            print(f"Failled to add the IoT object : wrong format")
            return aiocoap.Message(content_format=ContentFormat.TEXT, code=aiocoap.BAD_REQUEST, payload=b"failed to parse data")

        create_iot_object(object_map["id"], object_map["name"], object_map["description"], object_map["accessPolicy"])

        print(f"The IoT object : {object_map['name']} is added to fog node by the admin")
        print(f"\taccess policy: {object_map['accessPolicy']}")
        print(f"\tdescription: {object_map['description']}")
        
        objects_as_map[object_map["name"]] = {k: v for k, v in object_map.items() if k != "name"}
        
        return aiocoap.Message(content_format=ContentFormat.TEXT, payload="ACK".encode("utf8"))

    # admin delete a IoT object
    async def render_put(self, request):
        payload = request.payload.decode('utf-8')
        try:
            import json
            payload_json = json.loads(payload)

        except Exception as e:
            print(f"Failled to add the IoT object : wrong format")
            return aiocoap.Message(content_format=ContentFormat.TEXT, code=aiocoap.BAD_REQUEST, payload=b"failed to parse data")

        if payload_json['action'] == "DELETE":
            print(f"deleting the IoT object : {payload_json['objectName']} from the fog node")
            del objects_as_map[payload_json['objectName']]
            delete_iot_object(payload_json['objectName'])
            return aiocoap.Message(content_format=ContentFormat.TEXT, payload="ACK".encode("utf8"))

        print(f"updating the IoT object : {payload_json['objectName']} in the fog node")

        print(payload_json)
        update_iot_object(payload_json['objectName'],
        description=payload_json['data']['description'],
        access_policy=payload_json['data']['access_policy'],
        )
        objects_as_map[payload_json['objectName']]['description'] = payload_json['data']['description']
        objects_as_map[payload_json['objectName']]['accessPolicy'] = payload_json['data']['access_policy']

        if 'encryptedToken' in objects_as_map.get(payload_json['objectName'], {}):
            del objects_as_map[payload_json['objectName']]['encryptedToken']
            del objects_as_map[payload_json['objectName']]['ipAddress']
            del objects_as_map[payload_json['objectName']]['port']
            del objects_as_map[payload_json['objectName']]['date_enters']

        return aiocoap.Message(content_format=ContentFormat.TEXT, payload="ACK".encode("utf8"))


class ObjectRegister(Res.Resource):

    # IoT object register itself
    async def render_post(self, request):
        object_name = request.payload.decode('utf-8')


        print(f"Reveived entering request from IoT object : {object_name}")
        if "accessPolicy" not in objects_as_map.get(object_name, {}) or objects_as_map[object_name]["accessPolicy"] is None:
            print(f"no access policy defined for {object_name}")
            return aiocoap.Message(content_format=ContentFormat.TEXT, code=aiocoap.BAD_REQUEST, payload=b"object is not yet defined")

        token = secrets.token_urlsafe(32)
        from datetime import datetime
        update_iot_object(object_name,date_enters=datetime.now())

        cyphertext = generateCypherText(
            token,
            objects_as_map[object_name]['accessPolicy']
        )
        objects_as_map[object_name]['encryptedToken'] = cyphertext
        objects_as_map[object_name]['ipAddress'] = request.remote.hostinfo
        objects_as_map[object_name]['port'] = "5683"

        notify_admin_object_joined(object_name, request.remote.hostinfo, "5683")

        print(f"\t--- token of {object_name} ---")
        print(token)
        print(f"\t--- encrypted token of {object_name} ---")
        print(cyphertext)
        print("\t------")

        return aiocoap.Message(content_format=ContentFormat.TEXT,
                               code=aiocoap.CREATED,
                               payload=token.encode())


class AuthorityResource(Res.Resource):

    async def render_get(self, request):
        return aiocoap.Message(content_format=ContentFormat.TEXT,
                               code=aiocoap.CREATED,
                               payload=json.dumps(authorities).encode('utf-8'))


async def main():
    root = Res.Site()

    root.add_resource(["ping"], RootRessource())
    root.add_resource(["objects"], IoTObjects())
    root.add_resource(["register"], ObjectRegister())
    root.add_resource(["authorities"], AuthorityResource())

    coap_context = await aiocoap.Context.create_server_context(
        root, bind=(IP_ADDRESS, PORT)
    )

    print(f"\nFog node running at: coap://{IP_ADDRESS}:{PORT}")

    print("-" * 50)
    print(f"{'GET':<8} {'/ping':<20} Test if fog node is online")
    print(f"{'GET':<8} {'/objects':<20} User gets all objects")
    print(f"{'POST':<8} {'/objects':<20} Admin sends new IoT object definition")
    print(f"{'PUT':<8} {'/objects':<20} Admin update an existing IoT object")
    print(f"{'POST':<8} {'/register':<20} IoT object enters the network")
    print(f"{'GET':<8} {'/authorities':<20} User gets the authorities public keys")

    # Run forever
    await asyncio.get_running_loop().create_future()


if __name__ == "__main__":
    setup_objects_as_map()
    can_fetch = register_fog_node()
    if can_fetch:
        fetch_authorities()
    asyncio.run(main())
