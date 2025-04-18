import asyncio
import logging
import aiocoap

import random

import aiocoap.resource as Res
from aiocoap.numbers.contentformat import ContentFormat
from aiocoap.oscore_sitewrapper import *
from aiocoap.oscore import *
from aiocoap.transports.oscore import *

import subprocess
MAABE_ENCRYPTOR_SCRIPT = "encryptor/maabe-encryptor"

iot_objects = {
}

PORT = 5683
IP_ADDRESS = "0.0.0.0"

def generateCypherText(message, access_policy_str):
    params = [message, access_policy_str]
    result = subprocess.run([MAABE_ENCRYPTOR_SCRIPT] + params,
                            capture_output=True, text=True)

    if result.returncode == 0:
        return result.stdout
    else:
        exit(1)


class Welcome(Res.Resource):
    representations = {
        ContentFormat.TEXT: b"Welcome to the demo server",
    }
    default_representation = ContentFormat.TEXT

    async def render_get(self, request):
        cf = (
            self.default_representation
            if request.opt.accept is None
            else request.opt.accept
        )

        try:
            return aiocoap.Message(payload=self.representations[cf], content_format=cf)
        except KeyError:
            raise aiocoap.error.UnsupportedContentFormat


class WhoAmI(Res.Resource):

    async def render_get(self, request):
        return_text = []
        return_text.append("Used protocol: %s." % request.remote.scheme)
        return_text.append("Request came from %s." % request.remote.hostinfo)
        return_text.append(
            "The server address used %s." % 
            request.remote.hostinfo_local
        )
        payload = "\n".join(return_text).encode("utf8")

        return aiocoap.Message(content_format=ContentFormat.TEXT, payload=payload)


class WithPayload(Res.Resource):

    async def render_post(self, request):
        payload = request.payload.decode('utf-8')

        return_text = "received your payload and it is sent to you %s" % payload

        return aiocoap.Message(content_format=ContentFormat.TEXT, payload=return_text.encode("utf8"))


class Observable(Res.ObservableResource):

    def __init__(self, time):
        super().__init__()
        self.time = time
        self.handle = None
        self.current_number = None

    def notify(self):
        self.current_number = str(random.randint(0, 100)).encode('utf-8')
        # response = aiocoap.Message(payload=self.current_number)

        self.updated_state()
        print("sent %s" % self.current_number)
        self.reschedule()

    def reschedule(self):
        self.handle = asyncio.get_event_loop().call_later(self.time, self.notify)

    # count : number of observers
    def update_observation_count(self, count):
        if count and self.handle is None:
            print("Starting observations")

            self.current_number = str(random.randint(0, 100)).encode('utf-8')
            self.reschedule()
        if count == 0 and self.handle:
            print("Stopping observations as there are no observers")

            self.handle.cancel()
            self.handle = None

    async def render_get(self, request):
        if self.current_number is None:
            self.current_number = str(random.randint(0, 100)).encode('utf-8')
        return aiocoap.Message(payload=self.current_number)


class ObjectToken(Res.Resource):

    async def render_post(self, request):
        payload = request.payload.decode('utf-8')

        if iot_objects.get(payload) == None:
            return aiocoap.Message(content_format=ContentFormat.TEXT, code=aiocoap.BAD_REQUEST, payload=tokenCyphered.encode("utf8"))
        tokenCyphered = iot_objects.get(payload).get("encrypted_token")
        return aiocoap.Message(content_format=ContentFormat.TEXT, payload=tokenCyphered.encode("utf8"))


class AllObject(Res.Resource):

    async def render_get(self, request):
        iot_array = []

        for name, info in iot_objects.items():
            device = {"name": name}
            device.update(info)
            iot_array.append(device)
            
        response_payload = json.dumps(iot_array)
        
        return aiocoap.Message(content_format=ContentFormat.TEXT, payload=response_payload.encode("utf8"))

    async def render_post(self,request):
        payload = request.payload.decode('utf-8')   
        if payload == None:
            return aiocoap.Message(content_format=ContentFormat.TEXT, code=aiocoap.BAD_REQUEST, payload=b"payload empty")

        try:
            import json
            object_map = json.loads(request.payload)

        except Exception as e:
            return aiocoap.Message(content_format=ContentFormat.TEXT, code=aiocoap.BAD_REQUEST, payload=b"failed to parse data")

        iot_objects[object_map["name"]] = {
            **iot_objects.get(object_map["name"], {}),
            "access_policy": object_map["accessPolicy"]
        }
        print(iot_objects)
        return aiocoap.Message(content_format=ContentFormat.TEXT, payload="ACK".encode("utf8"))

    async def render_put(self, request):
        object_id = request.payload.decode('utf-8')  

        del iot_objects[object_id]
        return aiocoap.Message(content_format=ContentFormat.TEXT, payload="ACK".encode("utf8"))

                
