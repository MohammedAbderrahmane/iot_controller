import logging
import asyncio
import aiocoap

import random

import aiocoap.resource as Res
from aiocoap.numbers.contentformat import ContentFormat


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
        return_text.append(["Used protocol: %s." % request.remote.scheme])
        return_text.append("Request came from %s." % request.remote.hostinfo)
        return_text.append(
            "The server address used %s." %
            request.remote.hostinfo_local
        )

        return aiocoap.Message(content_format=ContentFormat.TEXT, payload="\n".join(return_text).encode("utf8"))


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


# logging setup
logging.basicConfig(level=logging.INFO)
logging.getLogger("coap-server").setLevel(logging.DEBUG)


async def main():
    # Resource tree creation
    root = Res.Site()

    root.add_resource([], Welcome())
    root.add_resource(["whoami"], WhoAmI())
    root.add_resource(["withpayload"], WithPayload())
    root.add_resource(["observable"], Observable(1))

    await aiocoap.Context.create_server_context(root)

    print("server running at : coap://localhost:5683")
    print("\tGET\t/")
    print("\tGET\t/whoami")
    print("\tGET\t/observable")
    print("\tPOST\t/withpayload")

    # Run forever
    await asyncio.get_running_loop().create_future()


if __name__ == "__main__":

    asyncio.run(main())
