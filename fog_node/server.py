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
    "1": {
        "ip_address": "192.168.100",
        "port": "5683",
        "oscore_context": {
            "sender-id_ascii": "client",
            "recipient-id_ascii": "iot",
            "secret_ascii": "0000"
        },
        "accessPolicy": "( tlemcen:prof OR tlemcen:etudiant )"
    }
}


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
        tokenCyphered = iot_objects.get(payload).get("tokenCyphred")
        return aiocoap.Message(content_format=ContentFormat.TEXT, payload=tokenCyphered.encode("utf8"))


logging.basicConfig(level=logging.DEBUG)
logging.getLogger("coap-server.oscore-site").setLevel(logging.DEBUG)


async def main():

    # from aiocoap.credentials import CredentialsMap

    # credentials_dict = {
    #     "coap://192.168.1.100/*": {
    #         "oscore": {
    #             "basedir": "./oscore_context"
    #         }
    #     },
    # }

    # client_credentials_dict = {
    #     "coap://192.168.1.100/*": {
    #         "oscore": {
    #             "basedir": "./oscore_context_client"
    #         }
    #     },
    # }

    # # Create and load credentials map
    # credentials = CredentialsMap()
    # credentials.load_from_dict(credentials_dict)

    root = Res.Site()
    # root_secured = OscoreSiteWrapper(root, credentials)

    root.add_resource([], Welcome())
    root.add_resource(["whoami"], WhoAmI())
    root.add_resource(["withpayload"], WithPayload())
    root.add_resource(["objects"], ObjectToken())
    root.add_resource(["observable"], Observable(1))

    coap_context = await aiocoap.Context.create_server_context(
        root, bind=('0.0.0.0', 5683)
    )

    print("server running at : coap://localhost:5683")
    print("\tGET\t/")
    print("\tGET\t/whoami")
    print("\tGET\t/observable")
    print("\tPOST\t/withpayload")
    print("\tPOST\t/objects")

    for key, value in iot_objects.items():
        coap_context = await aiocoap.protocol.Context.create_client_context()
        # coap_context.client_credentials.load_from_dict({
        #     "coap://192.168.1.12/*": {"oscore": {"basedir": "oscore_context_client/"}}
        # })

        # oscore_conf = FilesystemSecurityContext("oscore_context_client")
        # oscore_context = TransportOSCORE(coap_context,coap_context)
        request = aiocoap.Message(
            code=aiocoap.GET, uri=f"coap://{value.get('ip_address')}:{value.get('port')}/.well-known/info")
        requester = coap_context.request(request)

        response = await requester.response

        value['token'] = response.payload.decode()
        cyphertext = generateCypherText(
            value.get("token"),
            value['accessPolicy']
        )
        value['tokenCyphred'] = cyphertext

    # Run forever
    await asyncio.get_running_loop().create_future()


if __name__ == "__main__":

    asyncio.run(main())
