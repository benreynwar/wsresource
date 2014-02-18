from twisted.internet import reactor
from autobahn.twisted.websocket import listenWS

from wsresource import protocol

class Fish(object):

    def __init__(self, data):
        self.id = data.get('id', None)
        self.resource = data.get('resource', None)
        self.color = data.get('color', None)

    def to_json(self):
        data = {'id': self.id,
                'color': self.color,
                'resource': self.resource
        }
        return data

repositories = {}
def register_repository(repository):
    repositories[repository.resource] = repository

if __name__ == '__main__':
    ws_address = 'ws://localhost:9407'
    factory = protocol.WSResourceV1Factory(
        repositories,
        ws_address, debug = False,
        debugCodePaths = False)
    factory.protocol = protocol.WSResourceV1Protocol
    factory.setProtocolOptions(allowHixie76 = True)

    fish_repository = protocol.Repository('fish', Fish, factory)
    register_repository(fish_repository)

    listenWS(factory)
    reactor.run()