class ObjectRegister(Res.Resource):

    async def render_post(self, request):
        object_id = request.payload.decode('utf-8')
        

        print (object_id)
        if "access_policy" not in iot_objects.get(object_id, {}) or iot_objects[object_id]["access_policy"] is None:
            return aiocoap.Message(content_format=ContentFormat.TEXT, code=aiocoap.BAD_REQUEST, payload=b"object is not yet defined")

        import secrets
        token = secrets.token_urlsafe(32)

        cyphertext = generateCypherText(
            token,
            iot_objects[object_id]['access_policy']
        )
        iot_objects[object_id]['encrypted_token'] =       cyphertext
        iot_objects[object_id]['ip_address'] = request.remote.hostinfo
        iot_objects[object_id]['port'] = "5683"                        

        return aiocoap.Message(content_format=ContentFormat.TEXT,
                                code=aiocoap.CREATED,
                                payload=token.encode())

class AllAttributes(Res.Resource):

    async def render_get(self, request):

        import glob
        
        all_attributes = []
        search_path = os.path.join("maabe-keys", "auth_*.json")

        matching_files = glob.glob(search_path)

        if not matching_files:
            response_payload = json.dumps(all_attributes)
            return aiocoap.Message(content_format=ContentFormat.JSON, payload=response_payload.encode("utf8"))
        for file_path in matching_files:
            try:
                if not os.path.isfile(file_path):
                    continue
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    attributes_list = data.get("attributes")                
                    all_attributes.extend(attributes_list)
            except Exception:
                continue
        response_payload = json.dumps(all_attributes)
        return aiocoap.Message(content_format=ContentFormat.JSON, payload=response_payload.encode("utf8"))

    async def render_post(self,request):
        payload = request.payload.decode('utf-8')   
        if payload == None:
            return aiocoap.Message(content_format=ContentFormat.TEXT, code=aiocoap.BAD_REQUEST, payload=b"payload empty")

        try:
            import json
            new_auth = json.loads(request.payload)

        except Exception as e:
            return aiocoap.Message(content_format=ContentFormat.TEXT, code=aiocoap.BAD_REQUEST, payload=b"failed to parse data")
        
        with open(f"maabe-keys/auth_{new_auth['ID']}_keys.json", 'w') as f:
            json.dump(new_auth["Pk"], f, indent=4)


logging.basicConfig(level=logging.DEBUG)
logging.getLogger("coap-server.oscore-site").setLevel(logging.DEBUG)


async def main():

    from aiocoap.credentials import CredentialsMap

    credentials_dict = {
        "coap://192.168.1.100/*": {
            "oscore": {
                "basedir": "./oscore_context"
            }
        },
    }

    # Create and load credentials map
    credentials = CredentialsMap()
    credentials.load_from_dict(credentials_dict)

    root = Res.Site()
    root_secured = OscoreSiteWrapper(root, credentials)

    root.add_resource([], Welcome())
    root.add_resource(["whoami"], WhoAmI())
    root.add_resource(["withpayload"], WithPayload())
    root.add_resource(["register"], ObjectRegister())
    root.add_resource(["objects"], ObjectToken())
    root.add_resource(["objects", "all"], AllObject())
    root.add_resource(["observable"], Observable(1))
    root.add_resource(["attributes"], AllAttributes())

    coap_context = await aiocoap.Context.create_server_context(
        root_secured, bind=(IP_ADDRESS, PORT)
    )

    print(f"server running at : coap://{IP_ADDRESS}:{PORT}")
    print("\tGET\t/")
    print("\tGET\t/whoami")
    print("\tGET\t/observable")
    print("\tPOST\t/withpayload")
    print("\tPOST\t/objects")
    print("\tGET\t/objects/all")
    print("\tPOST\t/objects/all")
    print("\tPUT\t/objects/all")
    print("\tPOST\t/register")
    print("\tGET\t/attributes")
    print("\tPOST\t/attributes")

    # Run forever
    await asyncio.get_running_loop().create_future()


if __name__ == "__main__":

    asyncio.run(main())
